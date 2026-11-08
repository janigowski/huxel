import { afterEach, describe, expect, test } from 'vite-plus/test';
import { data, on, read, resetDataBus } from '../src/index';

afterEach(() => {
	resetDataBus();
});

describe('shared bus', () => {
	test('connects a writer and a subscriber that only share the name', () => {
		const status = data('app.status', 'idle');
		const seen: string[] = [];

		on('app.status', (value) => {
			seen.push(value);
		});
		status.value = 'ready';

		expect(read('app.status')).toBe('ready');
		expect(seen).toEqual(['ready']);
	});
});
