import { computed, type ReadonlySignal } from '@preact/signals-core';
import { useSyncExternalStore } from 'react';
import type { HueApp, HueAppStatus } from '../hue-app.js';
import type { ReadonlyLight } from '../light.js';

export interface ReactLight {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
}

export interface ReactHueApp {
	readonly lights: readonly ReactLight[];
	readonly status: HueAppStatus;
	readonly error: unknown;
	initialize(): Promise<void>;
	toggleLight(lightId: string): Promise<void>;
	dimLight(lightId: string, brightness: number): Promise<void>;
}

interface Store {
	subscribe(listener: () => void): () => void;
	getSnapshot(): ReactHueApp;
}

const lightSnapshots = new WeakMap<ReadonlyLight, ReadonlySignal<ReactLight>>();
const stores = new WeakMap<HueApp, Store>();

function lightSnapshot(light: ReadonlyLight): ReactLight {
	let snapshot = lightSnapshots.get(light);
	if (!snapshot) {
		snapshot = computed(() =>
			Object.freeze({
				id: light.id,
				name: light.name,
				isOn: light.isOn.value,
				brightness: light.brightness.value
			})
		);
		lightSnapshots.set(light, snapshot);
	}
	return snapshot.value;
}

function createStore(app: HueApp): Store {
	const initialize = () => app.initialize();
	const toggleLight = (lightId: string) => app.toggleLight(lightId);
	const dimLight = (lightId: string, brightness: number) => app.dimLight(lightId, brightness);
	const lights = computed(() => Object.freeze(app.state.lights.value.map(lightSnapshot)));
	const snapshot = computed<ReactHueApp>(() =>
		Object.freeze({
			lights: lights.value,
			status: app.state.status.value,
			error: app.state.error.value,
			initialize,
			toggleLight,
			dimLight
		})
	);

	return {
		subscribe: (listener) => snapshot.subscribe(() => listener()),
		getSnapshot: () => snapshot.peek()
	};
}

function getStore(app: HueApp): Store {
	let store = stores.get(app);
	if (!store) {
		store = createStore(app);
		stores.set(app, store);
	}
	return store;
}

export function useHueApp(app: HueApp): ReactHueApp {
	const store = getStore(app);
	return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
