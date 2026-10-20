import { createHueApp, type HueApp } from 'hue-app';
import { registerApplication, type DiscoveredBridge } from 'hue-sdk';
import { createBridgeHttpClient } from './bridge/http-client';
import { bridgeBaseUrl, resolveBridge, type BridgeSession } from './bridge/resolve-bridge';
import type { BridgeAddress, ConfigStore } from './config/config-store';

export interface Connection {
	resolve(): Promise<BridgeSession>;
	link(bridge: BridgeAddress): Promise<string>;
	open(bridge: BridgeAddress, appKey: string): HueApp;
}

export interface ConnectionOptions {
	env: Record<string, string | undefined>;
	store: ConfigStore;
	discover: () => Promise<DiscoveredBridge[]>;
}

export function createConnection({ env, store, discover }: ConnectionOptions): Connection {
	return {
		resolve: () => resolveBridge({ env, store, discover }),
		async link(bridge) {
			const { username } = await registerApplication({
				...transport(bridge),
				applicationName: 'hue-remote',
				deviceName: 'terminal'
			});
			await store.save({ bridge, appKey: username });
			return username;
		},
		open: (bridge, appKey) => createHueApp({ ...transport(bridge), appKey })
	};
}

function transport(bridge: BridgeAddress) {
	return {
		baseUrl: bridgeBaseUrl(bridge),
		httpClient: createBridgeHttpClient({ bridgeId: bridge.id })
	};
}
