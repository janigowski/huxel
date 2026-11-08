import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vite-plus/test';
import { data, resetDataBus } from '../src/index';
import { data as svelteData } from '../src/svelte/index';

afterEach(() => {
	resetDataBus();
});

function watch<T>(read: () => T) {
	const runs: T[] = [];
	const cleanup = $effect.root(() => {
		$effect(() => {
			runs.push(read());
		});
	});
	flushSync();

	return { runs, cleanup };
}

describe('svelte data', () => {
	test('re-runs when the named value changes', () => {
		const status = data('status', 'idle');
		const readStatus = svelteData('status');
		const { runs, cleanup } = watch(() => readStatus.value);

		expect(runs).toEqual(['idle']);

		status.value = 'ready';
		flushSync();
		status.value = 'ready';
		flushSync();

		expect(runs).toEqual(['idle', 'ready']);
		cleanup();
	});

	test('re-runs when a nested property changes', () => {
		const color = data('color', { xy: { x: 0.1, y: 0.2 } });
		const readX = svelteData('color');
		const { runs, cleanup } = watch(() => {
			const value = readX.value as { xy: { x: number } };

			return value.xy.x;
		});

		expect(runs).toEqual([0.1]);

		color.value.xy.x = 0.5;
		flushSync();

		expect(runs).toEqual([0.1, 0.5]);
		cleanup();
	});
});
