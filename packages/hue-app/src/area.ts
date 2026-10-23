import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import { freezeColor, sameColor, type XyColor } from './color';
import type { BridgeArea } from './gateway';

export class Area {
	readonly id: string;
	readonly name: ReadonlySignal<string>;
	readonly isOn: ReadonlySignal<boolean>;
	readonly brightness: ReadonlySignal<number | null>;
	readonly color: ReadonlySignal<XyColor | null>;

	private readonly nameState: Signal<string>;
	private readonly isOnState: Signal<boolean>;
	private readonly brightnessState: Signal<number | null>;
	private readonly colorState: Signal<XyColor | null>;
	private readonly serviceIdState: Signal<string>;

	constructor(state: BridgeArea) {
		this.id = state.id;
		this.nameState = signal(state.name);
		this.isOnState = signal(state.isOn);
		this.brightnessState = signal(state.brightness);
		this.colorState = signal(freezeColor(state.color));
		this.serviceIdState = signal(state.serviceId);
		this.name = computed(() => this.nameState.value);
		this.isOn = computed(() => this.isOnState.value);
		this.brightness = computed(() => this.brightnessState.value);
		this.color = computed(() => this.colorState.value);
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
}

export type ReadonlyArea = Pick<Area, 'id' | 'name' | 'isOn' | 'brightness' | 'color'>;

export interface AreaSnapshot {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
	readonly color: XyColor | null;
}
