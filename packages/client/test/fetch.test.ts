import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { createFetchHttpClient } from '../src/fetch';

type FetchCall = { input: RequestInfo | URL; init: RequestInit | undefined };
type FetchHandler = (call: FetchCall) => Response | Promise<Response>;

function fakeFetch(handler: FetchHandler = () => new Response('')) {
	const calls: FetchCall[] = [];
	const fetchFn = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const call = { input, init };
		calls.push(call);
		return Promise.resolve().then(() => handler(call));
	};
	return { fetchFn, calls };
}

function firstCall(calls: FetchCall[]): FetchCall {
	const call = calls[0];
	if (!call) {
		throw new Error('fetch was not called');
	}
	return call;
}

function abortError(): Error {
	return new DOMException('The operation was aborted.', 'AbortError');
}

function abortAwareFetch() {
	return fakeFetch(
		({ init }) =>
			new Promise<Response>((_resolve, reject) => {
				const signal = init?.signal;
				if (!signal) {
					return;
				}
				if (signal.aborted) {
					reject(abortError());
					return;
				}
				signal.addEventListener('abort', () => reject(abortError()), { once: true });
			})
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('createFetchHttpClient request forwarding', () => {
	it('forwards url, method, headers, body and signal to fetch', async () => {
		const { fetchFn, calls } = fakeFetch();
		const controller = new AbortController();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await client.request({
			method: 'PUT',
			url: 'https://192.168.1.2/clip/v2/resource/light/abc',
			headers: { 'hue-application-key': 'key', 'content-type': 'application/json' },
			body: '{"on":{"on":true}}',
			signal: controller.signal
		});

		expect(calls).toHaveLength(1);
		const { input, init } = firstCall(calls);
		expect(input).toBe('https://192.168.1.2/clip/v2/resource/light/abc');
		expect(init?.method).toBe('PUT');
		expect(init?.headers).toEqual({
			'hue-application-key': 'key',
			'content-type': 'application/json'
		});
		expect(init?.body).toBe('{"on":{"on":true}}');
		expect(init?.signal).toBe(controller.signal);
	});

	it.each(['GET', 'POST', 'PUT', 'DELETE'] as const)('forwards the %s method', async (method) => {
		const { fetchFn, calls } = fakeFetch();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await client.request({ method, url: 'https://hue.local/x' });

		expect(firstCall(calls).init?.method).toBe(method);
	});

	it('does not invent a body, headers or signal when none are given', async () => {
		const { fetchFn, calls } = fakeFetch();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await client.request({ method: 'GET', url: 'https://hue.local/x' });

		const { init } = firstCall(calls);
		expect(init?.body).toBeUndefined();
		expect(init?.headers).toBeUndefined();
		expect(init?.signal).toBeUndefined();
	});

	it('forwards an empty string body as is', async () => {
		const { fetchFn, calls } = fakeFetch();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await client.request({ method: 'POST', url: 'https://hue.local/x', body: '' });

		expect(firstCall(calls).init?.body).toBe('');
	});

	it('performs one fetch call per request', async () => {
		const { fetchFn, calls } = fakeFetch();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await client.request({ method: 'GET', url: 'https://hue.local/a' });
		await client.request({ method: 'GET', url: 'https://hue.local/b' });

		expect(calls.map((call) => call.input)).toEqual(['https://hue.local/a', 'https://hue.local/b']);
	});
});

describe('createFetchHttpClient responses', () => {
	it('returns status, headers and body text of a successful response', async () => {
		const { fetchFn } = fakeFetch(
			() =>
				new Response('{"data":[]}', {
					status: 200,
					headers: { 'content-type': 'application/json', 'x-custom': 'value' }
				})
		);
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.status).toBe(200);
		expect(response.body).toBe('{"data":[]}');
		expect(response.headers).toBeInstanceOf(Headers);
		expect(response.headers.get('content-type')).toBe('application/json');
		expect(response.headers.get('X-Custom')).toBe('value');
	});

	it.each([201, 207, 400, 401, 403, 404, 429, 500, 503])(
		'resolves with status %i instead of rejecting',
		async (status) => {
			const { fetchFn } = fakeFetch(
				() => new Response('{"errors":[{"description":"nope"}]}', { status })
			);
			const client = createFetchHttpClient({ fetch: fetchFn });

			const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

			expect(response.status).toBe(status);
			expect(response.body).toBe('{"errors":[{"description":"nope"}]}');
		}
	);

	it('returns an empty string for an empty body', async () => {
		const { fetchFn } = fakeFetch(() => new Response(null, { status: 204 }));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.request({ method: 'DELETE', url: 'https://hue.local/x' });

		expect(response.status).toBe(204);
		expect(response.body).toBe('');
	});

	it('returns a non-JSON body verbatim', async () => {
		const { fetchFn } = fakeFetch(
			() =>
				new Response('<html>Bad Gateway</html>', {
					status: 502,
					headers: { 'content-type': 'text/html' }
				})
		);
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.body).toBe('<html>Bad Gateway</html>');
		expect(response.headers.get('content-type')).toBe('text/html');
	});

	it('decodes a UTF-8 body as text', async () => {
		const text = '{"name":"Salon \u{1F4A1} Zażółć gęślą jaźń"}';
		const { fetchFn } = fakeFetch(() => new Response(new TextEncoder().encode(text)));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.body).toBe(text);
	});

	it('exposes the same Headers instance fetch produced', async () => {
		const upstream = new Response('', { headers: { 'retry-after': '3' } });
		const { fetchFn } = fakeFetch(() => upstream);
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.headers.get('retry-after')).toBe('3');
	});
});

describe('createFetchHttpClient failures', () => {
	it('rejects with the original error when fetch rejects', async () => {
		const failure = new TypeError('Failed to fetch');
		const { fetchFn } = fakeFetch(() => Promise.reject(failure));
		const client = createFetchHttpClient({ fetch: fetchFn });

		await expect(client.request({ method: 'GET', url: 'https://hue.local/x' })).rejects.toBe(
			failure
		);
	});

	it('rejects with the original non-Error value when fetch rejects with one', async () => {
		const { fetchFn } = fakeFetch(() => Promise.reject('boom'));
		const client = createFetchHttpClient({ fetch: fetchFn });

		await expect(client.request({ method: 'GET', url: 'https://hue.local/x' })).rejects.toBe(
			'boom'
		);
	});

	it('rejects when fetch throws synchronously', async () => {
		const failure = new Error('sync failure');
		const fetchFn = (): Promise<Response> => {
			throw failure;
		};
		const client = createFetchHttpClient({ fetch: fetchFn });

		await expect(client.request({ method: 'GET', url: 'https://hue.local/x' })).rejects.toBe(
			failure
		);
	});

	it('rejects when reading the body fails', async () => {
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.error(new Error('stream broke'));
			}
		});
		const { fetchFn } = fakeFetch(() => new Response(body));
		const client = createFetchHttpClient({ fetch: fetchFn });

		await expect(
			client.request({ method: 'GET', url: 'https://hue.local/x' })
		).rejects.toBeInstanceOf(Error);
	});

	it('rejects with an AbortError when the signal is aborted while pending', async () => {
		const { fetchFn } = abortAwareFetch();
		const controller = new AbortController();
		const client = createFetchHttpClient({ fetch: fetchFn });

		const pending = client.request({
			method: 'GET',
			url: 'https://hue.local/x',
			signal: controller.signal
		});
		controller.abort();

		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('rejects with an AbortError when the signal is already aborted', async () => {
		const { fetchFn } = abortAwareFetch();
		const controller = new AbortController();
		controller.abort();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await expect(
			client.request({ method: 'GET', url: 'https://hue.local/x', signal: controller.signal })
		).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('rejects with the abort reason of the native fetch when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		const client = createFetchHttpClient({
			fetch: (input, init) => fetch(input, init)
		});

		await expect(
			client.request({ method: 'GET', url: 'http://127.0.0.1:1/x', signal: controller.signal })
		).rejects.toMatchObject({ name: 'AbortError' });
	});
});

describe('createFetchHttpClient fetch resolution', () => {
	it('uses globalThis.fetch by default', async () => {
		const { fetchFn, calls } = fakeFetch(() => new Response('global', { status: 202 }));
		vi.stubGlobal('fetch', fetchFn);
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'GET', url: 'https://hue.local/global' });

		expect(response.status).toBe(202);
		expect(response.body).toBe('global');
		expect(firstCall(calls).input).toBe('https://hue.local/global');
	});

	it('resolves globalThis.fetch at call time, not at creation time', async () => {
		const first = fakeFetch(() => new Response('first'));
		const second = fakeFetch(() => new Response('second'));
		vi.stubGlobal('fetch', first.fetchFn);
		const client = createFetchHttpClient();

		const before = await client.request({ method: 'GET', url: 'https://hue.local/x' });
		vi.stubGlobal('fetch', second.fetchFn);
		const after = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(before.body).toBe('first');
		expect(after.body).toBe('second');
		expect(first.calls).toHaveLength(1);
		expect(second.calls).toHaveLength(1);
	});

	it('can be created before globalThis.fetch is installed', async () => {
		vi.stubGlobal('fetch', undefined);
		const client = createFetchHttpClient();
		const { fetchFn } = fakeFetch(() => new Response('late'));
		vi.stubGlobal('fetch', fetchFn);

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.body).toBe('late');
	});

	it('prefers the injected fetch over globalThis.fetch', async () => {
		const injected = fakeFetch(() => new Response('injected'));
		const global = fakeFetch(() => new Response('global'));
		vi.stubGlobal('fetch', global.fetchFn);
		const client = createFetchHttpClient({ fetch: injected.fetchFn });

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.body).toBe('injected');
		expect(global.calls).toHaveLength(0);
	});

	it('does not call an injected fetch as a method of the options object', async () => {
		const receivers: unknown[] = [];
		const options = {
			fetch: function (this: unknown): Promise<Response> {
				receivers.push(this);
				if (this !== undefined && this !== globalThis) {
					return Promise.reject(new TypeError("Failed to execute 'fetch': Illegal invocation"));
				}
				return Promise.resolve(new Response('ok'));
			}
		};
		const client = createFetchHttpClient(options);

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.body).toBe('ok');
		expect(receivers).toHaveLength(1);
		expect(receivers[0]).not.toBe(options);
	});

	it('does not call globalThis.fetch with a foreign receiver', async () => {
		const receivers: unknown[] = [];
		vi.stubGlobal('fetch', function (this: unknown): Promise<Response> {
			receivers.push(this);
			if (this !== undefined && this !== globalThis) {
				return Promise.reject(new TypeError("Failed to execute 'fetch': Illegal invocation"));
			}
			return Promise.resolve(new Response('ok'));
		});
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'GET', url: 'https://hue.local/x' });

		expect(response.body).toBe('ok');
		expect(receivers).toHaveLength(1);
	});
});

async function collect(body: AsyncIterable<string>): Promise<string[]> {
	const chunks: string[] = [];
	for await (const chunk of body) {
		chunks.push(chunk);
	}
	return chunks;
}

function byteStream(chunks: Uint8Array[], onCancel?: (reason: unknown) => void) {
	let index = 0;
	return new ReadableStream<Uint8Array>({
		pull(controller) {
			const chunk = chunks[index++];
			if (chunk) {
				controller.enqueue(chunk);
			} else {
				controller.close();
			}
		},
		cancel(reason) {
			onCancel?.(reason);
		}
	});
}

describe('createFetchHttpClient stream', () => {
	it('forwards url, method, headers and signal to fetch', async () => {
		const { fetchFn, calls } = fakeFetch(() => new Response('data: x\n\n'));
		const controller = new AbortController();
		const client = createFetchHttpClient({ fetch: fetchFn });

		await client.stream?.({
			method: 'GET',
			url: 'https://hue.local/eventstream/clip/v2',
			headers: { accept: 'text/event-stream', 'hue-application-key': 'key' },
			signal: controller.signal
		});

		const { input, init } = firstCall(calls);
		expect(input).toBe('https://hue.local/eventstream/clip/v2');
		expect(init?.method).toBe('GET');
		expect(init?.headers).toEqual({ accept: 'text/event-stream', 'hue-application-key': 'key' });
		expect(init?.body).toBeUndefined();
		expect(init?.signal).toBe(controller.signal);
	});

	it('returns status, headers and the decoded body chunks', async () => {
		const encoder = new TextEncoder();
		const { fetchFn } = fakeFetch(
			() =>
				new Response(byteStream([encoder.encode(': hi\n\n'), encoder.encode('data: 1\n\n')]), {
					headers: { 'content-type': 'text/event-stream' }
				})
		);
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		expect(response?.status).toBe(200);
		expect(response?.headers.get('content-type')).toBe('text/event-stream');
		expect((await collect(response!.body)).join('')).toBe(': hi\n\ndata: 1\n\n');
	});

	it('decodes multi-byte characters split across chunks', async () => {
		const bytes = new TextEncoder().encode('data: Zażółć \u{1F4A1}\n\n');
		const chunks = Array.from(bytes, (byte) => Uint8Array.of(byte));
		const { fetchFn } = fakeFetch(() => new Response(byteStream(chunks)));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		expect((await collect(response!.body)).join('')).toBe('data: Zażółć \u{1F4A1}\n\n');
	});

	it.each([401, 403, 429, 503])('resolves with status %i instead of rejecting', async (status) => {
		const { fetchFn } = fakeFetch(() => new Response('nope', { status }));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		expect(response?.status).toBe(status);
		expect((await collect(response!.body)).join('')).toBe('nope');
	});

	it('treats a null body as an empty stream', async () => {
		const { fetchFn } = fakeFetch(() => new Response(null, { status: 204 }));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		expect(await collect(response!.body)).toEqual([]);
	});

	it('reads with getReader and does not need ReadableStream async iteration', async () => {
		const body = byteStream([new TextEncoder().encode('data: x\n\n')]);
		Object.defineProperty(body, Symbol.asyncIterator, { value: undefined });
		const { fetchFn } = fakeFetch(
			() => ({ status: 200, headers: new Headers(), body }) as unknown as Response
		);
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		expect(await collect(response!.body)).toEqual(['data: x\n\n']);
		expect(body.locked).toBe(false);
	});

	it('cancels the response body when iteration stops early', async () => {
		const encoder = new TextEncoder();
		const onCancel = vi.fn();
		const body = byteStream([encoder.encode('a'), encoder.encode('b')], onCancel);
		const { fetchFn } = fakeFetch(() => new Response(body));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });
		for await (const chunk of response!.body) {
			expect(chunk).toBe('a');
			break;
		}

		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it('rejects iteration when reading the body fails', async () => {
		const failure = new Error('stream broke');
		const body = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('data: 1\n'));
				controller.error(failure);
			}
		});
		const { fetchFn } = fakeFetch(() => new Response(body));
		const client = createFetchHttpClient({ fetch: fetchFn });

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		await expect(collect(response!.body)).rejects.toBe(failure);
	});

	it('rejects when fetch rejects', async () => {
		const failure = new TypeError('Failed to fetch');
		const { fetchFn } = fakeFetch(() => Promise.reject(failure));
		const client = createFetchHttpClient({ fetch: fetchFn });

		await expect(client.stream?.({ method: 'GET', url: 'https://hue.local/x' })).rejects.toBe(
			failure
		);
	});

	it('rejects with an AbortError when the signal is aborted while pending', async () => {
		const { fetchFn } = abortAwareFetch();
		const controller = new AbortController();
		const client = createFetchHttpClient({ fetch: fetchFn });

		const pending = client.stream?.({
			method: 'GET',
			url: 'https://hue.local/x',
			signal: controller.signal
		});
		controller.abort();

		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('uses globalThis.fetch resolved at call time', async () => {
		const client = createFetchHttpClient();
		const { fetchFn, calls } = fakeFetch(() => new Response('late'));
		vi.stubGlobal('fetch', fetchFn);

		const response = await client.stream?.({ method: 'GET', url: 'https://hue.local/x' });

		expect(calls).toHaveLength(1);
		expect((await collect(response!.body)).join('')).toBe('late');
	});
});
