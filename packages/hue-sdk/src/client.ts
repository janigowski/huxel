import { createFetchHttpClient } from './fetch.js';
import type { HttpClient } from './http.js';
import { createHueProtocol } from './protocol.js';
import { createBridgeHomesApi, type BridgeHomesApi } from './resources/bridge-homes.js';
import { createBridgesApi, type BridgesApi } from './resources/bridges.js';
import { createDevicesApi, type DevicesApi } from './resources/devices.js';
import { createGroupedLightsApi, type GroupedLightsApi } from './resources/grouped-lights.js';
import { createLightsApi, type LightsApi } from './resources/lights.js';
import { createResourcesApi, type ResourcesApi } from './resources/resources.js';
import { createRoomsApi, type RoomsApi } from './resources/rooms.js';
import { createScenesApi, type ScenesApi } from './resources/scenes.js';
import { createSmartScenesApi, type SmartScenesApi } from './resources/smart-scenes.js';
import { createZonesApi, type ZonesApi } from './resources/zones.js';
import { createThrottledHttpClient } from './throttle.js';

export interface HueClientOptions {
	/** Bridge origin, e.g. `https://192.168.1.100`. `/clip/v2` is appended automatically. */
	baseUrl: string;
	/** Application key (V1 registration `username`), sent as the `hue-application-key` header. */
	appKey: string;
	/** Custom HTTP transport. Defaults to the native `fetch` adapter. */
	httpClient?: HttpClient;
	throttle?: boolean;
}

export interface HueClient {
	readonly resources: ResourcesApi;
	readonly lights: LightsApi;
	readonly groupedLights: GroupedLightsApi;
	readonly rooms: RoomsApi;
	readonly zones: ZonesApi;
	readonly scenes: ScenesApi;
	readonly smartScenes: SmartScenesApi;
	readonly devices: DevicesApi;
	readonly bridges: BridgesApi;
	readonly bridgeHomes: BridgeHomesApi;
}

export function createHueClient(options: HueClientOptions): HueClient {
	const httpClient = options.httpClient ?? createFetchHttpClient();
	const protocol = createHueProtocol({
		baseUrl: options.baseUrl,
		appKey: options.appKey,
		httpClient: options.throttle === false ? httpClient : createThrottledHttpClient(httpClient)
	});

	return {
		resources: createResourcesApi(protocol),
		lights: createLightsApi(protocol),
		groupedLights: createGroupedLightsApi(protocol),
		rooms: createRoomsApi(protocol),
		zones: createZonesApi(protocol),
		scenes: createScenesApi(protocol),
		smartScenes: createSmartScenesApi(protocol),
		devices: createDevicesApi(protocol),
		bridges: createBridgesApi(protocol),
		bridgeHomes: createBridgeHomesApi(protocol)
	};
}
