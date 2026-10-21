import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createZonesApi } from '../src/resources/zones.js';
import type { ZoneGet } from '../src/types/zone.js';
import { envelope, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const ZONE_ID = '99e2f2bb-a05f-42be-accb-85b241a95ae8';

const zone: ZoneGet = {
	id: ZONE_ID,
	type: 'zone',
	metadata: { name: 'Downstairs', archetype: 'downstairs' },
	children: [{ rid: 'd7c305a8-73b6-4de4-9eb8-4dc20007c2c6', rtype: 'light' }],
	services: [{ rid: 'c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc', rtype: 'grouped_light' }]
};

const identifier = { rid: ZONE_ID, rtype: 'zone' as const };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const zones = createZonesApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { zones, httpClient };
}

describe('zones', () => {
	it('lists zones with GET /clip/v2/resource/zone', async () => {
		const { zones, httpClient } = setup({ body: envelope([zone]) });

		const response = await zones.list();

		expect(response).toEqual({ errors: [], data: [zone] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/zone`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
	});

	it('gets a zone by id', async () => {
		const { zones, httpClient } = setup({ body: envelope([zone]) });

		await zones.get(ZONE_ID);

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/zone/${ZONE_ID}`);
	});

	it('creates a zone with POST /resource/zone', async () => {
		const { zones, httpClient } = setup({ body: envelope([identifier]) });
		const body = {
			metadata: { name: 'Hallway zone', archetype: 'hallway' as const },
			children: [{ rid: 'a1b2c3d4-0000-4000-8000-000000000001', rtype: 'light' as const }]
		};

		await zones.create(body);

		expect(httpClient.lastRequest.method).toBe('POST');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('updates a zone with PUT /resource/zone/{id}', async () => {
		const { zones, httpClient } = setup({ body: envelope([identifier]) });
		const body = { children: [] as typeof zone.children };

		await zones.update(ZONE_ID, body);

		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/zone/${ZONE_ID}`);
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('deletes a zone with DELETE /resource/zone/{id}', async () => {
		const { zones, httpClient } = setup({ body: envelope([identifier]) });

		await zones.delete(ZONE_ID);

		expect(httpClient.lastRequest.method).toBe('DELETE');
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('encodes the id path segment', async () => {
		const { zones, httpClient } = setup({ body: envelope([]) });

		await zones.get('id/with/slash');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/zone/id%2Fwith%2Fslash`);
	});
});
