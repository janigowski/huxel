import { describe, expect, it } from 'vitest';
import { createHueClient } from '../src/index.js';
import { envelope, mockHttpClient } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';

function setup() {
	const httpClient = mockHttpClient({ body: envelope([]) });
	const hue = createHueClient({ baseUrl: BASE_URL, appKey: 'key', httpClient });
	return { hue, httpClient };
}

describe('resources', () => {
	it('lists all resources with GET /resource', async () => {
		const { hue, httpClient } = setup();

		await expect(hue.resources.list()).resolves.toEqual({ errors: [], data: [] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource`,
			headers: { 'hue-application-key': 'key' }
		});
	});

	it('filters by a single type', async () => {
		const { hue, httpClient } = setup();

		await hue.resources.list({ type: 'light' });

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource?type=light`);
	});

	it('joins multiple types with commas', async () => {
		const { hue, httpClient } = setup();

		await hue.resources.list({ type: ['light', 'motion'] });

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource?type=light,motion`);
	});

	it('omits the query for an empty filter', async () => {
		const { hue, httpClient } = setup();

		await hue.resources.list({ type: [] });

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource`);
	});
});
