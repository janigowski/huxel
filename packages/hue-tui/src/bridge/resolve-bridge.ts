import type { DiscoveredBridge } from 'hue-sdk';
import type { BridgeAddress, ConfigStore } from '../config/config-store';

export interface BridgeSession {
	bridge: BridgeAddress;
	appKey: string | undefined;
}

export interface ResolveBridgeOptions {
	env: Record<string, string | undefined>;
	store: ConfigStore;
	discover: () => Promise<DiscoveredBridge[]>;
}

export class BridgeNotFoundError extends Error {
	override name = 'BridgeNotFoundError';

	constructor(message = 'No Hue bridge found on this network.') {
		super(`${message} Set HUE_BRIDGE_IP and HUE_BRIDGE_ID to connect to a bridge directly.`);
	}
}

export async function resolveBridge({
	env,
	store,
	discover
}: ResolveBridgeOptions): Promise<BridgeSession> {
	const config = await store.load();
	const bridge = bridgeFromEnv(env) ?? config?.bridge ?? (await discoverBridge(discover, store));
	const appKey = config && sameBridge(config.bridge, bridge) ? config.appKey : undefined;
	return { bridge, appKey };
}

export function bridgeBaseUrl(bridge: BridgeAddress): string {
	return `https://${bridge.ip}${bridge.port === undefined ? '' : `:${bridge.port}`}`;
}

function bridgeFromEnv(env: Record<string, string | undefined>): BridgeAddress | undefined {
	const ip = env.HUE_BRIDGE_IP;
	const id = env.HUE_BRIDGE_ID;
	if (!ip && !id) {
		return undefined;
	}
	if (!ip || !id) {
		throw new BridgeNotFoundError('HUE_BRIDGE_IP and HUE_BRIDGE_ID must be set together.');
	}
	return { id: id.toLowerCase(), ip };
}

async function discoverBridge(
	discover: () => Promise<DiscoveredBridge[]>,
	store: ConfigStore
): Promise<BridgeAddress> {
	let discovered: DiscoveredBridge[];
	try {
		discovered = await discover();
	} catch (error) {
		throw new BridgeNotFoundError(
			`Bridge discovery failed (${error instanceof Error ? error.message : String(error)}).`
		);
	}
	const [first] = discovered;
	if (!first) {
		throw new BridgeNotFoundError();
	}
	const bridge: BridgeAddress = { id: first.id.toLowerCase(), ip: first.internalipaddress };
	if (first.port !== undefined) {
		bridge.port = first.port;
	}
	await store.save({ bridge });
	return bridge;
}

function sameBridge(a: BridgeAddress, b: BridgeAddress): boolean {
	return a.id.toLowerCase() === b.id.toLowerCase();
}
