import { createFetchHttpClient } from './fetch.js';
import type { HttpClient } from './http.js';
import { createHueProtocol } from './protocol.js';
import { createLightsApi, type LightsApi } from './resources/lights.js';

export interface HueClientOptions {
	/** Bridge origin, e.g. `https://192.168.1.100`. `/clip/v2` is appended automatically. */
	baseUrl: string;
	/** Application key (V1 registration `username`), sent as the `hue-application-key` header. */
	appKey: string;
	/** Custom HTTP transport. Defaults to the native `fetch` adapter. */
	httpClient?: HttpClient;
}

export interface HueClient {
	readonly lights: LightsApi;
}

export function createHueClient(options: HueClientOptions): HueClient {
	const protocol = createHueProtocol({
		baseUrl: options.baseUrl,
		appKey: options.appKey,
		httpClient: options.httpClient ?? createFetchHttpClient()
	});

	return {
		lights: createLightsApi(protocol)
	};
}
