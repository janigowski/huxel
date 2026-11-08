import type { HttpClient } from './http';

export interface FetchHttpClientOptions {
	fetch?: typeof globalThis.fetch;
}

export function createFetchHttpClient(options: FetchHttpClientOptions = {}): HttpClient {
	return {
		async request(request) {
			const fetchFn = options.fetch ?? globalThis.fetch;
			const response = await fetchFn(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
				signal: request.signal
			});
			return {
				status: response.status,
				headers: response.headers,
				body: await response.text()
			};
		},
		async stream(request) {
			const fetchFn = options.fetch ?? globalThis.fetch;
			const response = await fetchFn(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
				signal: request.signal
			});
			return {
				status: response.status,
				headers: response.headers,
				body: decodeBody(response.body)
			};
		}
	};
}

async function* decodeBody(body: ReadableStream<Uint8Array> | null): AsyncGenerator<string> {
	if (!body) {
		return;
	}
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let finished = false;
	try {
		for (;;) {
			const result = await reader.read();
			if (result.done) {
				finished = true;
				break;
			}
			const text = decoder.decode(result.value, { stream: true });
			if (text !== '') {
				yield text;
			}
		}
		const rest = decoder.decode();
		if (rest !== '') {
			yield rest;
		}
	} finally {
		if (!finished) {
			await reader.cancel().catch(() => undefined);
		}
		reader.releaseLock();
	}
}
