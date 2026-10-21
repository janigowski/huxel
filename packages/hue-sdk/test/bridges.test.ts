import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createBridgesApi } from '../src/resources/bridges.js';
import type { BridgeGet } from '../src/types/bridge.js';
import { envelope, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const BRIDGE_ID = 'eeff0011-2233-4455-6677-8899aabbccdd';

const bridge: BridgeGet = {
	id: BRIDGE_ID,
	owner: { rid: 'a1b2c3d4-0000-4000-8000-000000000001', rtype: 'device' },
	type: 'bridge',
	bridge_id: '0123456789ab',
	time_zone: { time_zone: 'Europe/Amsterdam' }
};

const identifier = { rid: BRIDGE_ID, rtype: 'bridge' as const };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const bridges = createBridgesApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { bridges, httpClient };
}

describe('bridges', () => {
	it('lists bridges with GET /clip/v2/resource/bridge', async () => {
		const { bridges, httpClient } = setup({ body: envelope([bridge]) });

		const response = await bridges.list();

		expect(response).toEqual({ errors: [], data: [bridge] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/bridge`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a bridge by id without unwrapping the data array', async () => {
		const { bridges, httpClient } = setup({ body: envelope([bridge]) });

		const response = await bridges.get(BRIDGE_ID);

		expect(response.data).toEqual([bridge]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/bridge/${BRIDGE_ID}`);
	});

	it('updates a bridge with PUT /resource/bridge/{id}', async () => {
		const { bridges, httpClient } = setup({ body: envelope([identifier]) });
		const body = { type: 'bridge' as const };

		const response = await bridges.update(BRIDGE_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/bridge/${BRIDGE_ID}`);
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('encodes the id path segment', async () => {
		const { bridges, httpClient } = setup({ body: envelope([]) });

		await bridges.get('a/b');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/bridge/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { bridges, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await bridges.list({ signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
