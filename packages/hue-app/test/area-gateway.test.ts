import type { GroupedLightGet, HueEvent, HueEventResource, RoomGet, ZoneGet } from 'hue-sdk';
import { describe, expect, it } from 'vite-plus/test';
import type { AreaChange, LightChangeObserver } from '../src/index';
import { HueSdkGateway } from '../src/hue-sdk-gateway';
import { FakeHueClient } from './fake-hue-client';
import { flushMicrotasks } from './fakes';

const kitchen: RoomGet = {
	id: 'room-1',
	type: 'room',
	children: [],
	services: [
		{ rid: 'motion', rtype: 'grouped_motion' },
		{ rid: 'gl-kitchen', rtype: 'grouped_light' }
	],
	metadata: { name: 'Kitchen', archetype: 'kitchen' }
};

const emptyRoom: RoomGet = {
	id: 'room-2',
	type: 'room',
	children: [],
	services: [],
	metadata: { name: 'Empty', archetype: 'other' }
};

const downstairs: ZoneGet = {
	id: 'zone-1',
	type: 'zone',
	children: [],
	services: [{ rid: 'gl-down', rtype: 'grouped_light' }],
	metadata: { name: 'Downstairs', archetype: 'downstairs' }
};

const kitchenLight: GroupedLightGet = {
	id: 'gl-kitchen',
	type: 'grouped_light',
	owner: { rid: 'room-1', rtype: 'room' },
	on: { on: true },
	dimming: { brightness: 25 },
	color: { xy: { x: 0.5, y: 0.4 } }
};

describe('HueSdkGateway areas', () => {
	it('joins rooms and zones with their grouped lights and skips groups that have none', async () => {
		const fake = new FakeHueClient({
			rooms: [kitchen, emptyRoom],
			zones: [downstairs],
			groupedLights: [kitchenLight]
		});
		const gateway = new HueSdkGateway(fake.client);

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
		expect(fake.lists).toEqual(['rooms', 'zones', 'groupedLights']);
	});

	it('sends room and zone commands to the grouped light', async () => {
		const fake = new FakeHueClient();
		const gateway = new HueSdkGateway(fake.client);

		await gateway.setAreaPower('gl-kitchen', false);
		await gateway.setAreaBrightness('gl-kitchen', 12);
		await gateway.setAreaColor('gl-kitchen', { x: 0.1, y: 0.2 });

		expect(fake.updates).toEqual([
			{ id: 'gl-kitchen', body: { on: { on: false } } },
			{ id: 'gl-kitchen', body: { dimming: { brightness: 12 } } },
			{ id: 'gl-kitchen', body: { color: { xy: { x: 0.1, y: 0.2 } } } }
		]);
	});

	it('maps room, zone and grouped-light events', async () => {
		const fake = new FakeHueClient({
			groupedLight: (id) => ({
				id,
				type: 'grouped_light',
				owner: { rid: 'room-1', rtype: 'room' },
				on: { on: false },
				dimming: { brightness: 80 }
			})
		});
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
		new HueSdkGateway(fake.client).watch(observer);

		const event = (type: HueEvent['type'], data: HueEventResource[]): HueEvent => ({
			id: 'event',
			creationtime: '2026-10-23T00:00:00Z',
			type,
			data
		});

		fake.emit([
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

		fake.emit([
			event('add', [
				{
					id: 'room-1',
					type: 'room',
					metadata: { name: 'Kitchen', archetype: 'kitchen' },
					services: [{ rid: 'gl-kitchen', rtype: 'grouped_light' }]
				} as HueEventResource
			])
		]);
		fake.emit([
			event('update', [
				{ id: 'gl-kitchen', type: 'grouped_light', on: { on: true } } as HueEventResource
			])
		]);
		await flushMicrotasks();

		expect(fake.gets).toEqual(['gl-kitchen']);
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
