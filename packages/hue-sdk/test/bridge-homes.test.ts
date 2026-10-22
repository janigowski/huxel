import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol';
import { createBridgeHomesApi } from '../src/resources/bridge-homes';
import type { BridgeHomeGet } from '../src/types/bridge-home';
import { envelope, mockHttpClient } from './mock-http';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const HOME_ID = 'f1e2d3c4-b5a6-4789-0123-456789abcdef';

const bridgeHome: BridgeHomeGet = {
	id: HOME_ID,
	type: 'bridge_home',
	children: [{ rid: '6adb232c-e80c-49be-a4c8-fd32b2488bf5', rtype: 'room' }],
	services: [{ rid: 'c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc', rtype: 'grouped_light' }]
};

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const bridgeHomes = createBridgeHomesApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { bridgeHomes, httpClient };
}

describe('bridge homes', () => {
	it('lists bridge homes with GET /clip/v2/resource/bridge_home', async () => {
		const { bridgeHomes, httpClient } = setup({ body: envelope([bridgeHome]) });

		const response = await bridgeHomes.list();

		expect(response).toEqual({ errors: [], data: [bridgeHome] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/bridge_home`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a bridge home by id', async () => {
		const { bridgeHomes, httpClient } = setup({ body: envelope([bridgeHome]) });

		const response = await bridgeHomes.get(HOME_ID);

		expect(response.data).toEqual([bridgeHome]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/bridge_home/${HOME_ID}`);
	});

	it('encodes the id path segment', async () => {
		const { bridgeHomes, httpClient } = setup({ body: envelope([]) });

		await bridgeHomes.get('a/b');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/bridge_home/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { bridgeHomes, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await bridgeHomes.list({ signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
