import { createHueApp, describeError } from 'hue-app';
import { registerApplication } from 'hue-sdk';
import { bridgeBaseUrl } from './bridge';

const APP_KEY_STORAGE_KEY = 'hue-app-key';

export class BridgeConnection {
	appKey = $state(localStorage.getItem(APP_KEY_STORAGE_KEY) ?? '');
	connecting = $state(false);
	error = $state<string | null>(null);

	app = $derived(
		this.appKey ? createHueApp({ baseUrl: bridgeBaseUrl(), appKey: this.appKey }) : null
	);

	async connect() {
		this.connecting = true;
		this.error = null;

		try {
			const credentials = await registerApplication({
				baseUrl: bridgeBaseUrl(),
				applicationName: 'hue-remote',
				deviceName: 'browser'
			});
			localStorage.setItem(APP_KEY_STORAGE_KEY, credentials.username);
			this.appKey = credentials.username;
		} catch (error) {
			this.error = describeError(error);
		} finally {
			this.connecting = false;
		}
	}
}
