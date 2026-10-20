export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface HttpRequest {
	method: HttpMethod;
	url: string;
	headers?: Record<string, string>;
	body?: string;
	signal?: AbortSignal;
}

export interface HttpResponse {
	status: number;
	headers: Headers;
	body: string;
}

export interface HttpStreamResponse {
	status: number;
	headers: Headers;
	body: AsyncIterable<string>;
}

/**
 * Executes HTTP requests. Implementations must resolve for every HTTP status code
 * and reject only when no response was received (network failure, cancellation).
 */
export interface HttpClient {
	request(request: HttpRequest): Promise<HttpResponse>;
	stream?(request: HttpRequest): Promise<HttpStreamResponse>;
}
