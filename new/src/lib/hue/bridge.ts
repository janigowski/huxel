export const bridge = {
	id: '001788fffe7d45eb',
	proxyPath: '/bridge'
};

export function bridgeBaseUrl(): string {
	return `${location.origin}${bridge.proxyPath}`;
}
