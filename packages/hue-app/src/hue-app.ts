import { batch, computed, signal, type ReadonlySignal } from '@preact/signals-core';
import { createHueClient, type HttpClient } from 'hue-sdk';
import { ChangeColor } from './change-color';
import type { XyColor } from './color';
import { DimLight } from './dim-light';
import { HueAppDisposedError, LightNotFoundError } from './errors';
import type { HueAppConnection, HueGateway } from './gateway';
import { HueSdkGateway } from './hue-sdk-gateway';
import { Light } from './light';
import { LightCollection } from './light-collection';
import { LightLaneRegistry } from './light-lanes';
import { LiveSync } from './live-sync';
import { ToggleLight } from './toggle-light';

export type HueAppStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface HueAppState {
	readonly lights: LightCollection;
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

const DEFAULT_SETTLE_MS = 1500;

export class HueApp implements HueAppActions {
	readonly state: HueAppState;

	private readonly gateway: HueGateway;
	private readonly lights = signal<ReadonlyMap<string, Light>>(new Map());
	private readonly status = signal<HueAppStatus>('idle');
	private readonly error = signal<unknown>(undefined);
	private readonly connection = signal<HueAppConnection>('offline');
	private readonly lanes: LightLaneRegistry;
	private readonly toggleLightState: ToggleLight;
	private readonly dimLightState: DimLight;
	private readonly changeColorState: ChangeColor;
	private readonly liveSync: LiveSync | undefined;
	private initialization: Promise<void> | undefined;
	private disposed = false;

	constructor(gateway: HueGateway, options: { live?: boolean; settleMs?: number } = {}) {
		this.gateway = gateway;
		this.lanes = new LightLaneRegistry(gateway, options.settleMs ?? DEFAULT_SETTLE_MS);
		this.toggleLightState = new ToggleLight(this.lanes);
		this.dimLightState = new DimLight(this.lanes);
		this.changeColorState = new ChangeColor(this.lanes);
		this.liveSync =
			options.live !== false && gateway.watch
				? new LiveSync(gateway, {
						lights: this.lights,
						connection: this.connection,
						lanes: this.lanes
					})
				: undefined;
		this.state = {
			lights: new LightCollection(this.lights),
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
		let bridgeLights;
		try {
			bridgeLights = await this.gateway.listLights();
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

export function bindActions(app: HueApp): HueAppActions {
	return {
		initialize: () => app.initialize(),
		toggleLight: (lightId) => app.toggleLight(lightId),
		dimLight: (lightId, brightness) => app.dimLight(lightId, brightness),
		changeColor: (lightId, color) => app.changeColor(lightId, color),
		dispose: () => app.dispose()
	};
}
