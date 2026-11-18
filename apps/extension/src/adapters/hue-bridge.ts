import { createHueApp } from '@huxel/app';
import {
	createFetchHttpClient,
	discoverBridges,
	HueNetworkError,
	registerApplication
} from '@huxel/client';
import type { Dependencies } from '../ports';

export function createHueBridgeDependencies(): Pick<
	Dependencies,
	'discoverBridges' | 'reachBridge' | 'registerApplication' | 'openHueApp'
> {
	return {
		discoverBridges: () => discoverBridges(),
		reachBridge,
		async registerApplication(origin) {
			const { username } = await registerApplication({
				baseUrl: origin,
				applicationName: 'hue-remote',
				deviceName: 'extension'
			});

			return username;
		},
		openHueApp: ({ origin, appKey }) => createHueApp({ baseUrl: origin, appKey })
	};
}

async function reachBridge(origin: string): Promise<void> {
	try {
		await createFetchHttpClient().request({ method: 'GET', url: `${origin}/` });
	} catch (error) {
		throw new HueNetworkError(`Network request failed: GET ${origin}/`, { cause: error });
	}
}
