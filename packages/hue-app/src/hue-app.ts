import { batch, computed, signal, type ReadonlySignal } from '@preact/signals-core';
import { createHueClient, type HttpClient } from 'hue-sdk';
import { Area } from './area';
import { AreaCollection } from './area-collection';
import { AreaLaneRegistry } from './area-lanes';
import { AreaSync } from './area-sync';
import { ChangeAreaColor } from './change-area-color';
import { ChangeColor } from './change-color';
import type { XyColor } from './color';
import { DimArea } from './dim-area';
import { DimLight } from './dim-light';
import {
	AreasUnsupportedError,
	HueAppDisposedError,
	LightNotFoundError,
	RoomNotFoundError,
	ZoneNotFoundError
} from './errors';
import type { AreaGateway, BridgeArea, HueAppConnection, HueGateway } from './gateway';
import { HueSdkGateway } from './hue-sdk-gateway';
import { Light } from './light';
import { LightCollection } from './light-collection';
import { LightLaneRegistry } from './light-lanes';
import { LiveSync } from './live-sync';
import { ToggleArea } from './toggle-area';
import { ToggleLight } from './toggle-light';

export type HueAppStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface HueAppState {
	readonly lights: LightCollection;
	readonly rooms: AreaCollection;
	readonly zones: AreaCollection;
	readonly status: ReadonlySignal<HueAppStatus>;
	/** Error from the last failed `initialize()`, cleared on the next attempt. */
	readonly error: ReadonlySignal<unknown>;
	readonly connection: ReadonlySignal<HueAppConnection>;
}

export interface HueBridgeOptions {
	/** Bridge origin, e.g. `https://192.168.1.100`. */
	baseUrl: string;
	appKey: string;
	httpClient?: HttpClient;
}

export type HueAppOptions = (HueBridgeOptions | { gateway: HueGateway }) & {
	live?: boolean;
	settleMs?: number;
};

export interface HueAppActions {
	initialize(): Promise<void>;
	toggleLight(lightId: string): Promise<void>;
	dimLight(lightId: string, brightness: number): Promise<void>;
	changeColor(lightId: string, color: XyColor): Promise<void>;
	dispose(): void;
}

export interface RoomZoneActions {
	toggleRoom(roomId: string): Promise<void>;
	dimRoom(roomId: string, brightness: number): Promise<void>;
	changeRoomColor(roomId: string, color: XyColor): Promise<void>;
	toggleZone(zoneId: string): Promise<void>;
	dimZone(zoneId: string, brightness: number): Promise<void>;
	changeZoneColor(zoneId: string, color: XyColor): Promise<void>;
}

const DEFAULT_SETTLE_MS = 1500;

export class HueApp implements HueAppActions, RoomZoneActions {
	readonly state: HueAppState;

	private readonly gateway: HueGateway;
	private readonly areaGateway: AreaGateway | undefined;
	private readonly lights = signal<ReadonlyMap<string, Light>>(new Map());
	private readonly rooms = signal<ReadonlyMap<string, Area>>(new Map());
	private readonly zones = signal<ReadonlyMap<string, Area>>(new Map());
	private readonly status = signal<HueAppStatus>('idle');
	private readonly error = signal<unknown>(undefined);
	private readonly connection = signal<HueAppConnection>('offline');
	private readonly lanes: LightLaneRegistry;
	private readonly areaLanes: AreaLaneRegistry | undefined;
	private readonly toggleLightState: ToggleLight;
	private readonly dimLightState: DimLight;
	private readonly changeColorState: ChangeColor;
	private readonly toggleAreaState: ToggleArea | undefined;
	private readonly dimAreaState: DimArea | undefined;
	private readonly changeAreaColorState: ChangeAreaColor | undefined;
	private readonly liveSync: LiveSync | undefined;
	private initialization: Promise<void> | undefined;
	private disposed = false;

	constructor(gateway: HueGateway, options: { live?: boolean; settleMs?: number } = {}) {
		const settleMs = options.settleMs ?? DEFAULT_SETTLE_MS;
		this.gateway = gateway;
		this.areaGateway = asAreaGateway(gateway);
		this.lanes = new LightLaneRegistry(gateway, settleMs);
		this.areaLanes = this.areaGateway
			? new AreaLaneRegistry(this.areaGateway, settleMs)
			: undefined;
		this.toggleLightState = new ToggleLight(this.lanes);
		this.dimLightState = new DimLight(this.lanes);
		this.changeColorState = new ChangeColor(this.lanes);
		this.toggleAreaState = this.areaLanes ? new ToggleArea(this.areaLanes) : undefined;
		this.dimAreaState = this.areaLanes ? new DimArea(this.areaLanes) : undefined;
		this.changeAreaColorState = this.areaLanes ? new ChangeAreaColor(this.areaLanes) : undefined;
		const areaSync =
			this.areaGateway && this.areaLanes && options.live !== false && gateway.watch
				? new AreaSync(this.areaGateway, this.rooms, this.zones, this.areaLanes, this.lights)
				: undefined;
		this.liveSync =
			options.live !== false && gateway.watch
				? new LiveSync(
						gateway,
						{
							lights: this.lights,
							connection: this.connection,
							lanes: this.lanes
						},
						areaSync
					)
				: undefined;
		this.state = {
			lights: new LightCollection(this.lights),
			rooms: new AreaCollection(this.rooms),
			zones: new AreaCollection(this.zones),
			status: computed(() => this.status.value),
			error: computed(() => this.error.value),
			connection: computed(() => this.connection.value)
		};
	}

	dispose(): void {
		if (this.disposed) {
			return;
		}
		this.disposed = true;
		this.liveSync?.dispose();
		this.lanes.dispose();
		this.areaLanes?.dispose();
		this.connection.value = 'offline';
	}

	/** Loads lights from the bridge once. Concurrent calls share the load; calls after a failure retry. */
	initialize(): Promise<void> {
		if (this.disposed) {
			return Promise.reject(new HueAppDisposedError());
		}
		this.initialization ??= this.load().catch((error: unknown) => {
			this.initialization = undefined;
			throw error;
		});
		return this.initialization;
	}

	private async load(): Promise<void> {
		batch(() => {
			this.status.value = 'loading';
			this.error.value = undefined;
		});
		let bridgeLights: Awaited<ReturnType<HueGateway['listLights']>>;
		let rooms: BridgeArea[] = [];
		let zones: BridgeArea[] = [];
		try {
			if (this.areaGateway) {
				const [lights, areas] = await Promise.all([
					this.gateway.listLights(),
					this.areaGateway.listAreas()
				]);
				bridgeLights = lights;
				rooms = areas.rooms;
				zones = areas.zones;
			} else {
				bridgeLights = await this.gateway.listLights();
			}
		} catch (error) {
			if (this.disposed) {
				throw new HueAppDisposedError();
			}
			batch(() => {
				this.error.value = error;
				this.status.value = 'error';
			});
			throw error;
		}
		if (this.disposed) {
			throw new HueAppDisposedError();
		}
		batch(() => {
			this.lights.value = new Map(bridgeLights.map((state) => [state.id, new Light(state)]));
			if (this.areaGateway) {
				this.rooms.value = new Map(rooms.map((state) => [state.id, new Area(state, this.lights)]));
				this.zones.value = new Map(zones.map((state) => [state.id, new Area(state, this.lights)]));
			}
			this.status.value = 'ready';
		});
		this.liveSync?.start();
	}

	/** Flips power optimistically; reverts and rejects if the bridge rejects the command. */
	async toggleLight(lightId: string): Promise<void> {
		return this.toggleLightState.execute(this.find(lightId));
	}

	/** Sets brightness (0–100) optimistically without changing power; reverts and rejects on failure. */
	async dimLight(lightId: string, brightness: number): Promise<void> {
		return this.dimLightState.execute(this.find(lightId), brightness);
	}

	async changeColor(lightId: string, color: XyColor): Promise<void> {
		return this.changeColorState.execute(this.find(lightId), color);
	}

	async toggleRoom(roomId: string): Promise<void> {
		return this.areas().toggle.execute(this.findRoom(roomId));
	}

	async dimRoom(roomId: string, brightness: number): Promise<void> {
		return this.areas().dim.execute(this.findRoom(roomId), brightness, 'room');
	}

	async changeRoomColor(roomId: string, color: XyColor): Promise<void> {
		return this.areas().color.execute(this.findRoom(roomId), color, 'room');
	}

	async toggleZone(zoneId: string): Promise<void> {
		return this.areas().toggle.execute(this.findZone(zoneId));
	}

	async dimZone(zoneId: string, brightness: number): Promise<void> {
		return this.areas().dim.execute(this.findZone(zoneId), brightness, 'zone');
	}

	async changeZoneColor(zoneId: string, color: XyColor): Promise<void> {
		return this.areas().color.execute(this.findZone(zoneId), color, 'zone');
	}

	private areas(): { toggle: ToggleArea; dim: DimArea; color: ChangeAreaColor } {
		if (!this.toggleAreaState || !this.dimAreaState || !this.changeAreaColorState) {
			throw new AreasUnsupportedError();
		}

		return {
			toggle: this.toggleAreaState,
			dim: this.dimAreaState,
			color: this.changeAreaColorState
		};
	}

	private find(lightId: string): Light {
		if (this.disposed) {
			throw new HueAppDisposedError();
		}
		const light = this.lights.peek().get(lightId);
		if (!light) {
			throw new LightNotFoundError(lightId);
		}
		return light;
	}

	private findRoom(roomId: string): Area {
		if (this.disposed) {
			throw new HueAppDisposedError();
		}
		if (!this.areaGateway) {
			throw new AreasUnsupportedError();
		}

		const room = this.rooms.peek().get(roomId);
		if (!room) {
			throw new RoomNotFoundError(roomId);
		}

		return room;
	}

	private findZone(zoneId: string): Area {
		if (this.disposed) {
			throw new HueAppDisposedError();
		}
		if (!this.areaGateway) {
			throw new AreasUnsupportedError();
		}

		const zone = this.zones.peek().get(zoneId);
		if (!zone) {
			throw new ZoneNotFoundError(zoneId);
		}

		return zone;
	}
}

export function createHueApp(options: HueAppOptions): HueApp {
	const { live, settleMs } = options;
	const gateway =
		'gateway' in options
			? options.gateway
			: new HueSdkGateway(
					createHueClient({
						baseUrl: options.baseUrl,
						appKey: options.appKey,
						httpClient: options.httpClient,
						throttle: false
					})
				);

	return new HueApp(gateway, { live, settleMs });
}

function asAreaGateway(gateway: HueGateway): AreaGateway | undefined {
	if (
		!gateway.listAreas ||
		!gateway.setAreaPower ||
		!gateway.setAreaBrightness ||
		!gateway.setAreaColor
	) {
		return undefined;
	}

	return gateway as HueGateway & AreaGateway;
}

export function bindActions(app: HueApp): HueAppActions {
	return {
		initialize: () => app.initialize(),
		toggleLight: (lightId) => app.toggleLight(lightId),
		dimLight: (lightId, brightness) => app.dimLight(lightId, brightness),
		changeColor: (lightId, color) => app.changeColor(lightId, color),
		dispose: () => app.dispose()
	};
}
