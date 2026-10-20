import { describe, expect, it } from 'vitest';
import { createHueClient } from '../src/index.js';
import type { LightGet } from '../src/index.js';
import { envelope, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const LIGHT_ID = '3f2f5bd8-7d9a-4b5e-9c1e-6a1b2c3d4e5f';

const light: LightGet = {
	id: LIGHT_ID,
	owner: { rid: 'a1b2c3d4-0000-4000-8000-000000000001', rtype: 'device' },
	type: 'light',
	metadata: { name: 'Desk', archetype: 'classic_bulb', function: 'functional' },
	identify: {},
	service_id: 0,
	on: { on: true },
	dimming: { brightness: 80, min_dim_level: 0.2 },
	color_temperature: {
		mirek: null,
		mirek_valid: false,
		mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 }
	},
	mode: 'normal'
};

const identifier = { rid: LIGHT_ID, rtype: 'light' };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const hue = createHueClient({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient });
	return { hue, httpClient };
}

describe('lights', () => {
	it('lists lights with GET /clip/v2/resource/light', async () => {
		const { hue, httpClient } = setup({ body: envelope([light]) });

		const response = await hue.lights.list();

		expect(response).toEqual({ errors: [], data: [light] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/light`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a light by id without unwrapping the data array', async () => {
		const { hue, httpClient } = setup({ body: envelope([light]) });

		const response = await hue.lights.get(LIGHT_ID);

		expect(response.data).toEqual([light]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/light/${LIGHT_ID}`);
	});

	it('updates a light with a JSON body', async () => {
		const { hue, httpClient } = setup({ body: envelope([identifier]) });
		const body = {
			on: { on: true },
			dimming: { brightness: 80 },
			color: { xy: { x: 0.369, y: 0.445 } }
		};

		const response = await hue.lights.update(LIGHT_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/light/${LIGHT_ID}`);
		expect(httpClient.lastRequest.headers?.['content-type']).toBe('application/json');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('updates many lights with PUT /resource/light and an array body', async () => {
		const { hue, httpClient } = setup({ body: envelope([identifier]) });
		const body = [{ id: LIGHT_ID, on: { on: false } }];

		await hue.lights.updateMany(body);

		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/light`);
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('encodes the id path segment', async () => {
		const { hue, httpClient } = setup({ body: envelope([]) });

		await hue.lights.get('a/b');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/light/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { hue, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await hue.lights.list({ signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
