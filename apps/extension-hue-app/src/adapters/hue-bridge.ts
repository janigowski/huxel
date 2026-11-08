import { createHueApp } from 'hue-app';
import { discoverBridges, registerApplication } from '@huxel/client';
import type { Dependencies } from '../ports';

export function createHueBridgeDependencies(): Pick<
	Dependencies,
	'discoverBridges' | 'registerApplication' | 'openHueApp'
> {
	return {
		discoverBridges: () => discoverBridges(),
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
