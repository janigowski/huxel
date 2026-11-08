import type { HttpClient, HttpRequest, HttpResponse } from '@huxel/client';

export interface StoredLight {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
	color: { x: number; y: number } | null;
}

export interface StoredArea {
	id: string;
	name: string;
	kind: 'room' | 'zone';
	serviceId?: string;
}

export interface StoredGroup {
	id: string;
	on: boolean;
	brightness: number | null;
	color: { x: number; y: number } | null;
}

export interface StoredScene {
	id: string;
	name: string;
	groupId: string;
}

export interface FakeBridge {
	readonly http: HttpClient;
	readonly requests: HttpRequest[];
	button: boolean;
	appKey: string;
	offline: boolean;
	revoke: boolean;
	timeout: boolean;
	unauthorizedStatus: number;
	failHost?: string;
	lights: StoredLight[];
	areas: StoredArea[];
	groups: StoredGroup[];
	scenes: StoredScene[];
}

const ISSUED_KEY = 'app-key-1';
const ENTERTAINMENT_KEY = 'entertainment-key';

export function createFakeBridge(): FakeBridge {
	const requests: HttpRequest[] = [];
	const bridge: FakeBridge = {
		requests,
		button: false,
		appKey: ISSUED_KEY,
		offline: false,
		revoke: false,
		timeout: false,
		unauthorizedStatus: 401,
		lights: [
			{
				id: 'light-1',
				name: 'Desk',
				on: false,
				brightness: 50,
				color: { x: 0.4, y: 0.4 }
			}
		],
		areas: [{ id: 'room-1', name: 'Office', kind: 'room', serviceId: 'group-1' }],
		groups: [{ id: 'group-1', on: false, brightness: 40, color: { x: 0.4, y: 0.4 } }],
		scenes: [{ id: 'scene-1', name: 'Concentrate', groupId: 'room-1' }],
		http: {
			async request(request) {
				requests.push(request);

				if (bridge.failHost && request.url.includes(`://${bridge.failHost}/`)) {
					const error = new Error('The operation was aborted due to timeout');
					error.name = 'TimeoutError';
					throw error;
				}

				if (bridge.timeout) {
					const error = new Error('The operation was aborted due to timeout');
					error.name = 'TimeoutError';
					throw error;
				}

				if (bridge.offline) {
					throw new Error('socket hang up');
				}

				return answer(bridge, request);
			}
		}
	};

	return bridge;
}

export { ENTERTAINMENT_KEY, ISSUED_KEY };

function answer(bridge: FakeBridge, request: HttpRequest): HttpResponse {
	const url = new URL(request.url);

	if (request.method === 'POST' && url.pathname === '/api') {
		if (!bridge.button) {
			return json(200, [
				{ error: { type: 101, address: '', description: 'link button not pressed' } }
			]);
		}

		return json(200, [{ success: { username: bridge.appKey, clientkey: ENTERTAINMENT_KEY } }]);
	}

	const key = request.headers?.['hue-application-key'];

	if (bridge.revoke || key !== bridge.appKey) {
		return json(bridge.unauthorizedStatus, { errors: [{ description: 'unauthorized' }], data: [] });
	}

	const path = url.pathname.replace(/^\/clip\/v2/, '');

	if (request.method === 'GET' && path === '/resource/bridge') {
		return json(200, { errors: [], data: [] });
	}

	if (request.method === 'GET' && path === '/resource/light') {
		return json(200, { errors: [], data: bridge.lights.map(lightBody) });
	}

	if (request.method === 'GET' && path.startsWith('/resource/light/')) {
		const light = bridge.lights.find(
			(item) => item.id === decodeURIComponent(path.slice('/resource/light/'.length))
		);

		return json(200, { errors: [], data: light ? [lightBody(light)] : [] });
	}

	if (request.method === 'PUT' && path.startsWith('/resource/light/')) {
		const light = bridge.lights.find(
			(item) => item.id === decodeURIComponent(path.slice('/resource/light/'.length))
		);

		if (!light) {
			return json(404, { errors: [{ description: 'not found' }], data: [] });
		}

		apply(light, request.body);

		return json(200, { errors: [], data: [{ rid: light.id, rtype: 'light' }] });
	}

	if (request.method === 'GET' && path === '/resource/room') {
		return json(200, {
			errors: [],
			data: bridge.areas.filter((area) => area.kind === 'room').map(areaBody)
		});
	}

	if (request.method === 'GET' && path === '/resource/zone') {
		return json(200, {
			errors: [],
			data: bridge.areas.filter((area) => area.kind === 'zone').map(areaBody)
		});
	}

	if (request.method === 'GET' && path === '/resource/grouped_light') {
		return json(200, { errors: [], data: bridge.groups.map(groupBody) });
	}

	if (request.method === 'GET' && path.startsWith('/resource/grouped_light/')) {
		const group = bridge.groups.find(
			(item) => item.id === decodeURIComponent(path.slice('/resource/grouped_light/'.length))
		);

		return json(200, { errors: [], data: group ? [groupBody(group)] : [] });
	}

	if (request.method === 'PUT' && path.startsWith('/resource/grouped_light/')) {
		const group = bridge.groups.find(
			(item) => item.id === decodeURIComponent(path.slice('/resource/grouped_light/'.length))
		);

		if (!group) {
			return json(404, { errors: [{ description: 'not found' }], data: [] });
		}

		apply(group, request.body);

		return json(200, { errors: [], data: [{ rid: group.id, rtype: 'grouped_light' }] });
	}

	if (request.method === 'GET' && path === '/resource/scene') {
		return json(200, { errors: [], data: bridge.scenes.map(sceneBody) });
	}

	if (request.method === 'PUT' && path.startsWith('/resource/scene/')) {
		const id = decodeURIComponent(path.slice('/resource/scene/'.length));
		const scene = bridge.scenes.find((item) => item.id === id);

		if (!scene) {
			return json(404, { errors: [{ description: 'not found' }], data: [] });
		}

		return json(200, { errors: [], data: [{ rid: scene.id, rtype: 'scene' }] });
	}

	return json(404, { errors: [{ description: `unexpected ${request.method} ${path}` }], data: [] });
}

function apply(
	target: { on: boolean; brightness: number | null; color: { x: number; y: number } | null },
	body: string | undefined
): void {
	const parsed: unknown = body === undefined ? {} : JSON.parse(body);

	if (!isRecord(parsed)) {
		return;
	}

	if (isRecord(parsed.on) && typeof parsed.on.on === 'boolean') {
		target.on = parsed.on.on;
	}

	if (isRecord(parsed.dimming) && typeof parsed.dimming.brightness === 'number') {
		target.brightness = parsed.dimming.brightness;
	}

	if (isRecord(parsed.color) && isRecord(parsed.color.xy)) {
		const { x, y } = parsed.color.xy;

		if (typeof x === 'number' && typeof y === 'number') {
			target.color = { x, y };
		}
	}
}

function lightBody(light: StoredLight) {
	return {
		id: light.id,
		type: 'light',
		metadata: { name: light.name },
		on: { on: light.on },
		...(light.brightness === null ? {} : { dimming: { brightness: light.brightness } }),
		...(light.color === null ? {} : { color: { xy: light.color } })
	};
}

function areaBody(area: StoredArea) {
	return {
		id: area.id,
		type: area.kind,
		metadata: { name: area.name },
		services: area.serviceId === undefined ? [] : [{ rid: area.serviceId, rtype: 'grouped_light' }],
		children: []
	};
}

function groupBody(group: StoredGroup) {
	return {
		id: group.id,
		type: 'grouped_light',
		on: { on: group.on },
		...(group.brightness === null ? {} : { dimming: { brightness: group.brightness } }),
		...(group.color === null ? {} : { color: { xy: group.color } })
	};
}

function sceneBody(scene: StoredScene) {
	return {
		id: scene.id,
		type: 'scene',
		metadata: { name: scene.name },
		group: { rid: scene.groupId, rtype: 'room' }
	};
}

function json(status: number, body: unknown): HttpResponse {
	return {
		status,
		headers: new Headers({ 'content-type': 'application/json' }),
		body: JSON.stringify(body)
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
