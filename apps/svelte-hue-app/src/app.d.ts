import type { HueBridge } from '$lib/hue/bridge';
import type { HueConnection } from '$lib/hue/connection-data';

declare module 'data-bus' {
	interface DataMap {
		'hue.bridge': HueBridge;
		'hue.connection': HueConnection;
	}
}

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
