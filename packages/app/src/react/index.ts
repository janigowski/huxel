import { computed, type ReadonlySignal } from '@preact/signals-core';
import { useSyncExternalStore } from 'react';
import type { AreaSnapshot, ReadonlyArea } from '../area';
import type { HueAppConnection } from '../gateway';
import {
	bindActions,
	type HueApp,
	type HueAppActions,
	type HueAppStatus,
	type RoomZoneActions
} from '../hue-app';
import type { LightSnapshot, ReadonlyLight } from '../light';

export type ReactLight = LightSnapshot;
export type ReactArea = AreaSnapshot;

export interface ReactHueApp extends HueAppActions, RoomZoneActions {
	readonly lights: readonly ReactLight[];
	readonly rooms: readonly ReactArea[];
	readonly zones: readonly ReactArea[];
	readonly status: HueAppStatus;
	readonly error: unknown;
	readonly connection: HueAppConnection;
}

interface Store {
	subscribe(listener: () => void): () => void;
	getSnapshot(): ReactHueApp;
}

const lightSnapshots = new WeakMap<ReadonlyLight, ReadonlySignal<ReactLight>>();
const areaSnapshots = new WeakMap<ReadonlyArea, ReadonlySignal<ReactArea>>();
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

function areaSnapshot(area: ReadonlyArea): ReactArea {
	let snapshot = areaSnapshots.get(area);
	if (!snapshot) {
		snapshot = computed(() =>
			Object.freeze({
				id: area.id,
				name: area.name.value,
				isOn: area.isOn.value,
				brightness: area.brightness.value,
				color: area.color.value,
				temperature: area.temperature.value,
				colors: area.colors.value
			})
		);
		areaSnapshots.set(area, snapshot);
	}
	return snapshot.value;
}

function bindAreaActions(app: HueApp): RoomZoneActions {
	return {
		toggleRoom: (roomId) => app.toggleRoom(roomId),
		dimRoom: (roomId, brightness) => app.dimRoom(roomId, brightness),
		changeRoomColor: (roomId, color) => app.changeRoomColor(roomId, color),
		changeRoomTemperature: (roomId, mirek) => app.changeRoomTemperature(roomId, mirek),
		applyRoomPreset: (roomId, preset) => app.applyRoomPreset(roomId, preset),
		toggleZone: (zoneId) => app.toggleZone(zoneId),
		dimZone: (zoneId, brightness) => app.dimZone(zoneId, brightness),
		changeZoneColor: (zoneId, color) => app.changeZoneColor(zoneId, color),
		changeZoneTemperature: (zoneId, mirek) => app.changeZoneTemperature(zoneId, mirek),
		applyZonePreset: (zoneId, preset) => app.applyZonePreset(zoneId, preset)
	};
}

function createStore(app: HueApp): Store {
	const actions = {
		...bindActions(app),
		...bindAreaActions(app)
	};
	const lights = computed(() => Object.freeze(app.state.lights.value.map(lightSnapshot)));
	const rooms = computed(() => Object.freeze(app.state.rooms.value.map(areaSnapshot)));
	const zones = computed(() => Object.freeze(app.state.zones.value.map(areaSnapshot)));
	const snapshot = computed<ReactHueApp>(() =>
		Object.freeze({
			lights: lights.value,
			rooms: rooms.value,
			zones: zones.value,
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
