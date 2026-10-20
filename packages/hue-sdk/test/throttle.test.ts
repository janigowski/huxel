import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHueClient } from '../src/index.js';
import { envelope, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';

function client(throttle?: boolean) {
	const httpClient = mockHttpClient({ body: envelope([]) });
	const hue = createHueClient({ baseUrl: BASE_URL, appKey: 'key', httpClient, throttle });
	return { hue, httpClient };
}

describe('throttling', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('sends the first and the last light update within 100 ms', async () => {
		const { hue, httpClient } = client();

		for (const brightness of [10, 20, 30, 40]) {
			void hue.lights.update('a', { dimming: { brightness } });
		}
		await vi.advanceTimersByTimeAsync(100);

		expect(httpClient.requests.map(parseBody)).toEqual([
			{ dimming: { brightness: 10 } },
			{ dimming: { brightness: 40 } }
		]);
	});

	it('throttles grouped light updates to one per second', async () => {
		const { hue, httpClient } = client();

		void hue.groupedLights.update('g', { on: { on: true } });
		void hue.groupedLights.update('g', { on: { on: false } });
		await vi.advanceTimersByTimeAsync(999);
		expect(httpClient.requests).toHaveLength(1);

		await vi.advanceTimersByTimeAsync(1);
		expect(httpClient.requests.map(parseBody)).toEqual([
			{ on: { on: true } },
			{ on: { on: false } }
		]);
	});

	it('throttles each resource independently', async () => {
		const { hue, httpClient } = client();

		await Promise.all([
			hue.lights.update('a', { on: { on: true } }),
			hue.lights.update('b', { on: { on: true } })
		]);

		expect(httpClient.requests).toHaveLength(2);
	});

	it('does not throttle reads', async () => {
		const { hue, httpClient } = client();

		await Promise.all([hue.lights.list(), hue.lights.list()]);

		expect(httpClient.requests).toHaveLength(2);
	});

	it('can be disabled', async () => {
		const { hue, httpClient } = client(false);

		await Promise.all([
			hue.lights.update('a', { on: { on: true } }),
			hue.lights.update('a', { on: { on: false } })
		]);

		expect(httpClient.requests).toHaveLength(2);
	});
});
