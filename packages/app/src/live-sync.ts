import { batch, type Signal } from '@preact/signals-core';
import type { XyColor } from './color';
import type { ColorTemperature } from './temperature';
import type {
	AreaChange,
	BridgeLight,
	HueAppConnection,
	HueGateway,
	LightChange,
	LightChangeObserver
} from './gateway';
import { Light } from './light';
import type { LightLaneRegistry } from './light-lanes';
import type { AreaSync } from './area-sync';

interface LightFields {
	name?: string;
	isOn?: boolean;
	brightness?: number | null;
	color?: XyColor | null;
	temperature?: ColorTemperature | null;
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
	private readonly gateway: HueGateway;
	private readonly target: LiveSyncTarget;
	private unwatch: (() => void) | undefined;
	private resync: Resync | undefined;
	private started = false;
	private disposed = false;

	private readonly areas: AreaSync | undefined;

	constructor(gateway: HueGateway, target: LiveSyncTarget, areas?: AreaSync) {
		this.gateway = gateway;
		this.target = target;
		this.areas = areas;
	}

	start(): void {
		if (this.started || this.disposed || !this.gateway.watch) {
			return;
		}
		this.started = true;
		this.target.connection.value = 'connecting';

		let unwatch: () => void;
		const observer: LightChangeObserver = {
			onChanges: (changes) => this.onChanges(changes),
			onConnected: () => {
				void this.runResync();
				void this.areas?.resync();
			},
			onConnectionChange: (state) => this.onConnectionChange(state)
		};
		if (this.areas) {
			observer.onAreaChanges = (changes: AreaChange[]) => {
				this.areas?.onChanges(changes);
			};
		}
		try {
			unwatch = this.gateway.watch(observer);
		} catch {
			if (!this.disposed) {
				this.target.connection.value = 'offline';
			}
			return;
		}
		if (this.disposed) {
			unwatch();
		} else {
			this.unwatch = unwatch;
		}
	}

	dispose(): void {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.areas?.dispose();
		this.resync = undefined;
		const unwatch = this.unwatch;
		this.unwatch = undefined;
		unwatch?.();
	}

	private onConnectionChange(state: HueAppConnection): void {
		if (!this.disposed) {
			this.target.connection.value = state;
		}
	}

	private async runResync(): Promise<void> {
		if (this.disposed) {
			return;
		}
		const resync: Resync = { overrides: new Map(), existence: new Map() };
		this.resync = resync;
		let snapshot: BridgeLight[];
		try {
			snapshot = await this.gateway.listLights();
		} catch {
			if (this.resync === resync) {
				this.resync = undefined;
			}
			return;
		}
		if (this.disposed || this.resync !== resync) {
			return;
		}
		this.resync = undefined;
		batch(() => this.merge(snapshot, resync));
	}

	private merge(snapshot: readonly BridgeLight[], resync: Resync): void {
		const current = this.target.lights.peek();
		const remote = new Map(snapshot.map((state) => [state.id, state]));
		const next = new Map<string, Light>();

		for (const [id, light] of current) {
			const state = remote.get(id);
			if (state) {
				this.apply(light, withoutFields(state, resync.overrides.get(id)));
				this.applyCapabilities(light, state);
				next.set(id, light);
			} else if (resync.existence.get(id) === 'added') {
				next.set(id, light);
			} else {
				this.target.lanes.delete(light);
			}
		}

		for (const [id, state] of remote) {
			if (next.has(id) || resync.existence.get(id) === 'removed') {
				continue;
			}
			next.set(id, new Light({ ...state, ...resync.overrides.get(id) }));
		}

		if (!sameEntries(current, next)) {
			this.target.lights.value = next;
		}
	}

	private onChanges(changes: readonly LightChange[]): void {
		if (this.disposed) {
			return;
		}
		batch(() => {
			const current = this.target.lights.peek();
			let next: Map<string, Light> | undefined;
			const lights = (): ReadonlyMap<string, Light> => next ?? current;
			const editable = (): Map<string, Light> => (next ??= new Map(current));

			for (const change of changes) {
				switch (change.kind) {
					case 'updated': {
						const fields = updatedFields(change);
						this.recordOverride(change.id, fields);
						const light = lights().get(change.id);
						if (light) {
							this.apply(light, fields);
						}
						break;
					}
					case 'added': {
						const { id, ...fields } = change.light;
						this.resync?.existence.set(id, 'added');
						this.recordOverride(id, fields);
						const light = lights().get(id);
						if (light) {
							this.apply(light, fields);
							this.applyCapabilities(light, change.light);
						} else {
							editable().set(id, new Light(change.light));
						}
						break;
					}
					case 'removed': {
						this.resync?.existence.set(change.id, 'removed');
						this.resync?.overrides.delete(change.id);
						const light = lights().get(change.id);
						if (light) {
							editable().delete(change.id);
							this.target.lanes.delete(light);
						}
						break;
					}
				}
			}

			if (next) {
				this.target.lights.value = next;
			}
		});
	}

	private recordOverride(id: string, fields: LightFields): void {
		const resync = this.resync;
		if (resync) {
			resync.overrides.set(id, { ...resync.overrides.get(id), ...fields });
		}
	}

	private apply(light: Light, fields: LightFields): void {
		if (fields.name !== undefined) {
			light.setName(fields.name);
		}
		if (fields.isOn !== undefined) {
			this.target.lanes.get(light).power.reconcile(fields.isOn);
		}
		if (fields.brightness !== undefined) {
			this.target.lanes.get(light).brightness.reconcile(fields.brightness);
		}
		if (fields.color !== undefined) {
			this.target.lanes.get(light).color.reconcile(fields.color);
		}
		if (fields.temperature !== undefined) {
			this.target.lanes.get(light).temperature.reconcile(fields.temperature);
		}
	}

	private applyCapabilities(light: Light, state: BridgeLight): void {
		if (state.gamut !== undefined) {
			light.setGamut(state.gamut);
		}

		if (state.mirekRange !== undefined) {
			light.setMirekRange(state.mirekRange);
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
	if (change.temperature !== undefined) {
		fields.temperature = change.temperature;
	}
	return fields;
}

function withoutFields(state: BridgeLight, overrides: LightFields | undefined): LightFields {
	const fields: LightFields = {
		name: state.name,
		isOn: state.isOn,
		brightness: state.brightness,
		color: state.color,
		temperature: state.temperature
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
