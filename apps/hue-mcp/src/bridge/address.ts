export interface BridgeAddress {
	id: string;
	ip: string;
	port?: number;
}

export function bridgeBaseUrl(bridge: BridgeAddress): string {
	return `https://${bridge.ip}${bridge.port === undefined ? '' : `:${bridge.port}`}`;
}

export function sameBridge(a: BridgeAddress, b: BridgeAddress): boolean {
	return a.id.toLowerCase() === b.id.toLowerCase();
}

export function readBridgeEnv(env: Record<string, string | undefined>): BridgeAddress | undefined {
	const ip = env.HUE_BRIDGE_IP;
	const id = env.HUE_BRIDGE_ID;

	if (!ip && !id) {
		return undefined;
	}

	if (!ip || !id) {
		throw new Error('HUE_BRIDGE_IP and HUE_BRIDGE_ID must be set together.');
	}

	return { id: id.toLowerCase(), ip };
}
