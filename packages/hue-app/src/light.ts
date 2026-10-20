import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import { CommandLane } from './command-lane.js';
import { InvalidBrightnessError, LightNotDimmableError } from './errors.js';
import type { BridgeLight, HueGateway } from './gateway.js';

export class Light {
	readonly id: string;
	readonly name: string;
	readonly isOn: ReadonlySignal<boolean>;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	readonly brightness: ReadonlySignal<number | null>;

	readonly #isOn: Signal<boolean>;
	readonly #brightness: Signal<number | null>;
	readonly #power: CommandLane<boolean>;
	readonly #dimmer: CommandLane<number | null>;

	constructor(state: BridgeLight, gateway: HueGateway) {
		this.id = state.id;
		this.name = state.name;
		this.#isOn = signal(state.isOn);
		this.#brightness = signal(state.brightness);
		this.isOn = computed(() => this.#isOn.value);
		this.brightness = computed(() => this.#brightness.value);
		this.#power = new CommandLane(
			() => this.#isOn.peek(),
			(isOn) => this.setPower(isOn),
			(isOn) => gateway.setPower(this.id, isOn)
		);
		this.#dimmer = new CommandLane<number | null>(
			() => this.#brightness.peek(),
			(brightness) => this.setBrightness(brightness),
			(brightness) => gateway.setBrightness(this.id, brightness ?? 0)
		);
		Object.freeze(this);
	}

	toggle(): Promise<void> {
		return this.#power.submit(!this.#isOn.peek());
	}

	async dim(brightness: number): Promise<void> {
		if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
			throw new InvalidBrightnessError(brightness);
		}
		if (this.#brightness.peek() === null) {
			throw new LightNotDimmableError(this.id);
		}
		return this.#dimmer.submit(brightness);
	}

	setPower(isOn: boolean): void {
		this.#isOn.value = isOn;
	}

	setBrightness(brightness: number | null): void {
		this.#brightness.value = brightness;
	}
}

/** Read-only view of a light exposed to consumers. */
export type ReadonlyLight = Pick<Light, 'id' | 'name' | 'isOn' | 'brightness'>;

export interface LightSnapshot {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
}
