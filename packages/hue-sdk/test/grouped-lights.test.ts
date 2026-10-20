import { describe, expect, it } from 'vitest';
import { createHueProtocol } from '../src/protocol.js';
import { createGroupedLightsApi } from '../src/resources/grouped-lights.js';
import type { GroupedLightGet } from '../src/types/grouped-light.js';
import { envelope, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const GROUPED_LIGHT_ID = '3f2f5bd8-7d9a-4b5e-9c1e-6a1b2c3d4e5f';

const groupedLight: GroupedLightGet = {
	id: GROUPED_LIGHT_ID,
	owner: { rid: 'a1b2c3d4-0000-4000-8000-000000000001', rtype: 'room' },
	type: 'grouped_light',
	on: { on: true },
	dimming: { brightness: 80 },
	color_temperature: { mirek: 233 },
	alert: { action_values: ['breathe'] },
	signaling: { signal_values: ['no_signal', 'on_off'] }
};

const identifier = { rid: GROUPED_LIGHT_ID, rtype: 'grouped_light' as const };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const groupedLights = createGroupedLightsApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { groupedLights, httpClient };
}

describe('grouped lights', () => {
	it('lists grouped lights with GET /clip/v2/resource/grouped_light', async () => {
		const { groupedLights, httpClient } = setup({ body: envelope([groupedLight]) });

		const response = await groupedLights.list();

		expect(response).toEqual({ errors: [], data: [groupedLight] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/grouped_light`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a grouped light by id without unwrapping the data array', async () => {
		const { groupedLights, httpClient } = setup({ body: envelope([groupedLight]) });

		const response = await groupedLights.get(GROUPED_LIGHT_ID);

		expect(response.data).toEqual([groupedLight]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(
			`${BASE_URL}/clip/v2/resource/grouped_light/${GROUPED_LIGHT_ID}`
		);
	});

	it('updates a grouped light with a JSON body', async () => {
		const { groupedLights, httpClient } = setup({ body: envelope([identifier]) });
		const body = {
			on: { on: true },
			dimming: { brightness: 80 },
			color: { xy: { x: 0.369, y: 0.445 } }
		};

		const response = await groupedLights.update(GROUPED_LIGHT_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(
			`${BASE_URL}/clip/v2/resource/grouped_light/${GROUPED_LIGHT_ID}`
		);
		expect(httpClient.lastRequest.headers?.['content-type']).toBe('application/json');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('encodes the id path segment', async () => {
		const { groupedLights, httpClient } = setup({ body: envelope([]) });

		await groupedLights.get('a/b');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/grouped_light/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { groupedLights, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await groupedLights.list({ signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
