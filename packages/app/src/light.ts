import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import {
	freezeColor,
	freezeGamut,
	sameColor,
	sameGamut,
	xyToHex,
	type GamutTriangle,
	type XyColor
} from './color';
import type { BridgeLight } from './gateway';
import {
	freezeMirekRange,
	freezeTemperature,
	isMirek,
	mirekToHex,
	sameMirekRange,
	sameTemperature,
	type ColorTemperature,
	type MirekRange
} from './temperature';

export class Light {
	readonly id: string;
	readonly name: ReadonlySignal<string>;
	readonly isOn: ReadonlySignal<boolean>;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	readonly brightness: ReadonlySignal<number | null>;
	readonly color: ReadonlySignal<XyColor | null>;
	readonly temperature: ReadonlySignal<ColorTemperature | null>;
	readonly gamut: ReadonlySignal<GamutTriangle | null>;
	readonly mirekRange: ReadonlySignal<MirekRange | null>;
	readonly colors: ReadonlySignal<readonly string[]>;

	private readonly nameState: Signal<string>;
	private readonly isOnState: Signal<boolean>;
	private readonly brightnessState: Signal<number | null>;
	private readonly colorState: Signal<XyColor | null>;
	private readonly temperatureState: Signal<ColorTemperature | null>;
	private readonly gamutState: Signal<GamutTriangle | null>;
	private readonly mirekRangeState: Signal<MirekRange | null>;

	constructor(state: BridgeLight) {
		this.id = state.id;
		this.nameState = signal(state.name);
		this.isOnState = signal(state.isOn);
		this.brightnessState = signal(state.brightness);
		this.colorState = signal(freezeColor(state.color ?? null));
		this.temperatureState = signal(freezeTemperature(state.temperature));
		this.gamutState = signal(freezeGamut(state.gamut ?? null));
		this.mirekRangeState = signal(freezeMirekRange(state.mirekRange ?? null));
		this.name = computed(() => this.nameState.value);
		this.isOn = computed(() => this.isOnState.value);
		this.brightness = computed(() => this.brightnessState.value);
		this.color = computed(() => this.colorState.value);
		this.temperature = computed(() => this.temperatureState.value);
		this.gamut = computed(() => this.gamutState.value);
		this.mirekRange = computed(() => this.mirekRangeState.value);
		this.colors = computed(() => this.palette());
		Object.freeze(this);
	}

	setName(name: string): void {
		this.nameState.value = name;
	}

	setPower(isOn: boolean): void {
		this.isOnState.value = isOn;
	}

	setBrightness(brightness: number | null): void {
		this.brightnessState.value = brightness;
	}

	setColor(color: XyColor | null): void {
		if (sameColor(this.colorState.peek(), color)) {
			return;
		}

		this.colorState.value = freezeColor(color);
	}

	setTemperature(temperature: ColorTemperature | null): void {
		const next = freezeTemperature(temperature);

		if (sameTemperature(this.temperatureState.peek(), next)) {
			return;
		}

		this.temperatureState.value = next;
	}

	setGamut(gamut: GamutTriangle | null): void {
		const next = freezeGamut(gamut);

		if (sameGamut(this.gamutState.peek(), next)) {
			return;
		}

		this.gamutState.value = next;
	}

	setMirekRange(range: MirekRange | null): void {
		const next = freezeMirekRange(range);

		if (sameMirekRange(this.mirekRangeState.peek(), next)) {
			return;
		}

		this.mirekRangeState.value = next;
	}

	private palette(): readonly string[] {
		const color = this.colorState.value;

		if (color) {
			return Object.freeze([xyToHex(color)]);
		}

		const mirek = this.temperatureState.value?.mirek;

		if (isMirek(mirek)) {
			return Object.freeze([mirekToHex(mirek)]);
		}

		return Object.freeze([]);
	}
}

/** Read-only view of a light exposed to consumers. */
export type ReadonlyLight = Pick<
	Light,
	| 'id'
	| 'name'
	| 'isOn'
	| 'brightness'
	| 'color'
	| 'temperature'
	| 'gamut'
	| 'mirekRange'
	| 'colors'
>;

export interface LightSnapshot {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
	readonly color: XyColor | null;
	readonly temperature: ColorTemperature | null;
	readonly gamut: GamutTriangle | null;
	readonly mirekRange: MirekRange | null;
	readonly colors: readonly string[];
}
