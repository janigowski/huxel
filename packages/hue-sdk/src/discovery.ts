import { createFetchHttpClient } from './fetch.js';
import { HueResponseError } from './errors.js';
import type { HttpClient, HttpRequest } from './http.js';
import {
	createApiError,
	excerpt,
	isRecord,
	isSuccessStatus,
	parseJsonBody,
	sendRequest
} from './protocol.js';

export const DEFAULT_DISCOVERY_URL = 'https://discovery.meethue.com/';

/** A bridge reported by the Hue discovery service. Field names match the official response. */
export interface DiscoveredBridge {
	/** Bridge identifier, e.g. `001788fffe100491`. */
	id: string;
	/** Local IP address of the bridge. */
	internalipaddress: string;
	/** HTTPS port of the bridge. Absent in older discovery responses. */
	port?: number;
}

export interface DiscoverBridgesOptions {
	/** Transport used for the request. Defaults to `createFetchHttpClient()`. */
	httpClient?: HttpClient;
	signal?: AbortSignal;
	/** Discovery service URL. Defaults to `https://discovery.meethue.com/`. */
	url?: string;
}

/**
 * Asks the official Hue discovery service (`GET https://discovery.meethue.com/`) which bridges
 * are registered for the caller's public IP address. Resolves with an empty array when none
 * are found.
 *
 * The service is rate limited: a 429 response rejects with `HueRateLimitError`, so callers
 * should not poll it. Browsers can only call it from pages the service allows via CORS;
 * elsewhere pass a custom `httpClient` or `url`.
 *
 * @throws HueApiError for non-2xx responses (`HueRateLimitError` for 429)
 * @throws HueNetworkError when the request could not be completed
 * @throws HueResponseError when the body is not a valid list of bridges
 */
export async function discoverBridges(
	options: DiscoverBridgesOptions = {}
): Promise<DiscoveredBridge[]> {
	const httpClient = options.httpClient ?? createFetchHttpClient();
	const request: HttpRequest = {
		method: 'GET',
		url: options.url ?? DEFAULT_DISCOVERY_URL,
		headers: { accept: 'application/json' }
	};
	if (options.signal) {
		request.signal = options.signal;
	}

	const response = await sendRequest(httpClient, request);
	const parsed = parseJsonBody(response.body);

	if (!isSuccessStatus(response.status)) {
		throw createApiError('GET discovery', response.status, [], response.body);
	}

	if (!parsed.ok) {
		throw new HueResponseError(
			`Hue discovery returned a non-JSON body (status ${response.status})`,
			response.status,
			excerpt(response.body),
			{ cause: parsed.error }
		);
	}

	const bridges = readBridges(parsed.value);
	if (!bridges) {
		throw new HueResponseError(
			`Hue discovery returned an unexpected response (status ${response.status})`,
			response.status,
			excerpt(response.body)
		);
	}
	return bridges;
}

function readBridges(value: unknown): DiscoveredBridge[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	const items: unknown[] = value;
	const bridges: DiscoveredBridge[] = [];
	for (const item of items) {
		const bridge = readBridge(item);
		if (!bridge) {
			return undefined;
		}
		bridges.push(bridge);
	}
	return bridges;
}

function readBridge(item: unknown): DiscoveredBridge | undefined {
	if (
		!isRecord(item) ||
		typeof item.id !== 'string' ||
		typeof item.internalipaddress !== 'string'
	) {
		return undefined;
	}
	const bridge: DiscoveredBridge = { id: item.id, internalipaddress: item.internalipaddress };
	if (item.port !== undefined) {
		if (typeof item.port !== 'number') {
			return undefined;
		}
		bridge.port = item.port;
	}
	return bridge;
}
