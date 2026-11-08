const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
const BARE_IPV6 = /^[\da-f]*:[\da-f]*:[\da-f:.]*$/i;

export type BridgeHostResult =
	| { ok: true; host: string }
	| { ok: false; reason: 'empty' | 'invalid' | 'ipv6' };

export function parseBridgeHostInput(input: string): BridgeHostResult {
	const trimmed = input.trim();

	if (trimmed === '') {
		return { ok: false, reason: 'empty' };
	}

	if (BARE_IPV6.test(trimmed)) {
		return { ok: false, reason: 'ipv6' };
	}

	const url = toUrl(SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`);

	if (!url || !isBridgeUrl(url)) {
		return { ok: false, reason: 'invalid' };
	}

	if (url.hostname.startsWith('[')) {
		return { ok: false, reason: 'ipv6' };
	}

	const host = url.port === '' || url.port === '443' ? url.hostname : `${url.hostname}:${url.port}`;

	return { ok: true, host };
}

export function parseBridgeHost(input: string): string | null {
	const result = parseBridgeHostInput(input);

	return result.ok ? result.host : null;
}

export function formatDiscoveredHost(address: string, port?: number): string | null {
	return parseBridgeHost(port === undefined ? address : `${address}:${port}`);
}

export function bridgeOrigin(host: string): string {
	return `https://${host}`;
}

export function hostPermissionPattern(origin: string): string {
	const { protocol, hostname } = new URL(origin);

	return `${protocol}//${hostname}/*`;
}

function toUrl(value: string): URL | null {
	try {
		return new URL(value);
	} catch {
		return null;
	}
}

function isBridgeUrl(url: URL): boolean {
	return (
		(url.protocol === 'https:' || url.protocol === 'http:') &&
		url.username === '' &&
		url.password === '' &&
		url.hostname !== '' &&
		url.pathname === '/' &&
		url.search === '' &&
		url.hash === ''
	);
}
