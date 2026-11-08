import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol';
import { createRoomsApi } from '../src/resources/rooms';
import type { RoomGet } from '../src/types/room';
import { envelope, mockHttpClient, parseBody } from './mock-http';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const ROOM_ID = '6adb232c-e80c-49be-a4c8-fd32b2488bf5';

const room: RoomGet = {
	id: ROOM_ID,
	type: 'room',
	metadata: { name: 'Living room', archetype: 'living_room' },
	children: [{ rid: 'd7c305a8-73b6-4de4-9eb8-4dc20007c2c6', rtype: 'device' }],
	services: [{ rid: 'c8e1f2e6-f54f-4d20-bcdc-a568ebf61dcc', rtype: 'grouped_light' }]
};

const identifier = { rid: ROOM_ID, rtype: 'room' as const };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const rooms = createRoomsApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { rooms, httpClient };
}

describe('rooms', () => {
	it('lists rooms with GET /clip/v2/resource/room', async () => {
		const { rooms, httpClient } = setup({ body: envelope([room]) });

		const response = await rooms.list();

		expect(response).toEqual({ errors: [], data: [room] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/room`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a room by id without unwrapping the data array', async () => {
		const { rooms, httpClient } = setup({ body: envelope([room]) });

		const response = await rooms.get(ROOM_ID);

		expect(response.data).toEqual([room]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/room/${ROOM_ID}`);
	});

	it('creates a room with POST /resource/room', async () => {
		const { rooms, httpClient } = setup({ body: envelope([identifier]) });
		const body = {
			type: 'room' as const,
			metadata: { name: 'Office', archetype: 'office' as const },
			children: [{ rid: 'a1b2c3d4-0000-4000-8000-000000000001', rtype: 'device' as const }]
		};

		const response = await rooms.create(body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('POST');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/room`);
		expect(httpClient.lastRequest.headers?.['content-type']).toBe('application/json');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('updates a room with PUT /resource/room/{id}', async () => {
		const { rooms, httpClient } = setup({ body: envelope([identifier]) });
		const body = { metadata: { name: 'Renamed' } };

		const response = await rooms.update(ROOM_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/room/${ROOM_ID}`);
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('deletes a room with DELETE /resource/room/{id}', async () => {
		const { rooms, httpClient } = setup({ body: envelope([identifier]) });

		const response = await rooms.delete(ROOM_ID);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('DELETE');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/room/${ROOM_ID}`);
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('encodes the id path segment', async () => {
		const { rooms, httpClient } = setup({ body: envelope([]) });

		await rooms.get('a/b');

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/room/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { rooms, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await rooms.list({ signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
