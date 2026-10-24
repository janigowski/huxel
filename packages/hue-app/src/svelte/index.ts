import type { ReadonlySignal } from '@preact/signals-core';
import { createSubscriber } from 'svelte/reactivity';
import type { AreaCollection } from '../area-collection';
import type { AreaSnapshot, ReadonlyArea } from '../area';
import type { XyColor } from '../color';
import type { HueAppConnection } from '../gateway';
import { bindActions, type HueApp, type HueAppActions, type HueAppStatus } from '../hue-app';
import type { LightCollection } from '../light-collection';
import type { LightSnapshot, ReadonlyLight } from '../light';

export type SvelteLight = LightSnapshot;
export type SvelteArea = AreaSnapshot;

export interface SvelteLightCollection {
	readonly all: readonly SvelteLight[];
	get(id: string): SvelteLight | undefined;
}

export interface SvelteAreaCollection {
	readonly all: readonly SvelteArea[];
	get(id: string): SvelteArea | undefined;
}

export interface SvelteHueApp extends HueAppActions {
	readonly lights: SvelteLightCollection;
	readonly rooms: SvelteAreaCollection;
	readonly zones: SvelteAreaCollection;
	readonly status: HueAppStatus;
	readonly error: unknown;
	readonly connection: HueAppConnection;
	toggleRoom(roomId: string): Promise<void>;
	dimRoom(roomId: string, brightness: number): Promise<void>;
	changeRoomColor(roomId: string, color: XyColor): Promise<void>;
	toggleZone(zoneId: string): Promise<void>;
	dimZone(zoneId: string, brightness: number): Promise<void>;
	changeZoneColor(zoneId: string, color: XyColor): Promise<void>;
}

type Subscribable = Pick<ReadonlySignal<unknown>, 'subscribe'>;

function track(source: Subscribable): () => void {
	return createSubscriber((update) => {
		let subscribed = false;
		const dispose = source.subscribe(() => {
			if (subscribed) {
				update();
			}
		});
		subscribed = true;
		return dispose;
	});
}

function reader<T>(source: ReadonlySignal<T>): () => T {
	const subscribe = track(source);
	return () => {
		subscribe();
		return source.value;
	};
}

function createSvelteLight(light: ReadonlyLight): SvelteLight {
	const name = reader(light.name);
	const isOn = reader(light.isOn);
	const brightness = reader(light.brightness);
	const color = reader(light.color);

	return {
		id: light.id,
		get name() {
			return name();
		},
		get isOn() {
			return isOn();
		},
		get brightness() {
			return brightness();
		},
		get color() {
			return color();
		}
	};
}

function createSvelteArea(area: ReadonlyArea): SvelteArea {
	const name = reader(area.name);
	const isOn = reader(area.isOn);
	const brightness = reader(area.brightness);
	const color = reader(area.color);
	const colors = reader(area.colors);

	return {
		id: area.id,
		get name() {
			return name();
		},
		get isOn() {
			return isOn();
		},
		get brightness() {
			return brightness();
		},
		get color() {
			return color();
		},
		get colors() {
			return colors();
		}
	};
}

function createSvelteLightCollection(lights: LightCollection): SvelteLightCollection {
	return createSvelteCollection(lights, createSvelteLight);
}

function createSvelteAreaCollection(areas: AreaCollection): SvelteAreaCollection {
	return createSvelteCollection(areas, createSvelteArea);
}

function createSvelteCollection<TEntity extends object, TView extends { id: string }>(
	source: LightCollection | AreaCollection,
	createView: (entity: TEntity) => TView
): { readonly all: readonly TView[]; get(id: string): TView | undefined } {
	const subscribe = track(source);
	const wrappers = new WeakMap<TEntity, TView>();
	const lists = new WeakMap<readonly TEntity[], readonly TView[]>();

	function wrap(entity: TEntity): TView {
		let wrapper = wrappers.get(entity);
		if (!wrapper) {
			wrapper = createView(entity);
			wrappers.set(entity, wrapper);
		}
		return wrapper;
	}

	return {
		get all() {
			subscribe();
			const current = source.value as readonly TEntity[];
			let list = lists.get(current);
			if (!list) {
				list = Object.freeze(current.map(wrap));
				lists.set(current, list);
			}
			return list;
		},
		get(id) {
			subscribe();
			const entity = source.get(id) as TEntity | undefined;
			return entity ? wrap(entity) : undefined;
		}
	};
}

export function createSvelteHueApp(app: HueApp): SvelteHueApp {
	const status = reader(app.state.status);
	const error = reader(app.state.error);
	const connection = reader(app.state.connection);

	return {
		lights: createSvelteLightCollection(app.state.lights),
		rooms: createSvelteAreaCollection(app.state.rooms),
		zones: createSvelteAreaCollection(app.state.zones),
		get status() {
			return status();
		},
		get error() {
			return error();
		},
		get connection() {
			return connection();
		},
		...bindActions(app),
		toggleRoom: (roomId) => app.toggleRoom(roomId),
		dimRoom: (roomId, brightness) => app.dimRoom(roomId, brightness),
		changeRoomColor: (roomId, color) => app.changeRoomColor(roomId, color),
		toggleZone: (zoneId) => app.toggleZone(zoneId),
		dimZone: (zoneId, brightness) => app.dimZone(zoneId, brightness),
		changeZoneColor: (zoneId, color) => app.changeZoneColor(zoneId, color)
	};
}
