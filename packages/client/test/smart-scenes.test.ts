import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol';
import { createSmartScenesApi } from '../src/resources/smart-scenes';
import type { SmartSceneGet, SmartScenePost, SmartScenePut } from '../src/types/smart-scene';
import { envelope, mockHttpClient, parseBody } from './mock-http';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const SMART_SCENE_ID = '3f2f5bd8-7d9a-4b5e-9c1e-6a1b2c3d4e5f';
const SCENE_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const ROOM_ID = 'a1b2c3d4-0000-4000-8000-000000000002';

const smartScene: SmartSceneGet = {
	id: SMART_SCENE_ID,
	type: 'smart_scene',
	metadata: { name: 'Daily' },
	group: { rid: ROOM_ID, rtype: 'room' },
	week_timeslots: [
		{
			timeslots: [
				{
					start_time: { kind: 'time', time: { hour: 7, minute: 30, second: 0 } },
					target: { rid: SCENE_ID, rtype: 'scene' }
				}
			],
			recurrence: ['monday', 'tuesday']
		}
	],
	transition_duration: 60000,
	active_timeslot: { timeslot_id: 0, weekday: 'monday' },
	state: 'inactive'
};

const identifier = { rid: SMART_SCENE_ID, rtype: 'smart_scene' };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const smartScenes = createSmartScenesApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { smartScenes, httpClient };
}

describe('smart scenes', () => {
	it('lists smart scenes with GET /clip/v2/resource/smart_scene', async () => {
		const { smartScenes, httpClient } = setup({ body: envelope([smartScene]) });

		const response = await smartScenes.list();

		expect(response).toEqual({ errors: [], data: [smartScene] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/smart_scene`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a smart scene by id', async () => {
		const { smartScenes, httpClient } = setup({ body: envelope([smartScene]) });

		const response = await smartScenes.get(SMART_SCENE_ID);

		expect(response.data).toEqual([smartScene]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(
			`${BASE_URL}/clip/v2/resource/smart_scene/${SMART_SCENE_ID}`
		);
	});

	it('creates a smart scene via POST /resource/smart_scene', async () => {
		const { smartScenes, httpClient } = setup({ status: 201, body: envelope([identifier]) });
		const body: SmartScenePost = {
			metadata: { name: 'Daily' },
			group: { rid: ROOM_ID, rtype: 'room' },
			week_timeslots: [
				{
					timeslots: [
						{
							start_time: { kind: 'time', time: { hour: 7, minute: 30, second: 0 } },
							target: { rid: SCENE_ID, rtype: 'scene' }
						},
						{
							start_time: { kind: 'sunset' },
							target: { rid: SCENE_ID, rtype: 'scene' }
						}
					],
					recurrence: ['saturday', 'sunday']
				}
			],
			transition_duration: 30000,
			recall: { action: 'activate' }
		};

		const response = await smartScenes.create(body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('POST');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/smart_scene`);
		expect(httpClient.lastRequest.headers?.['content-type']).toBe('application/json');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('activates a smart scene with PUT recall body', async () => {
		const { smartScenes, httpClient } = setup({ body: envelope([identifier]) });
		const body: SmartScenePut = { recall: { action: 'deactivate' } };

		const response = await smartScenes.update(SMART_SCENE_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(
			`${BASE_URL}/clip/v2/resource/smart_scene/${SMART_SCENE_ID}`
		);
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('deletes a smart scene without a body', async () => {
		const { smartScenes, httpClient } = setup({ body: envelope([identifier]) });

		const response = await smartScenes.delete(SMART_SCENE_ID);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('DELETE');
		expect(httpClient.lastRequest.url).toBe(
			`${BASE_URL}/clip/v2/resource/smart_scene/${SMART_SCENE_ID}`
		);
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('encodes the id path segment', async () => {
		const { smartScenes, httpClient } = setup({ body: envelope([]) });

		await smartScenes.get('a/b');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/smart_scene/a%2Fb`);

		await smartScenes.update('a/b', {});
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/smart_scene/a%2Fb`);

		await smartScenes.delete('a/b');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/smart_scene/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { smartScenes, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await smartScenes.list({ signal: controller.signal });
		expect(httpClient.lastRequest.signal).toBe(controller.signal);

		await smartScenes.update(SMART_SCENE_ID, {}, { signal: controller.signal });
		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
