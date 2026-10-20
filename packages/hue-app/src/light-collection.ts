import { computed, type ReadonlySignal } from '@preact/signals-core';
import type { ReadonlyLight } from './light.js';

/** Observable, read-only collection of lights. Reading `value` or `get` inside an effect tracks membership changes. */
export class LightCollection {
	readonly #byId: ReadonlySignal<ReadonlyMap<string, ReadonlyLight>>;
	readonly #all: ReadonlySignal<readonly ReadonlyLight[]>;

	constructor(byId: ReadonlySignal<ReadonlyMap<string, ReadonlyLight>>) {
		this.#byId = byId;
		this.#all = computed(() => [...byId.value.values()]);
	}

	get value(): readonly ReadonlyLight[] {
		return this.#all.value;
	}

	peek(): readonly ReadonlyLight[] {
		return this.#all.peek();
	}

	get(id: string): ReadonlyLight | undefined {
		return this.#byId.value.get(id);
	}

	subscribe(listener: (lights: readonly ReadonlyLight[]) => void): () => void {
		return this.#all.subscribe(listener);
	}
}
