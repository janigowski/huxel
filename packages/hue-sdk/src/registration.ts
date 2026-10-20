import { createFetchHttpClient } from './fetch.js';
import { HueLinkButtonNotPressedError, HueRegistrationError, HueResponseError } from './errors.js';
import type { RegistrationErrorDetail } from './errors.js';
import type { HttpClient, HttpRequest } from './http.js';
import {
	createApiError,
	isRecord,
	isSuccessStatus,
	parseJsonBody,
	sendRequest,
	trimTrailingSlashes
} from './protocol.js';

const LINK_BUTTON_NOT_PRESSED = 101;

/** Credentials returned by a successful registration. Treat both values as secrets. */
export interface RegistrationCredentials {
	/** The application key. Send it as the `hue-application-key` header on CLIP v2 requests. */
	username: string;
	/** Pre-shared key for the Hue Entertainment streaming API. */
	clientkey: string;
}

export interface RegisterApplicationOptions {
	/** Bridge base URL, e.g. `https://192.168.1.100`. */
	baseUrl: string;
	/** Application name, 0 to 20 characters. Not validated client-side. */
	applicationName: string;
	/** Device name, 0 to 19 characters. When omitted only `applicationName` is sent. */
	deviceName?: string;
	/** Transport used for the request. Defaults to `createFetchHttpClient()`. */
	httpClient?: HttpClient;
	signal?: AbortSignal;
}

/**
 * Registers an application with a bridge (`POST {baseUrl}/api`, legacy V1 endpoint, the only
 * way to obtain an application key) and resolves with the new credentials.
 *
 * This sends exactly one request and never polls. The bridge only accepts it shortly after
 * its physical link button was pressed: ask the user to press the button, then call this
 * function within about 30 seconds. While the button has not been pressed it rejects with
 * `HueLinkButtonNotPressedError`; the application may then prompt the user and call it again.
 * Retries are always under the caller's control.
 *
 * The bridge validates `devicetype`, which is `<applicationName>#<deviceName>` (or only
 * `applicationName` when `deviceName` is omitted): at most 40 characters in total, with the
 * application name 0 to 20 and the device name 0 to 19 characters. Nothing is validated or
 * truncated client-side.
 *
 * Nothing is persisted. Credentials are never included in error messages.
 *
 * @throws HueLinkButtonNotPressedError when the link button has not been pressed (V1 error 101)
 * @throws HueRegistrationError for any other V1 error reported by the bridge
 * @throws HueApiError for non-2xx responses
 * @throws HueNetworkError when the request could not be completed
 * @throws HueResponseError when the body is not a recognizable registration response
 */
export async function registerApplication(
	options: RegisterApplicationOptions
): Promise<RegistrationCredentials> {
	const httpClient = options.httpClient ?? createFetchHttpClient();
	const devicetype =
		options.deviceName === undefined
			? options.applicationName
			: `${options.applicationName}#${options.deviceName}`;
	const request: HttpRequest = {
		method: 'POST',
		url: `${trimTrailingSlashes(options.baseUrl)}/api`,
		headers: { accept: 'application/json', 'content-type': 'application/json' },
		body: JSON.stringify({ devicetype, generateclientkey: true })
	};
	if (options.signal) {
		request.signal = options.signal;
	}

	const response = await sendRequest(httpClient, request);

	if (!isSuccessStatus(response.status)) {
		throw createApiError('POST /api', response.status, [], response.body);
	}

	const parsed = parseJsonBody(response.body);
	const items = parsed.ok ? readItems(parsed.value) : undefined;
	if (!items) {
		throw malformed(response.status);
	}

	for (const item of items) {
		const credentials = readSuccess(item);
		if (credentials) {
			return credentials;
		}
	}

	for (const item of items) {
		const detail = readError(item);
		if (detail) {
			throw toRegistrationError(detail);
		}
	}

	throw malformed(response.status);
}

function malformed(status: number): HueResponseError {
	return new HueResponseError(
		`Hue bridge returned an unexpected registration response (status ${status})`,
		status,
		''
	);
}

function toRegistrationError(detail: RegistrationErrorDetail): HueRegistrationError {
	if (detail.type === LINK_BUTTON_NOT_PRESSED) {
		return new HueLinkButtonNotPressedError(
			'Hue bridge link button has not been pressed (V1 error 101)',
			detail
		);
	}
	return new HueRegistrationError(
		`Hue bridge registration failed with V1 error ${detail.type}: ${detail.description}`,
		detail
	);
}

function readItems(value: unknown): unknown[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const items: unknown[] = value;
	return items.length > 0 ? items : undefined;
}

function readSuccess(item: unknown): RegistrationCredentials | undefined {
	if (!isRecord(item) || !isRecord(item.success)) {
		return undefined;
	}
	const { username, clientkey } = item.success;
	if (typeof username !== 'string' || typeof clientkey !== 'string') {
		return undefined;
	}
	return { username, clientkey };
}

function readError(item: unknown): RegistrationErrorDetail | undefined {
	if (!isRecord(item) || !isRecord(item.error)) {
		return undefined;
	}
	const { type, address, description } = item.error;
	if (typeof type !== 'number' || typeof address !== 'string' || typeof description !== 'string') {
		return undefined;
	}
	return { type, address, description };
}
