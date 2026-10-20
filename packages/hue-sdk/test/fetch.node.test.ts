import { createServer } from 'node:http';
import type { IncomingHttpHeaders, IncomingMessage, Server, ServerResponse } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createFetchHttpClient } from '../src/fetch.js';

interface ReceivedRequest {
	method: string;
	url: string;
	headers: IncomingHttpHeaders;
	body: string;
}

type Handler = (request: ReceivedRequest, response: ServerResponse) => void;

const servers: Server[] = [];

function portOf(server: Server): number {
	const address = server.address();
	if (!address || typeof address === 'string') {
		throw new Error('Server is not listening on a TCP port');
	}
	return address.port;
}

async function startServer(handler: Handler) {
	const received: ReceivedRequest[] = [];
	const server = createServer((request: IncomingMessage, response: ServerResponse) => {
		const chunks: Buffer[] = [];
		request.on('data', (chunk: Buffer) => chunks.push(chunk));
		request.on('end', () => {
			const entry: ReceivedRequest = {
				method: request.method ?? '',
				url: request.url ?? '',
				headers: request.headers,
				body: Buffer.concat(chunks).toString('utf8')
			};
			received.push(entry);
			handler(entry, response);
		});
	});
	servers.push(server);
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	return { baseUrl: `http://127.0.0.1:${portOf(server)}`, received, server };
}

function reply(status: number, body: string, headers: Record<string, string> = {}): Handler {
	return (_request, response) => {
		response.writeHead(status, headers);
		response.end(body);
	};
}

async function freePort(): Promise<number> {
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = portOf(server);
	await new Promise<void>((resolve) => server.close(() => resolve()));
	return port;
}

afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(server) =>
				new Promise<void>((resolve) => {
					server.close(() => resolve());
					server.closeAllConnections();
				})
		)
	);
});

describe('createFetchHttpClient against a real HTTP server', () => {
	it('sends method, path, query, headers and body over the wire', async () => {
		const { baseUrl, received } = await startServer(reply(200, '{"data":[]}'));
		const client = createFetchHttpClient();

		await client.request({
			method: 'PUT',
			url: `${baseUrl}/clip/v2/resource/light/abc?x=1`,
			headers: { 'hue-application-key': 'secret', 'content-type': 'application/json' },
			body: '{"on":{"on":true}}'
		});

		expect(received).toHaveLength(1);
		expect(received[0]?.method).toBe('PUT');
		expect(received[0]?.url).toBe('/clip/v2/resource/light/abc?x=1');
		expect(received[0]?.headers['hue-application-key']).toBe('secret');
		expect(received[0]?.headers['content-type']).toBe('application/json');
		expect(received[0]?.body).toBe('{"on":{"on":true}}');
	});

	it.each(['GET', 'POST', 'PUT', 'DELETE'] as const)('sends a %s request', async (method) => {
		const { baseUrl, received } = await startServer(reply(200, ''));
		const client = createFetchHttpClient();

		await client.request({
			method,
			url: `${baseUrl}/x`,
			...(method === 'GET' || method === 'DELETE' ? {} : { body: '{}' })
		});

		expect(received[0]?.method).toBe(method);
	});

	it('sends no body for requests without one', async () => {
		const { baseUrl, received } = await startServer(reply(200, ''));
		const client = createFetchHttpClient();

		await client.request({ method: 'GET', url: `${baseUrl}/x` });

		expect(received[0]?.body).toBe('');
	});

	it('transmits a UTF-8 request body intact', async () => {
		const text = '{"name":"Salon \u{1F4A1} Zażółć gęślą jaźń"}';
		const { baseUrl, received } = await startServer(reply(200, ''));
		const client = createFetchHttpClient();

		await client.request({ method: 'POST', url: `${baseUrl}/x`, body: text });

		expect(received[0]?.body).toBe(text);
	});

	it('returns status, headers and text body of a 200 response', async () => {
		const { baseUrl } = await startServer(
			reply(200, '{"errors":[],"data":[{"id":"1"}]}', {
				'content-type': 'application/json',
				'x-custom': 'value'
			})
		);
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'GET', url: `${baseUrl}/x` });

		expect(response.status).toBe(200);
		expect(response.body).toBe('{"errors":[],"data":[{"id":"1"}]}');
		expect(response.headers).toBeInstanceOf(Headers);
		expect(response.headers.get('content-type')).toBe('application/json');
		expect(response.headers.get('x-custom')).toBe('value');
	});

	it.each([207, 400, 401, 403, 404, 429, 500, 503])(
		'resolves with status %i instead of rejecting',
		async (status) => {
			const { baseUrl } = await startServer(
				reply(status, '{"errors":[{"description":"nope"}],"data":[]}', {
					'content-type': 'application/json',
					'retry-after': '2'
				})
			);
			const client = createFetchHttpClient();

			const response = await client.request({ method: 'GET', url: `${baseUrl}/x` });

			expect(response.status).toBe(status);
			expect(response.body).toBe('{"errors":[{"description":"nope"}],"data":[]}');
			expect(response.headers.get('retry-after')).toBe('2');
		}
	);

	it('returns an empty body for 204 responses', async () => {
		const { baseUrl } = await startServer((_request, response) => {
			response.writeHead(204);
			response.end();
		});
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'DELETE', url: `${baseUrl}/x` });

		expect(response.status).toBe(204);
		expect(response.body).toBe('');
	});

	it('returns a non-JSON body verbatim', async () => {
		const { baseUrl } = await startServer(
			reply(502, '<html>Bad Gateway</html>', { 'content-type': 'text/html' })
		);
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'GET', url: `${baseUrl}/x` });

		expect(response.status).toBe(502);
		expect(response.body).toBe('<html>Bad Gateway</html>');
	});

	it('decodes a UTF-8 response body as text', async () => {
		const text = '{"name":"Salon \u{1F4A1} Zażółć gęślą jaźń"}';
		const { baseUrl } = await startServer((_request, response) => {
			response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
			response.end(Buffer.from(text, 'utf8'));
		});
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'GET', url: `${baseUrl}/x` });

		expect(response.body).toBe(text);
	});

	it('returns a large body completely', async () => {
		const text = JSON.stringify({ data: 'x'.repeat(1_000_000) });
		const { baseUrl } = await startServer(reply(200, text));
		const client = createFetchHttpClient();

		const response = await client.request({ method: 'GET', url: `${baseUrl}/x` });

		expect(response.body.length).toBe(text.length);
	});

	it('rejects with the original network error when the connection is refused', async () => {
		const port = await freePort();
		const client = createFetchHttpClient();

		const failure = await client.request({ method: 'GET', url: `http://127.0.0.1:${port}/x` }).then(
			() => undefined,
			(error: unknown) => error
		);

		expect(failure).toBeInstanceOf(Error);
	});

	it('rejects with the error thrown by an injected fetch that hits a refused connection', async () => {
		const port = await freePort();
		let thrown: unknown;
		const client = createFetchHttpClient({
			fetch: async (input, init) => {
				try {
					return await fetch(input, init);
				} catch (error) {
					thrown = error;
					throw error;
				}
			}
		});

		const failure = await client.request({ method: 'GET', url: `http://127.0.0.1:${port}/x` }).then(
			() => undefined,
			(error: unknown) => error
		);

		expect(thrown).toBeDefined();
		expect(failure).toBe(thrown);
	});

	it('rejects with an AbortError when aborted while the server is still processing', async () => {
		let connectionReady: () => void = () => {};
		const requestReceived = new Promise<void>((resolve) => {
			connectionReady = resolve;
		});
		const { baseUrl } = await startServer(() => connectionReady());
		const controller = new AbortController();
		const client = createFetchHttpClient();

		const pending = client.request({
			method: 'GET',
			url: `${baseUrl}/x`,
			signal: controller.signal
		});
		await requestReceived;
		controller.abort();

		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	});

	it('rejects with an AbortError when the signal is already aborted', async () => {
		const { baseUrl, received } = await startServer(reply(200, ''));
		const controller = new AbortController();
		controller.abort();
		const client = createFetchHttpClient();

		await expect(
			client.request({ method: 'GET', url: `${baseUrl}/x`, signal: controller.signal })
		).rejects.toMatchObject({ name: 'AbortError' });
		expect(received).toHaveLength(0);
	});

	it('rejects with the abort reason when the signal is aborted with a custom reason', async () => {
		const { baseUrl } = await startServer(() => {});
		const controller = new AbortController();
		const reason = new Error('user cancelled');
		const client = createFetchHttpClient();

		const pending = client.request({
			method: 'GET',
			url: `${baseUrl}/x`,
			signal: controller.signal
		});
		setTimeout(() => controller.abort(reason), 20);

		await expect(pending).rejects.toBe(reason);
	});

	it('rejects with an AbortError when aborted while the body is still streaming', async () => {
		let headersSent: () => void = () => {};
		const sent = new Promise<void>((resolve) => {
			headersSent = resolve;
		});
		const { baseUrl } = await startServer((_request, response) => {
			response.writeHead(200, { 'content-type': 'text/plain' });
			response.write('partial');
			headersSent();
		});
		const controller = new AbortController();
		const client = createFetchHttpClient();

		const pending = client.request({
			method: 'GET',
			url: `${baseUrl}/x`,
			signal: controller.signal
		});
		await sent;
		setTimeout(() => controller.abort(), 20);

		await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
	});
});
