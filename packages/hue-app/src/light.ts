import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import { freezeColor, sameColor, type XyColor } from './color.js';
import type { BridgeLight } from './gateway.js';

export class Light {
	readonly id: string;
	readonly name: ReadonlySignal<string>;
	readonly isOn: ReadonlySignal<boolean>;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	readonly brightness: ReadonlySignal<number | null>;
	readonly color: ReadonlySignal<XyColor | null>;

	readonly #name: Signal<string>;
	readonly #isOn: Signal<boolean>;
	readonly #brightness: Signal<number | null>;
	readonly #color: Signal<XyColor | null>;

	constructor(state: BridgeLight) {
		this.id = state.id;
		this.#name = signal(state.name);
		this.#isOn = signal(state.isOn);
		this.#brightness = signal(state.brightness);
		this.#color = signal(freezeColor(state.color ?? null));
		this.name = computed(() => this.#name.value);
		this.isOn = computed(() => this.#isOn.value);
		this.brightness = computed(() => this.#brightness.value);
		this.color = computed(() => this.#color.value);
		Object.freeze(this);
	}

	setName(name: string): void {
		this.#name.value = name;
	}

	setPower(isOn: boolean): void {
		this.#isOn.value = isOn;
	}

	setBrightness(brightness: number | null): void {
		this.#brightness.value = brightness;
	}

	setColor(color: XyColor | null): void {
		if (sameColor(this.#color.peek(), color)) {
			return;
		}

		this.#color.value = freezeColor(color);
	}
}

/** Read-only view of a light exposed to consumers. */
export type ReadonlyLight = Pick<Light, 'id' | 'name' | 'isOn' | 'brightness' | 'color'>;

export interface LightSnapshot {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
	readonly color: XyColor | null;
}
