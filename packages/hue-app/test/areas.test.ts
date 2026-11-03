import { describe, expect, it } from 'vite-plus/test';
import { createSvelteHueApp } from '../src/svelte/index';
import {
	AreasUnsupportedError,
	HueAppDisposedError,
	AreaNotTemperatureCapableError,
	InvalidBrightnessError,
	InvalidColorError,
	InvalidMirekError,
	InvalidPresetError,
	RoomNotFoundError,
	ZoneNotFoundError,
	areaPresets,
	createHueApp,
	mirekToHex,
	type Area,
	type BridgeArea,
	type PresetId
} from '../src/index';
import { FakeGateway, bridgeLight, deferred, flushMicrotasks, type Deferred } from './fakes';

const living: BridgeArea = {
	id: 'living',
	name: 'Living room',
	serviceId: 'living-light',
	isOn: false,
	brightness: 40,
	color: { x: 0.4, y: 0.4 },
	temperature: null,
	children: []
};

const downstairs: BridgeArea = {
	id: 'downstairs',
	name: 'Downstairs',
	serviceId: 'downstairs-light',
	isOn: true,
	brightness: null,
	color: null,
	temperature: null,
	children: []
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
	readonly areaTemperature: AreaCall<number>[] = [];

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

	setAreaTemperature(serviceId: string, mirek: number): Promise<void> {
		return this.areaCommand(this.areaTemperature, serviceId, mirek);
	}

	private areaCommand<T>(calls: AreaCall<T>[], serviceId: string, value: T): Promise<void> {
		const result = deferred<void>();
		calls.push({ serviceId, value, result });
		return result.promise;
	}
}

async function setup(
	areas: { rooms: BridgeArea[]; zones: BridgeArea[] } = { rooms: [living], zones: [downstairs] },
	lights = [bridgeLight()]
) {
	const gateway = new AreasGateway();
	const app = createHueApp({ gateway, settleMs: 0 });
	const initialization = app.initialize();
	gateway.listCalls[0]?.resolve(lights);
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
	it('leaves rooms and zones empty when the gateway has no area support', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		gateway.listCalls[0]?.resolve([bridgeLight()]);
		await initialization;

		expect(app.state.status.value).toBe('ready');
		expect(app.state.rooms.value).toEqual([]);
		expect(app.state.zones.value).toEqual([]);
		await expect(app.toggleRoom('living')).rejects.toBeInstanceOf(AreasUnsupportedError);
		await expect(app.applyRoomPreset('living', 'bright')).rejects.toBeInstanceOf(
			AreasUnsupportedError
		);
	});

	it('builds a room palette from its child light colors', async () => {
		const { app, gateway } = await setup(
			{
				rooms: [{ ...living, children: ['desk', 'lamp', 'plug'] }],
				zones: [{ ...downstairs, children: ['lamp'] }]
			},
			[
				bridgeLight({ color: { x: 0.64, y: 0.33 } }),
				bridgeLight({ id: 'lamp', name: 'Lamp', color: null }),
				bridgeLight({ id: 'plug', name: 'Plug', color: { x: 0.15, y: 0.06 } })
			]
		);

		expect(app.state.rooms.get('living')?.colors.value).toEqual(['#ff0000', '#0000ff']);
		expect(app.state.zones.get('downstairs')?.colors.value).toEqual([]);

		gateway.observer.onChanges([{ kind: 'updated', id: 'lamp', color: { x: 0.3, y: 0.6 } }]);

		expect(app.state.rooms.get('living')?.colors.value).toEqual(['#ff0000', '#00ff00', '#0000ff']);
		expect(app.state.zones.get('downstairs')?.colors.value).toEqual(['#00ff00']);

		gateway.observer.onAreaChanges?.([
			{ kind: 'updated', resource: 'room', id: 'living', children: ['plug'] }
		]);

		expect(app.state.rooms.get('living')?.colors.value).toEqual(['#0000ff']);
	});

	it('builds a temperature-only palette from mirek and ignores xy when a light has both', async () => {
		const warm = bridgeLight({
			id: 'warm',
			name: 'Warm',
			color: null,
			temperature: { mirek: 447 }
		});
		const colorAndTemperature = bridgeLight({
			id: 'both',
			name: 'Both',
			color: { x: 0.64, y: 0.33 },
			temperature: { mirek: 447 }
		});
		const { app, gateway } = await setup(
			{
				rooms: [
					{ ...living, color: null, temperature: { mirek: 370 }, children: ['warm', 'both'] }
				],
				zones: [{ ...downstairs, temperature: { mirek: 156 }, children: [] }]
			},
			[warm, colorAndTemperature]
		);

		expect(app.state.rooms.get('living')?.colors.value).toEqual([mirekToHex(447), '#ff0000']);
		expect(app.state.zones.get('downstairs')?.colors.value).toEqual([mirekToHex(156)]);

		gateway.observer.onChanges([{ kind: 'updated', id: 'warm', temperature: { mirek: 156 } }]);
		gateway.observer.onAreaChanges?.([
			{
				kind: 'service-updated',
				serviceId: 'downstairs-light',
				temperature: { mirek: 367 }
			}
		]);

		expect(app.state.rooms.get('living')?.colors.value).toEqual([mirekToHex(156), '#ff0000']);
		expect(app.state.zones.get('downstairs')?.colors.value).toEqual([mirekToHex(367)]);
		expect(app.state.lights.get('both')?.colors.value).toEqual(['#ff0000']);
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

	it('lists rooms and zones by name', async () => {
		const { app } = await setup({
			rooms: [
				{ ...living, id: 'bedroom', name: 'Bedroom' },
				{ ...living, id: 'attic', name: 'Attic' }
			],
			zones: [
				{ ...downstairs, id: 'upstairs', name: 'Upstairs' },
				{ ...downstairs, id: 'garden', name: 'Garden' }
			]
		});

		expect(app.state.rooms.value.map((room) => room.name.value)).toEqual(['Attic', 'Bedroom']);
		expect(app.state.zones.value.map((zone) => zone.name.value)).toEqual(['Garden', 'Upstairs']);
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
		await expect(app.changeRoomTemperature('living', 447)).rejects.toBeInstanceOf(
			AreaNotTemperatureCapableError
		);
		await expect(app.changeZoneTemperature('downstairs', 12.5)).rejects.toBeInstanceOf(
			InvalidMirekError
		);
		await expect(app.toggleRoom('missing')).rejects.toBeInstanceOf(RoomNotFoundError);
		await expect(app.toggleZone('missing')).rejects.toBeInstanceOf(ZoneNotFoundError);
		await expect(app.applyRoomPreset('missing', 'bright')).rejects.toBeInstanceOf(
			RoomNotFoundError
		);
		await expect(app.applyZonePreset('missing', 'relax')).rejects.toBeInstanceOf(ZoneNotFoundError);
		await expect(app.applyRoomPreset('living', 'nightlight' as PresetId)).rejects.toBeInstanceOf(
			InvalidPresetError
		);
	});

	it('applies a room preset as color and brightness and reverts both when the bridge rejects them', async () => {
		const relax = areaPresets.find((preset) => preset.id === 'relax');
		const { app, gateway } = await setup();
		const command = app.applyRoomPreset('living', 'relax');

		expect(app.state.rooms.get('living')?.color.value).toEqual(relax?.color);
		expect(app.state.rooms.get('living')?.brightness.value).toBe(relax?.brightness);
		expect(gateway.areaColor[0]).toMatchObject({
			serviceId: 'living-light',
			value: relax?.color
		});
		expect(gateway.areaBrightness[0]).toMatchObject({
			serviceId: 'living-light',
			value: relax?.brightness
		});

		const error = new Error('unreachable');
		const rejection = expect(command).rejects.toBe(error);
		gateway.areaColor[0]?.result.reject(error);
		gateway.areaBrightness[0]?.result.reject(error);
		await rejection;

		expect(app.state.rooms.get('living')?.color.value).toEqual({ x: 0.4, y: 0.4 });
		expect(app.state.rooms.get('living')?.brightness.value).toBe(40);
	});

	it('applies a preset when the grouped light reports brightness but no color', async () => {
		const bright = areaPresets.find((preset) => preset.id === 'bright');
		const room: BridgeArea = { ...living, color: null, brightness: 100, isOn: true };
		const { app, gateway } = await setup({ rooms: [room], zones: [] });
		const command = app.applyRoomPreset('living', 'bright');

		expect(app.state.rooms.get('living')?.color.value).toEqual(bright?.color);
		expect(app.state.rooms.get('living')?.brightness.value).toBe(bright?.brightness);
		expect(gateway.areaColor[0]).toMatchObject({
			serviceId: 'living-light',
			value: bright?.color
		});
		expect(gateway.areaBrightness[0]).toMatchObject({
			serviceId: 'living-light',
			value: bright?.brightness
		});
		gateway.areaColor[0]?.result.resolve();
		gateway.areaBrightness[0]?.result.resolve();
		await command;
	});

	it('applies a temperature preset as mirek when the grouped light has no color', async () => {
		const relax = areaPresets.find((preset) => preset.id === 'relax');
		const room: BridgeArea = {
			...living,
			color: null,
			temperature: { mirek: 250 },
			brightness: 40,
			isOn: true
		};
		const { app, gateway } = await setup({ rooms: [room], zones: [] });
		const command = app.applyRoomPreset('living', 'relax');

		expect(app.state.rooms.get('living')?.color.value).toBeNull();
		expect(app.state.rooms.get('living')?.temperature.value).toEqual({ mirek: relax?.mirek });
		expect(app.state.rooms.get('living')?.brightness.value).toBe(relax?.brightness);
		expect(gateway.areaColor).toHaveLength(0);
		expect(gateway.areaTemperature[0]).toMatchObject({
			serviceId: 'living-light',
			value: relax?.mirek
		});
		expect(gateway.areaBrightness[0]).toMatchObject({
			serviceId: 'living-light',
			value: relax?.brightness
		});

		const error = new Error('Color feature not supported by grouped light resource');
		const rejection = expect(command).rejects.toBe(error);
		gateway.areaTemperature[0]?.result.reject(error);
		gateway.areaBrightness[0]?.result.reject(error);
		await rejection;

		expect(app.state.rooms.get('living')?.temperature.value).toEqual({ mirek: 250 });
		expect(app.state.rooms.get('living')?.brightness.value).toBe(40);
	});

	it('paints temperature-only child lights when a room preset is applied and restores them if it fails', async () => {
		const relax = areaPresets.find((preset) => preset.id === 'relax')!;
		const warm = bridgeLight({
			id: 'warm',
			name: 'Warm',
			color: null,
			temperature: { mirek: 250 }
		});
		const colored = bridgeLight({
			id: 'both',
			name: 'Both',
			color: { x: 0.64, y: 0.33 },
			temperature: { mirek: 250 }
		});
		const room: BridgeArea = {
			...living,
			color: null,
			temperature: { mirek: 250 },
			brightness: 40,
			isOn: true,
			children: ['warm', 'both']
		};
		const { app, gateway } = await setup({ rooms: [room], zones: [] }, [warm, colored]);
		const command = app.applyRoomPreset('living', 'relax');

		expect(app.state.lights.get('warm')?.colors.value).toEqual([mirekToHex(relax.mirek)]);
		expect(app.state.lights.get('both')?.colors.value).toEqual(['#ff0000']);
		expect(app.state.rooms.get('living')?.colors.value).toEqual([
			mirekToHex(relax.mirek),
			'#ff0000'
		]);
		expect(gateway.temperatureCalls).toHaveLength(0);

		const error = new Error('rejected');
		const rejection = expect(command).rejects.toBe(error);
		gateway.areaTemperature[0]?.result.reject(error);
		gateway.areaBrightness[0]?.result.reject(error);
		await rejection;

		expect(app.state.lights.get('warm')?.temperature.value).toEqual({ mirek: 250 });
		expect(app.state.rooms.get('living')?.colors.value).toEqual([mirekToHex(250), '#ff0000']);
	});

	it('sets a preset color on a zone that cannot be dimmed', async () => {
		const bright = areaPresets.find((preset) => preset.id === 'bright');
		const { app, gateway } = await setup();
		const command = app.applyZonePreset('downstairs', 'bright');

		expect(app.state.zones.get('downstairs')?.color.value).toEqual(bright?.color);
		expect(app.state.zones.get('downstairs')?.brightness.value).toBeNull();
		expect(gateway.areaBrightness).toHaveLength(0);
		expect(gateway.areaColor[0]).toMatchObject({
			serviceId: 'downstairs-light',
			value: bright?.color
		});
		gateway.areaColor[0]?.result.resolve();
		await command;
	});

	it('applies a zone preset through the svelte adapter', async () => {
		const energize = areaPresets.find((preset) => preset.id === 'energize');
		const zone: BridgeArea = { ...downstairs, color: { x: 0.2, y: 0.2 }, brightness: 10 };
		const { app, gateway } = await setup({ rooms: [], zones: [zone] });
		const hue = createSvelteHueApp(app);
		const command = hue.applyZonePreset('downstairs', 'energize');

		expect(hue.zones.get('downstairs')?.color).toEqual(energize?.color);
		expect(hue.zones.get('downstairs')?.brightness).toBe(energize?.brightness);
		gateway.areaColor[0]?.result.resolve();
		gateway.areaBrightness[0]?.result.resolve();
		await command;
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
			color: null,
			colors: []
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
