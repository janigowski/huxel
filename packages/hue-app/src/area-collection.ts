import { computed, type ReadonlySignal } from '@preact/signals-core';
import type { ReadonlyArea } from './area';

export class AreaCollection {
	private readonly byId: ReadonlySignal<ReadonlyMap<string, ReadonlyArea>>;
	private readonly all: ReadonlySignal<readonly ReadonlyArea[]>;

	constructor(byId: ReadonlySignal<ReadonlyMap<string, ReadonlyArea>>) {
		this.byId = byId;
		this.all = computed(() =>
			[...byId.value.values()].sort((left, right) =>
				left.name.value.localeCompare(right.name.value)
			)
		);
	}

	get value(): readonly ReadonlyArea[] {
		return this.all.value;
	}

	peek(): readonly ReadonlyArea[] {
		return this.all.peek();
	}

	get(id: string): ReadonlyArea | undefined {
		return this.byId.value.get(id);
	}

	subscribe(listener: (areas: readonly ReadonlyArea[]) => void): () => void {
		return this.all.subscribe(listener);
	}
}
