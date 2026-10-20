import type { HttpClient, HttpRequest, HttpResponse } from '../src/http.js';

export interface MockReply {
	status?: number;
	body?: unknown;
	rawBody?: string;
	headers?: Record<string, string>;
}

export interface MockHttpClient extends HttpClient {
	readonly requests: HttpRequest[];
	readonly lastRequest: HttpRequest;
}

export function mockHttpClient(
	...replies: (MockReply | ((request: HttpRequest) => MockReply | Promise<MockReply>))[]
): MockHttpClient {
	const requests: HttpRequest[] = [];
	return {
		requests,
		get lastRequest() {
			const request = requests.at(-1);
			if (!request) {
				throw new Error('No request was sent');
			}
			return request;
		},
		async request(request) {
			requests.push(request);
			const next = replies.length > 1 ? replies.shift() : replies[0];
			if (!next) {
				throw new Error(`Unexpected request: ${request.method} ${request.url}`);
			}
			const reply = typeof next === 'function' ? await next(request) : next;
			return toResponse(reply);
		}
	};
}

export function failingHttpClient(error: unknown): MockHttpClient {
	return mockHttpClient(() => {
		throw error;
	});
}

export function envelope<T>(data: T[], errors: unknown[] = []): { errors: unknown[]; data: T[] } {
	return { errors, data };
}

export function parseBody(request: HttpRequest): unknown {
	return request.body === undefined ? undefined : JSON.parse(request.body);
}

function toResponse(reply: MockReply): HttpResponse {
	return {
		status: reply.status ?? 200,
		headers: new Headers(reply.headers ?? { 'content-type': 'application/json' }),
		body: reply.rawBody ?? (reply.body === undefined ? '' : JSON.stringify(reply.body))
	};
}
