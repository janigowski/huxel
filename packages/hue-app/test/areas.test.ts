import { describe, expect, it } from 'vite-plus/test';
import { createSvelteHueApp } from '../src/svelte/index';
import {
	AreasUnsupportedError,
	HueAppDisposedError,
	InvalidBrightnessError,
	InvalidColorError,
	RoomNotFoundError,
	ZoneNotFoundError,
	createHueApp
} from '../src/index';
import type { Area, BridgeArea } from '../src/index';
import { FakeGateway, bridgeLight, deferred, flushMicrotasks, type Deferred } from './fakes';

const living: BridgeArea = {
	id: 'living',
	name: 'Living room',
	serviceId: 'living-light',
	isOn: false,
	brightness: 40,
	color: { x: 0.4, y: 0.4 }
};

const downstairs: BridgeArea = {
	id: 'downstairs',
	name: 'Downstairs',
	serviceId: 'downstairs-light',
	isOn: true,
	brightness: null,
	color: null
};

interface AreaCall<T> {
	readonly serviceId: string;
	readonly value: T;
	readonly result: Deferred<void>;
}

class AreasGateway extends FakeGateway {
	readonly areaLists: Deferred<{ rooms: BridgeArea[]; zones: BridgeArea[] }>[] = [];
	readonly areaPower: AreaCall<boolean>[] = [];
	readonly areaBrightness: AreaCall<number>[] = [];
	readonly areaColor: AreaCall<{ x: number; y: number }>[] = [];

	listAreas(): Promise<{ rooms: BridgeArea[]; zones: BridgeArea[] }> {
		const result = deferred<{ rooms: BridgeArea[]; zones: BridgeArea[] }>();
		this.areaLists.push(result);
		return result.promise;
	}

	setAreaPower(serviceId: string, isOn: boolean): Promise<void> {
		return this.areaCommand(this.areaPower, serviceId, isOn);
	}

	setAreaBrightness(serviceId: string, brightness: number): Promise<void> {
		return this.areaCommand(this.areaBrightness, serviceId, brightness);
	}

	setAreaColor(serviceId: string, color: { x: number; y: number }): Promise<void> {
		return this.areaCommand(this.areaColor, serviceId, color);
	}

	private areaCommand<T>(calls: AreaCall<T>[], serviceId: string, value: T): Promise<void> {
		const result = deferred<void>();
		calls.push({ serviceId, value, result });
		return result.promise;
	}
}

async function setup(
	areas: { rooms: BridgeArea[]; zones: BridgeArea[] } = { rooms: [living], zones: [downstairs] }
) {
	const gateway = new AreasGateway();
	const app = createHueApp({ gateway, roomsAndZones: true, settleMs: 0 });
	const initialization = app.initialize();
	gateway.listCalls[0]?.resolve([bridgeLight()]);
	gateway.areaLists[0]?.resolve(areas);
	await initialization;
	return { app, gateway };
}

function assertPublicArea(area: Area): void {
	// @ts-expect-error Public rooms and zones do not expose mutation methods
	area.setPower(true);
}

void assertPublicArea;

describe('rooms and zones', () => {
	it('leaves rooms and zones empty unless the option is enabled', async () => {
		const gateway = new AreasGateway();
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		gateway.listCalls[0]?.resolve([bridgeLight()]);
		await initialization;

		expect(gateway.areaLists).toHaveLength(0);
		expect(app.state.rooms.value).toEqual([]);
		expect(app.state.zones.value).toEqual([]);
		await expect(app.toggleRoom('living')).rejects.toBeInstanceOf(AreasUnsupportedError);
	});

	it('rejects initialization when the gateway cannot list areas', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway, roomsAndZones: true });

		await expect(app.initialize()).rejects.toBeInstanceOf(AreasUnsupportedError);

		expect(gateway.listCalls).toHaveLength(0);
		expect(app.state.status.value).toBe('error');
	});

	it('loads rooms and zones alongside lights', async () => {
		const { app, gateway } = await setup();

		expect(gateway.listCalls).toHaveLength(1);
		expect(gateway.areaLists).toHaveLength(1);
		expect(app.state.rooms.get('living')).toMatchObject({ id: 'living' });
		expect(app.state.rooms.get('living')?.name.value).toBe('Living room');
		expect(app.state.rooms.get('living')?.isOn.value).toBe(false);
		expect(app.state.rooms.get('living')?.brightness.value).toBe(40);
		expect(app.state.zones.get('downstairs')?.brightness.value).toBeNull();
		expect(app.state.zones.get('downstairs')?.color.value).toBeNull();
		expect(app.state.lights.get('desk')?.isOn.value).toBe(false);
	});

	it('toggles a room through its grouped light and reverts when the bridge rejects it', async () => {
		const { app, gateway } = await setup();
		const command = app.toggleRoom('living');

		expect(app.state.rooms.get('living')?.isOn.value).toBe(true);
		expect(gateway.areaPower[0]).toMatchObject({ serviceId: 'living-light', value: true });
		expect(app.state.lights.get('desk')?.isOn.value).toBe(false);

		const error = new Error('unreachable');
		const rejection = expect(command).rejects.toBe(error);
		gateway.areaPower[0]?.result.reject(error);
		await rejection;

		expect(app.state.rooms.get('living')?.isOn.value).toBe(false);
	});

	it('collapses brightness changes for a room into the latest value', async () => {
		const { app, gateway } = await setup();
		const first = app.dimRoom('living', 20);
		const second = app.dimRoom('living', 80);

		expect(app.state.rooms.get('living')?.brightness.value).toBe(80);
		expect(gateway.areaBrightness).toHaveLength(1);
		expect(gateway.areaBrightness[0]?.value).toBe(20);

		gateway.areaBrightness[0]?.result.resolve();
		await first;

		expect(gateway.areaBrightness[1]).toMatchObject({ serviceId: 'living-light', value: 80 });
		gateway.areaBrightness[1]?.result.resolve();
		await second;
	});

	it('rejects invalid room commands', async () => {
		const { app } = await setup();

		await expect(app.dimRoom('living', 120)).rejects.toBeInstanceOf(InvalidBrightnessError);
		await expect(app.dimZone('downstairs', 10)).rejects.toThrow(
			'Zone "downstairs" does not support brightness'
		);
		await expect(app.changeRoomColor('living', { x: 2, y: 0 })).rejects.toBeInstanceOf(
			InvalidColorError
		);
		await expect(app.changeZoneColor('downstairs', { x: 0.2, y: 0.2 })).rejects.toThrow(
			'Zone "downstairs" does not support color'
		);
		await expect(app.toggleRoom('missing')).rejects.toBeInstanceOf(RoomNotFoundError);
		await expect(app.toggleZone('missing')).rejects.toBeInstanceOf(ZoneNotFoundError);
	});

	it('changes a zone color through its grouped light', async () => {
		const zone: BridgeArea = { ...downstairs, color: { x: 0.2, y: 0.2 }, brightness: 10 };
		const { app, gateway } = await setup({ rooms: [], zones: [zone] });

		const command = app.changeZoneColor('downstairs', { x: 0.5, y: 0.4 });

		expect(app.state.zones.get('downstairs')?.color.value).toEqual({ x: 0.5, y: 0.4 });
		expect(gateway.areaColor[0]).toMatchObject({
			serviceId: 'downstairs-light',
			value: { x: 0.5, y: 0.4 }
		});
		gateway.areaColor[0]?.result.resolve();
		await command;
	});

	it('applies grouped-light, rename and removal events', async () => {
		const { app, gateway } = await setup();

		gateway.observer.onAreaChanges?.([
			{ kind: 'service-updated', serviceId: 'living-light', isOn: true, brightness: 15 }
		]);
		gateway.observer.onAreaChanges?.([
			{ kind: 'updated', resource: 'room', id: 'living', name: 'Lounge' }
		]);

		expect(app.state.rooms.get('living')?.isOn.value).toBe(true);
		expect(app.state.rooms.get('living')?.brightness.value).toBe(15);
		expect(app.state.rooms.get('living')?.name.value).toBe('Lounge');

		gateway.observer.onAreaChanges?.([{ kind: 'removed', resource: 'zone', id: 'downstairs' }]);

		expect(app.state.zones.value).toEqual([]);
	});

	it('reloads rooms and zones when the event stream connects', async () => {
		const { app, gateway } = await setup();

		gateway.observer.onConnected();
		gateway.listCalls[1]?.resolve([bridgeLight()]);
		gateway.areaLists[1]?.resolve({
			rooms: [{ ...living, name: 'Lounge', isOn: true }],
			zones: []
		});
		await flushMicrotasks();

		expect(app.state.rooms.get('living')?.name.value).toBe('Lounge');
		expect(app.state.rooms.get('living')?.isOn.value).toBe(true);
		expect(app.state.zones.value).toEqual([]);
	});

	it('rejects area commands after dispose', async () => {
		const { app } = await setup();

		app.dispose();

		await expect(app.toggleZone('downstairs')).rejects.toBeInstanceOf(HueAppDisposedError);
	});

	it('exposes rooms and zones through the svelte adapter', async () => {
		const { app, gateway } = await setup();
		const hue = createSvelteHueApp(app);

		expect(hue.rooms.all.map((room) => room.name)).toEqual(['Living room']);
		expect(hue.zones.get('downstairs')).toMatchObject({
			id: 'downstairs',
			name: 'Downstairs',
			isOn: true,
			brightness: null,
			color: null
		});

		const command = hue.toggleRoom('living');

		expect(hue.rooms.get('living')?.isOn).toBe(true);
		gateway.areaPower[0]?.result.resolve();
		await command;
	});

	it('keeps a grouped-light event that arrives while rooms are reloading', async () => {
		const { app, gateway } = await setup();

		gateway.observer.onConnected();
		gateway.observer.onAreaChanges?.([
			{ kind: 'service-updated', serviceId: 'living-light', isOn: true }
		]);
		gateway.listCalls[1]?.resolve([bridgeLight()]);
		gateway.areaLists[1]?.resolve({
			rooms: [{ ...living, isOn: false }],
			zones: [downstairs]
		});
		await flushMicrotasks();

		expect(app.state.rooms.get('living')?.isOn.value).toBe(true);
	});
});
