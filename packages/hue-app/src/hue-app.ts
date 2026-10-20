import { batch, computed, signal, type ReadonlySignal } from '@preact/signals-core';
import type { HueClient } from 'hue-sdk';
import { DimLight } from './dim-light.js';
import { LightNotFoundError } from './errors.js';
import type { HueAppConnection, HueGateway } from './gateway.js';
import { HueSdkGateway } from './hue-sdk-gateway.js';
import { Light } from './light.js';
import { LightCollection } from './light-collection.js';
import { ToggleLight } from './toggle-light.js';

export type HueAppStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface HueAppState {
	readonly lights: LightCollection;
	readonly status: ReadonlySignal<HueAppStatus>;
	/** Error from the last failed `initialize()`, cleared on the next attempt. */
	readonly error: ReadonlySignal<unknown>;
	readonly connection: ReadonlySignal<HueAppConnection>;
}

export type HueAppOptions = ({ client: HueClient } | { gateway: HueGateway }) & {
	live?: boolean;
	settleMs?: number;
};

export class HueApp {
	readonly state: HueAppState;

	readonly #gateway: HueGateway;
	readonly #lights = signal<ReadonlyMap<string, Light>>(new Map());
	readonly #status = signal<HueAppStatus>('idle');
	readonly #error = signal<unknown>(undefined);
	readonly #connection = signal<HueAppConnection>('offline');
	readonly #toggleLight: ToggleLight;
	readonly #dimLight: DimLight;
	#initialization: Promise<void> | undefined;

	constructor(gateway: HueGateway) {
		this.#gateway = gateway;
		this.#toggleLight = new ToggleLight(gateway);
		this.#dimLight = new DimLight(gateway);
		this.state = {
			lights: new LightCollection(this.#lights),
			status: computed(() => this.#status.value),
			error: computed(() => this.#error.value),
			connection: computed(() => this.#connection.value)
		};
	}

	dispose(): void {}

	/** Loads lights from the bridge once. Concurrent calls share the load; calls after a failure retry. */
	initialize(): Promise<void> {
		this.#initialization ??= this.#load().catch((error: unknown) => {
			this.#initialization = undefined;
			throw error;
		});
		return this.#initialization;
	}

	async #load(): Promise<void> {
		batch(() => {
			this.#status.value = 'loading';
			this.#error.value = undefined;
		});
		try {
			const bridgeLights = await this.#gateway.listLights();
			batch(() => {
				this.#lights.value = new Map(bridgeLights.map((state) => [state.id, new Light(state)]));
				this.#status.value = 'ready';
			});
		} catch (error) {
			batch(() => {
				this.#error.value = error;
				this.#status.value = 'error';
			});
			throw error;
		}
	}

	/** Flips power optimistically; reverts and rejects if the bridge rejects the command. */
	async toggleLight(lightId: string): Promise<void> {
		return this.#toggleLight.execute(this.#find(lightId));
	}

	/** Sets brightness (0–100) optimistically without changing power; reverts and rejects on failure. */
	async dimLight(lightId: string, brightness: number): Promise<void> {
		return this.#dimLight.execute(this.#find(lightId), brightness);
	}

	#find(lightId: string): Light {
		const light = this.#lights.peek().get(lightId);
		if (!light) {
			throw new LightNotFoundError(lightId);
		}
		return light;
	}
}

export function createHueApp(options: HueAppOptions): HueApp {
	return new HueApp('gateway' in options ? options.gateway : new HueSdkGateway(options.client));
}
