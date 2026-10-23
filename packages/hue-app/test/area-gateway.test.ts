import {
	createHueClient,
	type HttpClient,
	type HttpRequest,
	type HttpResponse,
	type HueEvent,
	type HueEventResource
} from 'hue-sdk';
import { describe, expect, it } from 'vite-plus/test';
import type { AreaChange, LightChangeObserver } from '../src/index';
import { HueSdkGateway } from '../src/hue-sdk-gateway';
import { flushMicrotasks } from './fakes';

function pathname(url: string): string {
	const clip = url.indexOf('/clip/v2');
	return clip === -1 ? url : url.slice(clip);
}

function routingHttp(routes: Record<string, unknown>) {
	const requests: HttpRequest[] = [];
	const httpClient: HttpClient = {
		async request(request) {
			requests.push(request);
			const path = pathname(request.url);
			const body = routes[path];
			if (body === undefined) {
				throw new Error(`Unexpected ${request.method} ${path}`);
			}
			return {
				status: 200,
				headers: {} as HttpResponse['headers'],
				body: JSON.stringify(body)
			};
		}
	};
	return { httpClient, requests };
}

function envelope(data: unknown) {
	return { errors: [], data };
}

const kitchen = {
	id: 'room-1',
	type: 'room',
	children: [],
	services: [
		{ rid: 'motion', rtype: 'grouped_motion' },
		{ rid: 'gl-kitchen', rtype: 'grouped_light' }
	],
	metadata: { name: 'Kitchen', archetype: 'kitchen' }
};

const emptyRoom = {
	id: 'room-2',
	type: 'room',
	children: [],
	services: [],
	metadata: { name: 'Empty', archetype: 'other' }
};

const downstairs = {
	id: 'zone-1',
	type: 'zone',
	children: [],
	services: [{ rid: 'gl-down', rtype: 'grouped_light' }],
	metadata: { name: 'Downstairs', archetype: 'downstairs' }
};

describe('HueSdkGateway areas', () => {
	it('joins rooms and zones with their grouped lights and skips groups that have none', async () => {
		const { httpClient, requests } = routingHttp({
			'/clip/v2/resource/room': envelope([kitchen, emptyRoom]),
			'/clip/v2/resource/zone': envelope([downstairs]),
			'/clip/v2/resource/grouped_light': envelope([
				{
					id: 'gl-kitchen',
					type: 'grouped_light',
					owner: { rid: 'room-1', rtype: 'room' },
					on: { on: true },
					dimming: { brightness: 25 },
					color: { xy: { x: 0.5, y: 0.4 } }
				}
			])
		});
		const gateway = new HueSdkGateway(
			createHueClient({
				baseUrl: 'https://bridge.local',
				appKey: 'key',
				httpClient,
				throttle: false
			})
		);

		await expect(gateway.listAreas()).resolves.toEqual({
			rooms: [
				{
					id: 'room-1',
					name: 'Kitchen',
					serviceId: 'gl-kitchen',
					isOn: true,
					brightness: 25,
					color: { x: 0.5, y: 0.4 }
				}
			],
			zones: []
		});
		expect(requests.map((request) => pathname(request.url)).sort()).toEqual([
			'/clip/v2/resource/grouped_light',
			'/clip/v2/resource/room',
			'/clip/v2/resource/zone'
		]);
	});

	it('sends room and zone commands to the grouped light', async () => {
		const { httpClient, requests } = routingHttp({
			'/clip/v2/resource/grouped_light/gl-kitchen': envelope([
				{ rid: 'gl-kitchen', rtype: 'grouped_light' }
			])
		});
		const gateway = new HueSdkGateway(
			createHueClient({
				baseUrl: 'https://bridge.local',
				appKey: 'key',
				httpClient,
				throttle: false
			})
		);

		await gateway.setAreaPower('gl-kitchen', false);
		await gateway.setAreaBrightness('gl-kitchen', 12);
		await gateway.setAreaColor('gl-kitchen', { x: 0.1, y: 0.2 });

		expect(requests.map((request) => JSON.parse(request.body ?? ''))).toEqual([
			{ on: { on: false } },
			{ dimming: { brightness: 12 } },
			{ color: { xy: { x: 0.1, y: 0.2 } } }
		]);
		expect(pathname(requests[0]?.url ?? '')).toBe('/clip/v2/resource/grouped_light/gl-kitchen');
	});

	it('maps room, zone and grouped-light events', async () => {
		const gets: string[] = [];
		const sessions: Array<(events: HueEvent[]) => void> = [];
		const client = {
			events: {
				subscribe(observer: { onEvents: (events: HueEvent[]) => void }) {
					sessions.push(observer.onEvents);
					return { state: 'connecting' as const, close() {} };
				}
			},
			groupedLights: {
				async get(id: string) {
					gets.push(id);
					return {
						errors: [],
						data: [
							{
								id,
								type: 'grouped_light',
								owner: { rid: 'room-1', rtype: 'room' },
								on: { on: false },
								dimming: { brightness: 80 }
							}
						]
					};
				}
			},
			rooms: {
				async get() {
					return { errors: [], data: [] };
				}
			},
			zones: {
				async get() {
					return { errors: [], data: [] };
				}
			}
		};
		const changes: AreaChange[][] = [];
		const lights: unknown[] = [];
		const observer: LightChangeObserver = {
			onChanges: (batch) => {
				lights.push(batch);
			},
			onConnected: () => {},
			onConnectionChange: () => {},
			onAreaChanges: (batch) => {
				changes.push(batch);
			}
		};
		new HueSdkGateway(client as never).watch(observer);

		const emit = sessions[0];
		if (!emit) {
			throw new Error('watch did not subscribe');
		}

		const event = (type: HueEvent['type'], data: HueEventResource[]): HueEvent => ({
			id: 'event',
			creationtime: '2026-10-23T00:00:00Z',
			type,
			data
		});

		emit([
			event('update', [
				{ id: 'room-1', type: 'room', metadata: { name: 'Cook' } } as HueEventResource,
				{ id: 'gl-kitchen', type: 'grouped_light', on: { on: true } } as HueEventResource,
				{ id: 'device', type: 'device' } as HueEventResource
			])
		]);

		expect(changes).toEqual([
			[
				{ kind: 'updated', resource: 'room', id: 'room-1', name: 'Cook' },
				{ kind: 'service-updated', serviceId: 'gl-kitchen', isOn: true }
			]
		]);
		expect(lights).toEqual([]);

		emit([
			event('add', [
				{
					id: 'room-1',
					type: 'room',
					metadata: { name: 'Kitchen', archetype: 'kitchen' },
					services: [{ rid: 'gl-kitchen', rtype: 'grouped_light' }]
				} as HueEventResource
			])
		]);
		emit([
			event('update', [
				{ id: 'gl-kitchen', type: 'grouped_light', on: { on: true } } as HueEventResource
			])
		]);
		await flushMicrotasks();

		expect(gets).toEqual(['gl-kitchen']);
		expect(changes.at(-1)).toEqual([
			{
				kind: 'added',
				resource: 'room',
				area: {
					id: 'room-1',
					name: 'Kitchen',
					serviceId: 'gl-kitchen',
					isOn: true,
					brightness: 80,
					color: null
				}
			}
		]);
	});
});
