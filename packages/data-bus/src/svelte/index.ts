import { createSubscriber } from 'svelte/reactivity';
import { on, read } from '../index';
import type { DataMap } from '../types';

export interface SvelteData<T> {
	readonly value: T;
}

type DataValue<K extends string> = K extends keyof DataMap ? DataMap[K] : unknown;

export function data<K extends string>(name: K): SvelteData<DataValue<K>> {
	const channel: string = name;
	const subscribe = createSubscriber((update) => {
		return on(channel, () => {
			update();
		});
	});

	return {
		get value(): DataValue<K> {
			subscribe();

			return read(channel) as DataValue<K>;
		}
	};
}
