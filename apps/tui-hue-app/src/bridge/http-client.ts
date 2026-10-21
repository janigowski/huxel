import { createFetchHttpClient, type HttpClient } from 'hue-sdk';
import { HUE_ROOT_CA } from './hue-root-ca';
import { checkBridgeIdentity } from './identity';

const REQUEST_TIMEOUT_MS = 10_000;

export interface BridgeHttpClientOptions {
	bridgeId: string;
	timeoutMs?: number;
}

export function createBridgeHttpClient({
	bridgeId,
	timeoutMs = REQUEST_TIMEOUT_MS
}: BridgeHttpClientOptions): HttpClient {
	const tls = {
		ca: HUE_ROOT_CA,
		checkServerIdentity: (_hostname: string, certificate: { subject?: { CN?: unknown } }) =>
			checkBridgeIdentity(bridgeId, certificate)
	};
	const bridgeFetch = (input: string | URL | Request, init?: RequestInit) => {
		const timeout = AbortSignal.timeout(timeoutMs);
		return fetch(input, {
			...init,
			keepalive: false,
			signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
			tls
		});
	};
	return createFetchHttpClient({ fetch: bridgeFetch as typeof fetch });
}
