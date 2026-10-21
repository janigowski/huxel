import type { ReadonlySignal } from '@preact/signals-core';
import { createSubscriber } from 'svelte/reactivity';
import type { HueAppConnection } from '../gateway.js';
import { bindActions, type HueApp, type HueAppActions, type HueAppStatus } from '../hue-app.js';
import type { LightCollection } from '../light-collection.js';
import type { LightSnapshot, ReadonlyLight } from '../light.js';

export type SvelteLight = LightSnapshot;

export interface SvelteLightCollection {
	readonly all: readonly SvelteLight[];
	get(id: string): SvelteLight | undefined;
}

export interface SvelteHueApp extends HueAppActions {
	readonly lights: SvelteLightCollection;
	readonly status: HueAppStatus;
	readonly error: unknown;
	readonly connection: HueAppConnection;
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

function createSvelteLightCollection(lights: LightCollection): SvelteLightCollection {
	const subscribe = track(lights);
	const wrappers = new WeakMap<ReadonlyLight, SvelteLight>();
	const lists = new WeakMap<readonly ReadonlyLight[], readonly SvelteLight[]>();

	function wrap(light: ReadonlyLight): SvelteLight {
		let wrapper = wrappers.get(light);
		if (!wrapper) {
			wrapper = createSvelteLight(light);
			wrappers.set(light, wrapper);
		}
		return wrapper;
	}

	return {
		get all() {
			subscribe();
			const current = lights.value;
			let list = lists.get(current);
			if (!list) {
				list = Object.freeze(current.map(wrap));
				lists.set(current, list);
			}
			return list;
		},
		get(id) {
			subscribe();
			const light = lights.get(id);
			return light ? wrap(light) : undefined;
		}
	};
}

export function createSvelteHueApp(app: HueApp): SvelteHueApp {
	const status = reader(app.state.status);
	const error = reader(app.state.error);
	const connection = reader(app.state.connection);

	return {
		lights: createSvelteLightCollection(app.state.lights),
		get status() {
			return status();
		},
		get error() {
			return error();
		},
		get connection() {
			return connection();
		},
		...bindActions(app)
	};
}
