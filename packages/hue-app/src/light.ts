import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import type { BridgeLight } from './gateway.js';

export class Light {
	readonly id: string;
	readonly name: string;
	readonly isOn: ReadonlySignal<boolean>;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	readonly brightness: ReadonlySignal<number | null>;

	readonly #isOn: Signal<boolean>;
	readonly #brightness: Signal<number | null>;

	constructor(state: BridgeLight) {
		this.id = state.id;
		this.name = state.name;
		this.#isOn = signal(state.isOn);
		this.#brightness = signal(state.brightness);
		this.isOn = computed(() => this.#isOn.value);
		this.brightness = computed(() => this.#brightness.value);
		Object.freeze(this);
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
