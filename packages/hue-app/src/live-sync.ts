import { batch, type Signal } from '@preact/signals-core';
import type { XyColor } from './color.js';
import type { BridgeLight, HueAppConnection, HueGateway, LightChange } from './gateway.js';
import { Light } from './light.js';
import type { LightLaneRegistry } from './light-lanes.js';

interface LightFields {
	name?: string;
	isOn?: boolean;
	brightness?: number | null;
	color?: XyColor | null;
}

interface Resync {
	readonly overrides: Map<string, LightFields>;
	readonly existence: Map<string, 'added' | 'removed'>;
}

export interface LiveSyncTarget {
	readonly lights: Signal<ReadonlyMap<string, Light>>;
	readonly connection: Signal<HueAppConnection>;
	readonly lanes: LightLaneRegistry;
}

export class LiveSync {
	readonly #gateway: HueGateway;
	readonly #target: LiveSyncTarget;
	#unwatch: (() => void) | undefined;
	#resync: Resync | undefined;
	#started = false;
	#disposed = false;

	constructor(gateway: HueGateway, target: LiveSyncTarget) {
		this.#gateway = gateway;
		this.#target = target;
	}

	start(): void {
		if (this.#started || this.#disposed || !this.#gateway.watch) {
			return;
		}
		this.#started = true;
		this.#target.connection.value = 'connecting';

		let unwatch: () => void;
		try {
			unwatch = this.#gateway.watch({
				onChanges: (changes) => this.#onChanges(changes),
				onConnected: () => void this.#runResync(),
				onConnectionChange: (state) => this.#onConnectionChange(state)
			});
		} catch {
			if (!this.#disposed) {
				this.#target.connection.value = 'offline';
			}
			return;
		}
		if (this.#disposed) {
			unwatch();
		} else {
			this.#unwatch = unwatch;
		}
	}

	dispose(): void {
		if (this.#disposed) {
			return;
		}
		this.#disposed = true;
		this.#resync = undefined;
		const unwatch = this.#unwatch;
		this.#unwatch = undefined;
		unwatch?.();
	}

	#onConnectionChange(state: HueAppConnection): void {
		if (!this.#disposed) {
			this.#target.connection.value = state;
		}
	}

	async #runResync(): Promise<void> {
		if (this.#disposed) {
			return;
		}
		const resync: Resync = { overrides: new Map(), existence: new Map() };
		this.#resync = resync;
		let snapshot: BridgeLight[];
		try {
			snapshot = await this.#gateway.listLights();
		} catch {
			if (this.#resync === resync) {
				this.#resync = undefined;
			}
			return;
		}
		if (this.#disposed || this.#resync !== resync) {
			return;
		}
		this.#resync = undefined;
		batch(() => this.#merge(snapshot, resync));
	}

	#merge(snapshot: readonly BridgeLight[], resync: Resync): void {
		const current = this.#target.lights.peek();
		const remote = new Map(snapshot.map((state) => [state.id, state]));
		const next = new Map<string, Light>();

		for (const [id, light] of current) {
			const state = remote.get(id);
			if (state) {
				this.#apply(light, withoutFields(state, resync.overrides.get(id)));
				next.set(id, light);
			} else if (resync.existence.get(id) === 'added') {
				next.set(id, light);
			} else {
				this.#target.lanes.delete(light);
			}
		}

		for (const [id, state] of remote) {
			if (next.has(id) || resync.existence.get(id) === 'removed') {
				continue;
			}
			next.set(id, new Light({ ...state, ...resync.overrides.get(id) }));
		}

		if (!sameEntries(current, next)) {
			this.#target.lights.value = next;
		}
	}

	#onChanges(changes: readonly LightChange[]): void {
		if (this.#disposed) {
			return;
		}
		batch(() => {
			const current = this.#target.lights.peek();
			let next: Map<string, Light> | undefined;
			const lights = (): ReadonlyMap<string, Light> => next ?? current;
			const editable = (): Map<string, Light> => (next ??= new Map(current));

			for (const change of changes) {
				switch (change.kind) {
					case 'updated': {
						const fields = updatedFields(change);
						this.#recordOverride(change.id, fields);
						const light = lights().get(change.id);
						if (light) {
							this.#apply(light, fields);
						}
						break;
					}
					case 'added': {
						const { id, ...fields } = change.light;
						this.#resync?.existence.set(id, 'added');
						this.#recordOverride(id, fields);
						const light = lights().get(id);
						if (light) {
							this.#apply(light, fields);
						} else {
							editable().set(id, new Light(change.light));
						}
						break;
					}
					case 'removed': {
						this.#resync?.existence.set(change.id, 'removed');
						this.#resync?.overrides.delete(change.id);
						const light = lights().get(change.id);
						if (light) {
							editable().delete(change.id);
							this.#target.lanes.delete(light);
						}
						break;
					}
				}
			}

			if (next) {
				this.#target.lights.value = next;
			}
		});
	}

	#recordOverride(id: string, fields: LightFields): void {
		const resync = this.#resync;
		if (resync) {
			resync.overrides.set(id, { ...resync.overrides.get(id), ...fields });
		}
	}

	#apply(light: Light, fields: LightFields): void {
		if (fields.name !== undefined) {
			light.setName(fields.name);
		}
		if (fields.isOn !== undefined) {
			this.#target.lanes.get(light).power.reconcile(fields.isOn);
		}
		if (fields.brightness !== undefined) {
			this.#target.lanes.get(light).brightness.reconcile(fields.brightness);
		}
		if (fields.color !== undefined) {
			this.#target.lanes.get(light).color.reconcile(fields.color);
		}
	}
}

function updatedFields(change: Extract<LightChange, { kind: 'updated' }>): LightFields {
	const fields: LightFields = {};
	if (change.name !== undefined) {
		fields.name = change.name;
	}
	if (change.isOn !== undefined) {
		fields.isOn = change.isOn;
	}
	if (change.brightness !== undefined) {
		fields.brightness = change.brightness;
	}
	if (change.color !== undefined) {
		fields.color = change.color;
	}
	return fields;
}

function withoutFields(state: BridgeLight, overrides: LightFields | undefined): LightFields {
	const fields: LightFields = {
		name: state.name,
		isOn: state.isOn,
		brightness: state.brightness,
		color: state.color
	};
	if (overrides) {
		for (const key of Object.keys(overrides) as (keyof LightFields)[]) {
			delete fields[key];
		}
	}
	return fields;
}

function sameEntries(a: ReadonlyMap<string, Light>, b: ReadonlyMap<string, Light>): boolean {
	if (a.size !== b.size) {
		return false;
	}
	const left = [...a];
	const right = [...b];
	return left.every(
		([id, light], index) => right[index]?.[0] === id && right[index]?.[1] === light
	);
}
