import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals-core';
import { xyToHex } from './color';
import type { Light } from './light';

/** Hex colors of a room or zone, taken from its child lights in child order. */
export class CombinedColor {
	readonly colors: ReadonlySignal<readonly string[]>;

	private readonly childIds: Signal<readonly string[]>;
	private readonly lights: Signal<ReadonlyMap<string, Light>>;

	constructor(childIds: readonly string[], lights: Signal<ReadonlyMap<string, Light>>) {
		this.childIds = signal(Object.freeze([...childIds]));
		this.lights = lights;
		this.colors = computed(() => this.hexes());
		Object.freeze(this);
	}

	setChildren(childIds: readonly string[]): void {
		const current = this.childIds.peek();

		if (
			current.length === childIds.length &&
			current.every((id, index) => id === childIds[index])
		) {
			return;
		}

		this.childIds.value = Object.freeze([...childIds]);
	}

	private hexes(): readonly string[] {
		const lights = this.lights.value;
		const hexes: string[] = [];

		for (const id of this.childIds.value) {
			const color = lights.get(id)?.color.value;

			if (color) {
				hexes.push(xyToHex(color));
			}
		}

		return Object.freeze(hexes);
	}
}
