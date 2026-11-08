import { createHueApp, describeError } from '@huxel/app';
import { registerApplication } from '@huxel/client';
import { bridgeBaseUrl } from './bridge';

const APP_KEY_STORAGE_KEY = 'hue-app-key';

export type AppKeyStorage = Pick<Storage, 'getItem' | 'setItem'>;

export class BridgeConnection {
	appKey = $state('');
	connecting = $state(false);
	error = $state<string | null>(null);

	app = $derived(
		this.appKey ? createHueApp({ baseUrl: bridgeBaseUrl(), appKey: this.appKey }) : null
	);

	private readonly storage: AppKeyStorage;

	constructor(storage: AppKeyStorage) {
		this.storage = storage;
		this.appKey = storage.getItem(APP_KEY_STORAGE_KEY) ?? '';
	}

	async connect() {
		this.connecting = true;
		this.error = null;

		try {
			const credentials = await registerApplication({
				baseUrl: bridgeBaseUrl(),
				applicationName: 'hue-remote',
				deviceName: 'browser'
			});

			this.storage.setItem(APP_KEY_STORAGE_KEY, credentials.username);
			this.appKey = credentials.username;
		} catch (error) {
			this.error = describeError(error);
		} finally {
			this.connecting = false;
		}
	}
}
