import { batch, type Signal } from '@preact/signals-core';
import { Area } from './area';
import type { AreaLaneRegistry } from './area-lanes';
import type { AreaChange, AreaFields, AreaGateway, AreaKind, BridgeArea } from './gateway';

interface KindResync {
	readonly overrides: Map<string, AreaFields>;
	readonly existence: Map<string, 'added' | 'removed'>;
}

interface Resync {
	readonly rooms: KindResync;
	readonly zones: KindResync;
	readonly services: Map<string, AreaFields>;
	readonly removedServices: Set<string>;
}

export class AreaSync {
	private readonly gateway: AreaGateway;
	private readonly rooms: Signal<ReadonlyMap<string, Area>>;
	private readonly zones: Signal<ReadonlyMap<string, Area>>;
	private readonly lanes: AreaLaneRegistry;
	private resyncState: Resync | undefined;
	private disposed = false;

	constructor(
		gateway: AreaGateway,
		rooms: Signal<ReadonlyMap<string, Area>>,
		zones: Signal<ReadonlyMap<string, Area>>,
		lanes: AreaLaneRegistry
	) {
		this.gateway = gateway;
		this.rooms = rooms;
		this.zones = zones;
		this.lanes = lanes;
	}

	dispose(): void {
		this.disposed = true;
		this.resyncState = undefined;
	}

	onChanges(changes: readonly AreaChange[]): void {
		if (this.disposed) {
			return;
		}

		batch(() => {
			const currentRooms = this.rooms.peek();
			const currentZones = this.zones.peek();
			let nextRooms: Map<string, Area> | undefined;
			let nextZones: Map<string, Area> | undefined;
			const mapOf = (kind: AreaKind): ReadonlyMap<string, Area> =>
				kind === 'room' ? (nextRooms ?? currentRooms) : (nextZones ?? currentZones);
			const editable = (kind: AreaKind): Map<string, Area> => {
				if (kind === 'room') {
					return (nextRooms ??= new Map(currentRooms));
				}

				return (nextZones ??= new Map(currentZones));
			};
			const locate = (serviceId: string): { kind: AreaKind; area: Area } | undefined => {
				for (const kind of ['room', 'zone'] as const) {
					for (const area of mapOf(kind).values()) {
						if (area.serviceId === serviceId) {
							return { kind, area };
						}
					}
				}

				return undefined;
			};

			for (const change of changes) {
				switch (change.kind) {
					case 'updated': {
						const fields = updatedFields(change);
						this.record(change.resource, change.id, fields);
						const area = mapOf(change.resource).get(change.id);
						if (area) {
							this.apply(area, fields);
						}
						break;
					}
					case 'added': {
						const { id, ...fields } = change.area;
						this.kind(change.resource).existence.set(id, 'added');
						this.record(change.resource, id, fields);
						const area = mapOf(change.resource).get(id);
						if (area) {
							this.apply(area, fields);
						} else {
							editable(change.resource).set(id, new Area(change.area));
						}
						break;
					}
					case 'removed': {
						this.kind(change.resource).existence.set(change.id, 'removed');
						this.kind(change.resource).overrides.delete(change.id);
						const area = mapOf(change.resource).get(change.id);
						if (area) {
							editable(change.resource).delete(change.id);
							this.lanes.delete(area);
						}
						break;
					}
					case 'service-updated': {
						const fields = updatedFields(change);
						this.recordService(change.serviceId, fields);
						const found = locate(change.serviceId);
						if (found) {
							this.record(found.kind, found.area.id, fields);
							this.apply(found.area, fields);
						}
						break;
					}
					case 'service-removed': {
						this.resyncState?.removedServices.add(change.serviceId);
						const found = locate(change.serviceId);
						if (found) {
							this.kind(found.kind).existence.set(found.area.id, 'removed');
							editable(found.kind).delete(found.area.id);
							this.lanes.delete(found.area);
						}
						break;
					}
				}
			}

			if (nextRooms) {
				this.rooms.value = nextRooms;
			}
			if (nextZones) {
				this.zones.value = nextZones;
			}
		});
	}

	async resync(): Promise<void> {
		if (this.disposed) {
			return;
		}

		const resync: Resync = {
			rooms: { overrides: new Map(), existence: new Map() },
			zones: { overrides: new Map(), existence: new Map() },
			services: new Map(),
			removedServices: new Set()
		};
		this.resyncState = resync;
		let snapshot: { rooms: BridgeArea[]; zones: BridgeArea[] };
		try {
			snapshot = await this.gateway.listAreas();
		} catch {
			if (this.resyncState === resync) {
				this.resyncState = undefined;
			}
			return;
		}
		if (this.disposed || this.resyncState !== resync) {
			return;
		}
		this.resyncState = undefined;
		batch(() => {
			this.merge('room', snapshot.rooms, resync);
			this.merge('zone', snapshot.zones, resync);
		});
	}

	private kind(kind: AreaKind): KindResync {
		const resync = this.resyncState;
		if (!resync) {
			return { overrides: new Map(), existence: new Map() };
		}

		return kind === 'room' ? resync.rooms : resync.zones;
	}

	private record(kind: AreaKind, id: string, fields: AreaFields): void {
		const resync = this.resyncState;
		if (!resync) {
			return;
		}

		const bucket = kind === 'room' ? resync.rooms : resync.zones;
		bucket.overrides.set(id, { ...bucket.overrides.get(id), ...fields });
	}

	private recordService(serviceId: string, fields: AreaFields): void {
		const resync = this.resyncState;
		if (!resync) {
			return;
		}

		resync.services.set(serviceId, { ...resync.services.get(serviceId), ...fields });
	}

	private merge(kind: AreaKind, snapshot: readonly BridgeArea[], resync: Resync): void {
		const signal = kind === 'room' ? this.rooms : this.zones;
		const bucket = kind === 'room' ? resync.rooms : resync.zones;
		const current = signal.peek();
		const remote = new Map(snapshot.map((state) => [state.id, state]));
		const next = new Map<string, Area>();

		for (const [id, area] of current) {
			const state = remote.get(id);
			if (state && !dropped(state, bucket, resync)) {
				this.apply(area, withoutFields(state, overridesFor(state, bucket, resync)));
				next.set(id, area);
			} else if (bucket.existence.get(id) === 'added') {
				next.set(id, area);
			} else {
				this.lanes.delete(area);
			}
		}

		for (const [id, state] of remote) {
			if (
				next.has(id) ||
				bucket.existence.get(id) === 'removed' ||
				dropped(state, bucket, resync)
			) {
				continue;
			}

			next.set(id, new Area({ ...state, ...overridesFor(state, bucket, resync) }));
		}

		if (!sameEntries(current, next)) {
			signal.value = next;
		}
	}

	private apply(area: Area, fields: AreaFields): void {
		if (fields.serviceId !== undefined) {
			area.setServiceId(fields.serviceId);
		}
		if (fields.name !== undefined) {
			area.setName(fields.name);
		}
		if (fields.isOn !== undefined) {
			this.lanes.get(area).power.reconcile(fields.isOn);
		}
		if (fields.brightness !== undefined) {
			this.lanes.get(area).brightness.reconcile(fields.brightness);
		}
		if (fields.color !== undefined) {
			this.lanes.get(area).color.reconcile(fields.color);
		}
	}
}

function updatedFields(change: AreaFields): AreaFields {
	const fields: AreaFields = {};
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
	if (change.serviceId !== undefined) {
		fields.serviceId = change.serviceId;
	}
	return fields;
}

function overridesFor(state: BridgeArea, bucket: KindResync, resync: Resync): AreaFields {
	return { ...resync.services.get(state.serviceId), ...bucket.overrides.get(state.id) };
}

function dropped(state: BridgeArea, bucket: KindResync, resync: Resync): boolean {
	return resync.removedServices.has(state.serviceId) && bucket.existence.get(state.id) !== 'added';
}

function withoutFields(state: BridgeArea, overrides: AreaFields): AreaFields {
	const fields: AreaFields = {
		name: state.name,
		isOn: state.isOn,
		brightness: state.brightness,
		color: state.color,
		serviceId: state.serviceId
	};
	for (const key of Object.keys(overrides) as (keyof AreaFields)[]) {
		delete fields[key];
	}
	return fields;
}

function sameEntries(left: ReadonlyMap<string, Area>, right: ReadonlyMap<string, Area>): boolean {
	if (left.size !== right.size) {
		return false;
	}

	const current = [...left];
	const next = [...right];

	return current.every(([id, area], index) => next[index]?.[0] === id && next[index]?.[1] === area);
}
