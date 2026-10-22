import {
	HueApiError,
	HueForbiddenError,
	HueNetworkError,
	HueNotFoundError,
	HueRateLimitError,
	HueResponseError,
	HueUnauthorizedError
} from './errors';
import type { HttpClient, HttpMethod, HttpRequest, HttpResponse } from './http';
import type { ApiError, ApiResponse } from './types/common';

export interface RequestOptions {
	signal?: AbortSignal;
}

export interface HueProtocol {
	/**
	 * Resolves with the full response envelope for 2xx statuses, including 207 partial success.
	 * The envelope shape is verified at runtime; `data` items are typed but not validated.
	 */
	request<T>(
		method: HttpMethod,
		path: string,
		body?: unknown,
		options?: RequestOptions
	): Promise<ApiResponse<T>>;
}

export interface HueProtocolConfig {
	baseUrl: string;
	appKey: string;
	httpClient: HttpClient;
}

const MAX_BODY_EXCERPT = 1000;

export function createHueProtocol(config: HueProtocolConfig): HueProtocol {
	const root = `${trimTrailingSlashes(config.baseUrl)}/clip/v2`;

	return {
		async request<T>(
			method: HttpMethod,
			path: string,
			body?: unknown,
			options?: RequestOptions
		): Promise<ApiResponse<T>> {
			const headers: Record<string, string> = {
				accept: 'application/json',
				'hue-application-key': config.appKey
			};
			const request: HttpRequest = { method, url: `${root}${path}`, headers };
			if (body !== undefined) {
				headers['content-type'] = 'application/json';
				request.body = JSON.stringify(body);
			}
			if (options?.signal) {
				request.signal = options.signal;
			}

			const response = await sendRequest(config.httpClient, request);
			const label = `${method} ${path}`;
			const parsed = parseJsonBody(response.body);

			if (!isSuccessStatus(response.status)) {
				const errors = parsed.ok ? readErrors(parsed.value) : undefined;
				throw createApiError(label, response.status, errors ?? [], response.body);
			}

			if (!parsed.ok) {
				throw new HueResponseError(
					`Hue API returned a non-JSON body for ${label} (status ${response.status})`,
					response.status,
					excerpt(response.body),
					{ cause: parsed.error }
				);
			}

			const envelope = readEnvelope(parsed.value);
			if (!envelope) {
				throw new HueResponseError(
					`Hue API returned an unexpected response envelope for ${label} (status ${response.status})`,
					response.status,
					excerpt(response.body)
				);
			}

			return envelope as ApiResponse<T>;
		}
	};
}

/**
 * Sends a request and converts transport failures into `HueNetworkError`.
 * Cancellation errors are rethrown unchanged.
 */
export async function sendRequest(
	httpClient: HttpClient,
	request: HttpRequest
): Promise<HttpResponse> {
	try {
		return await httpClient.request(request);
	} catch (error) {
		if (isAbortError(error) || request.signal?.aborted) {
			throw error;
		}
		throw new HueNetworkError(`Network request failed: ${request.method} ${safeUrl(request.url)}`, {
			cause: error
		});
	}
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: unknown };

export function parseJsonBody(body: string): JsonParseResult {
	try {
		const value: unknown = JSON.parse(body);
		return { ok: true, value };
	} catch (error) {
		return { ok: false, error };
	}
}

export function isSuccessStatus(status: number): boolean {
	return status >= 200 && status < 300;
}

export function createApiError(
	label: string,
	status: number,
	errors: ApiError[],
	body?: string
): HueApiError {
	const detail = errors[0]?.description;
	const message = `Hue API request ${label} failed with status ${status}${detail ? `: ${detail}` : ''}`;
	const options = body === undefined ? undefined : { body: excerpt(body) };
	switch (status) {
		case 401:
			return new HueUnauthorizedError(message, status, errors, options);
		case 403:
			return new HueForbiddenError(message, status, errors, options);
		case 404:
			return new HueNotFoundError(message, status, errors, options);
		case 429:
			return new HueRateLimitError(message, status, errors, options);
		default:
			return new HueApiError(message, status, errors, options);
	}
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function excerpt(body: string): string {
	return body.length > MAX_BODY_EXCERPT ? `${body.slice(0, MAX_BODY_EXCERPT)}…` : body;
}

export function trimTrailingSlashes(url: string): string {
	return url.replace(/\/+$/, '');
}

function isAbortError(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'name' in error &&
		(error.name === 'AbortError' || error.name === 'TimeoutError')
	);
}

function safeUrl(url: string): string {
	try {
		const parsed = new URL(url);
		return `${parsed.origin}${parsed.pathname}`;
	} catch {
		return '<invalid url>';
	}
}

export function readErrors(value: unknown): ApiError[] | undefined {
	if (!isRecord(value) || !Array.isArray(value.errors)) {
		return undefined;
	}
	const errors: unknown[] = value.errors;
	if (!errors.every(isApiError)) {
		return undefined;
	}
	return errors;
}

function readEnvelope(value: unknown): { errors: ApiError[]; data: unknown[] } | undefined {
	const errors = readErrors(value);
	if (!errors || !isRecord(value) || !Array.isArray(value.data)) {
		return undefined;
	}
	const data: unknown[] = value.data;
	return { errors, data };
}

function isApiError(value: unknown): value is ApiError {
	return isRecord(value) && typeof value.description === 'string';
}
