import { createHueClient, HueLinkButtonNotPressedError, registerApplication } from 'hue-sdk';
import { bridgeBaseUrl, describeError } from './bridge';

const APP_KEY_STORAGE_KEY = 'hue-app-key';

export class BridgeConnection {
	appKey = $state(localStorage.getItem(APP_KEY_STORAGE_KEY) ?? '');
	connecting = $state(false);
	error = $state<string | null>(null);

	client = $derived(
		this.appKey
			? createHueClient({ baseUrl: bridgeBaseUrl(), appKey: this.appKey, throttle: false })
			: null
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
			this.error =
				error instanceof HueLinkButtonNotPressedError
					? 'Press the link button on the bridge, then connect again.'
					: describeError(error);
		} finally {
			this.connecting = false;
		}
	}
}
