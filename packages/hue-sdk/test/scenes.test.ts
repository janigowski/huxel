import { describe, expect, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createScenesApi } from '../src/resources/scenes.js';
import type { SceneGet, ScenePost, ScenePut } from '../src/types/scene.js';
import { envelope, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'test-app-key';
const SCENE_ID = '3f2f5bd8-7d9a-4b5e-9c1e-6a1b2c3d4e5f';
const LIGHT_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const ROOM_ID = 'a1b2c3d4-0000-4000-8000-000000000002';

const scene: SceneGet = {
	id: SCENE_ID,
	id_v1: '/scenes/abc123',
	actions: [
		{
			target: { rid: LIGHT_ID, rtype: 'light' },
			action: {
				on: { on: true },
				dimming: { brightness: 80 },
				color_temperature: { mirek: null },
				dynamics: { duration: 800 }
			}
		}
	],
	palette: {
		color: [{ color: { xy: { x: 0.3, y: 0.4 } }, dimming: { brightness: 60 } }],
		dimming: [{ brightness: 70 }],
		color_temperature: [{ color_temperature: { mirek: 233 }, dimming: { brightness: 50 } }],
		effects: [],
		effects_v2: []
	},
	recall: {},
	type: 'scene',
	metadata: { name: 'Relax', appdata: 'app' },
	group: { rid: ROOM_ID, rtype: 'room' },
	speed: 0.5,
	auto_dynamic: false,
	status: { active: 'static', last_recall: '2026-10-20T13:00:00Z' },
	last_actions_update: { source: 'clip' }
};

const identifier = { rid: SCENE_ID, rtype: 'scene' };

function setup(...replies: Parameters<typeof mockHttpClient>) {
	const httpClient = mockHttpClient(...replies);
	const scenes = createScenesApi(
		createHueProtocol({ baseUrl: BASE_URL, appKey: APP_KEY, httpClient })
	);
	return { scenes, httpClient };
}

describe('scenes', () => {
	it('lists scenes with GET /clip/v2/resource/scene', async () => {
		const { scenes, httpClient } = setup({ body: envelope([scene]) });

		const response = await scenes.list();

		expect(response).toEqual({ errors: [], data: [scene] });
		expect(httpClient.lastRequest).toMatchObject({
			method: 'GET',
			url: `${BASE_URL}/clip/v2/resource/scene`,
			headers: { 'hue-application-key': APP_KEY, accept: 'application/json' }
		});
		expect(httpClient.lastRequest.body).toBeUndefined();
	});

	it('gets a scene by id without unwrapping the data array', async () => {
		const { scenes, httpClient } = setup({ body: envelope([scene]) });

		const response = await scenes.get(SCENE_ID);

		expect(response.data).toEqual([scene]);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene/${SCENE_ID}`);
	});

	it('creates a scene with actions via POST /resource/scene', async () => {
		const { scenes, httpClient } = setup({ status: 201, body: envelope([identifier]) });
		const body: ScenePost = {
			metadata: { name: 'Relax', appdata: 'app' },
			group: { rid: ROOM_ID, rtype: 'room' },
			actions: [
				{
					target: { rid: LIGHT_ID, rtype: 'light' },
					action: {
						on: { on: true },
						dimming: { brightness: 80 },
						color: { xy: { x: 0.369, y: 0.445 } },
						gradient: {
							points: [
								{ color: { xy: { x: 0.1, y: 0.2 } } },
								{ color: { xy: { x: 0.3, y: 0.4 } } }
							],
							mode: 'interpolated_palette'
						},
						effects_v2: {
							action: {
								effect: 'candle',
								parameters: { color_temperature: { mirek: 233 }, speed: 0.3 }
							}
						},
						dynamics: { duration: 800 }
					}
				}
			],
			palette: {
				color: [{ color: { xy: { x: 0.3, y: 0.4 } }, dimming: { brightness: 60 } }],
				dimming: [{ brightness: 70 }],
				color_temperature: []
			},
			speed: 0.5,
			auto_dynamic: true,
			mapping: { algorithm: 'spatial' }
		};

		const response = await scenes.create(body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('POST');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene`);
		expect(httpClient.lastRequest.headers?.['content-type']).toBe('application/json');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('recalls a scene with PUT recall body', async () => {
		const { scenes, httpClient } = setup({ body: envelope([identifier]) });
		const body: ScenePut = {
			recall: { action: 'dynamic_palette', duration: 800, dimming: { brightness: 40 } }
		};

		const response = await scenes.update(SCENE_ID, body);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('PUT');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene/${SCENE_ID}`);
		expect(httpClient.lastRequest.headers?.['content-type']).toBe('application/json');
		expect(parseBody(httpClient.lastRequest)).toEqual(body);
	});

	it('preserves partial success envelopes on update', async () => {
		const apiError = { description: 'partial' };
		const { scenes } = setup({ status: 207, body: envelope([identifier], [apiError]) });

		const response = await scenes.update(SCENE_ID, { speed: 0.2 });

		expect(response).toEqual({ errors: [apiError], data: [identifier] });
	});

	it('deletes a scene without a body', async () => {
		const { scenes, httpClient } = setup({ body: envelope([identifier]) });

		const response = await scenes.delete(SCENE_ID);

		expect(response).toEqual({ errors: [], data: [identifier] });
		expect(httpClient.lastRequest.method).toBe('DELETE');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene/${SCENE_ID}`);
		expect(httpClient.lastRequest.body).toBeUndefined();
		expect(httpClient.lastRequest.headers?.['content-type']).toBeUndefined();
	});

	it('encodes the id path segment', async () => {
		const { scenes, httpClient } = setup({ body: envelope([]) });

		await scenes.get('a/b');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene/a%2Fb`);

		await scenes.update('a/b', {});
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene/a%2Fb`);

		await scenes.delete('a/b');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/scene/a%2Fb`);
	});

	it('forwards the abort signal', async () => {
		const { scenes, httpClient } = setup({ body: envelope([]) });
		const controller = new AbortController();

		await scenes.list({ signal: controller.signal });
		expect(httpClient.lastRequest.signal).toBe(controller.signal);

		await scenes.create(
			{ metadata: { name: 'x' }, group: { rid: ROOM_ID, rtype: 'room' }, actions: [] },
			{ signal: controller.signal }
		);
		expect(httpClient.lastRequest.signal).toBe(controller.signal);

		await scenes.delete(SCENE_ID, { signal: controller.signal });
		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});
});
