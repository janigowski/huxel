import { computed, type ReadonlySignal } from '@preact/signals-core';
import { useSyncExternalStore } from 'react';
import type { HueAppConnection } from '../gateway';
import { bindActions, type HueApp, type HueAppActions, type HueAppStatus } from '../hue-app';
import type { LightSnapshot, ReadonlyLight } from '../light';

export type ReactLight = LightSnapshot;

export interface ReactHueApp extends HueAppActions {
	readonly lights: readonly ReactLight[];
	readonly status: HueAppStatus;
	readonly error: unknown;
	readonly connection: HueAppConnection;
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
				name: light.name.value,
				isOn: light.isOn.value,
				brightness: light.brightness.value,
				color: light.color.value,
				temperature: light.temperature.value,
				colors: light.colors.value
			})
		);
		lightSnapshots.set(light, snapshot);
	}
	return snapshot.value;
}

function createStore(app: HueApp): Store {
	const actions = bindActions(app);
	const lights = computed(() => Object.freeze(app.state.lights.value.map(lightSnapshot)));
	const snapshot = computed<ReactHueApp>(() =>
		Object.freeze({
			lights: lights.value,
			status: app.state.status.value,
			error: app.state.error.value,
			connection: app.state.connection.value,
			...actions
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
