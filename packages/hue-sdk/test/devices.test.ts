import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol';
import { createDevicesApi } from '../src/resources/devices';
import type { DeviceGet } from '../src/types/device';
import { envelope, mockHttpClient, parseBody } from './mock-http';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const DEVICE_ID = 'd7c305a8-73b6-4de4-9eb8-4dc20007c2c6';

const device: DeviceGet = {
	id: DEVICE_ID,
	type: 'device',
	product_data: {
		model_id: 'LCT015',
		manufacturer_name: 'Signify Netherlands B.V.',
		product_name: 'Hue color downlight',
		product_archetype: 'flood_bulb',
		certified: true,
		software_version: '1.122.8'
	},
	metadata: { name: 'Kitchen light', archetype: 'flood_bulb' },
	identify: {},
	services: [{ rid: '3f2f5bd8-7d9a-4b5e-9c1e-6a1b2c3d4e5f', rtype: 'light' }]
};

const identifier = { rid: DEVICE_ID, rtype: 'device' as const };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const devices = createDevicesApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { devices, httpClient };
}

describe('devices', () => {
	it('lists devices with GET /clip/v2/resource/device', async () => {
		const { devices, httpClient } = setup({ body: envelope([device]) });

		const response = await devices.list();

		expect(response).toEqual({ errors: [], data: [device] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/device`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a device by id without unwrapping the data array', async () => {
		const { devices, httpClient } = setup({ body: envelope([device]) });

		const response = await devices.get(DEVICE_ID);

		expect(response.data).toEqual([device]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/device/${DEVICE_ID}`);
	});

	it('updates a device with PUT /resource/device/{id}', async () => {
		const { devices, httpClient } = setup({ body: envelope([identifier]) });
		const body = { metadata: { name: 'Renamed' } };

		const response = await devices.update(DEVICE_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/device/${DEVICE_ID}`);
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('deletes a device with DELETE /resource/device/{id}', async () => {
		const { devices, httpClient } = setup({ body: envelope([identifier]) });

		const response = await devices.delete(DEVICE_ID);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('DELETE');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/device/${DEVICE_ID}`);
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('encodes the id path segment', async () => {
		const { devices, httpClient } = setup({ body: envelope([]) });

		await devices.get('a/b');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/device/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { devices, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await devices.list({ signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
