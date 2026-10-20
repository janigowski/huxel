import type { HttpClient } from './http.js';

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
		}
	};
}
