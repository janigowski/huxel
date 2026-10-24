import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import { CombinedColor } from './combined-color';
import { freezeColor, sameColor, type XyColor } from './color';
import type { BridgeArea } from './gateway';
import type { Light } from './light';

export class Area {
	readonly id: string;
	readonly name: ReadonlySignal<string>;
	readonly isOn: ReadonlySignal<boolean>;
	readonly brightness: ReadonlySignal<number | null>;
	readonly color: ReadonlySignal<XyColor | null>;
	/** `#rrggbb` colors of the child lights, in child order. */
	readonly colors: ReadonlySignal<readonly string[]>;

	private readonly nameState: Signal<string>;
	private readonly isOnState: Signal<boolean>;
	private readonly brightnessState: Signal<number | null>;
	private readonly colorState: Signal<XyColor | null>;
	private readonly serviceIdState: Signal<string>;
	private readonly combined: CombinedColor;

	constructor(state: BridgeArea, lights: Signal<ReadonlyMap<string, Light>>) {
		this.id = state.id;
		this.nameState = signal(state.name);
		this.isOnState = signal(state.isOn);
		this.brightnessState = signal(state.brightness);
		this.colorState = signal(freezeColor(state.color));
		this.serviceIdState = signal(state.serviceId);
		this.combined = new CombinedColor(state.children, lights);
		this.name = computed(() => this.nameState.value);
		this.isOn = computed(() => this.isOnState.value);
		this.brightness = computed(() => this.brightnessState.value);
		this.color = computed(() => this.colorState.value);
		this.colors = this.combined.colors;
		Object.freeze(this);
	}

	get serviceId(): string {
		return this.serviceIdState.peek();
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

	setServiceId(serviceId: string): void {
		this.serviceIdState.value = serviceId;
	}

	setChildren(children: readonly string[]): void {
		this.combined.setChildren(children);
	}
}

export type ReadonlyArea = Pick<Area, 'id' | 'name' | 'isOn' | 'brightness' | 'color' | 'colors'>;

export interface AreaSnapshot {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
	readonly color: XyColor | null;
	readonly colors: readonly string[];
}
