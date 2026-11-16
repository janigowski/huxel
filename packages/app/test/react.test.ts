// @vitest-environment happy-dom
import { Signal } from '@preact/signals-core';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';
import { createHueApp, xyToHex, type BridgeArea } from '../src/index';
import { useHueApp, type ReactHueApp, type ReactLight } from '../src/react/index';
import { at, desk, FakeGateway, lamp } from './fake-gateway';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

class AreasGateway extends FakeGateway {
	readonly areaPower: [string, boolean][] = [];

	constructor(private readonly areas: { rooms: BridgeArea[]; zones: BridgeArea[] }) {
		super();
	}

	async listAreas() {
		return this.areas;
	}

	setAreaPower(serviceId: string, isOn: boolean) {
		this.areaPower.push([serviceId, isOn]);
		return Promise.resolve();
	}

	async setAreaBrightness() {}

	async setAreaColor() {}

	async setAreaTemperature() {}
}

const bedroom: BridgeArea = {
	id: 'bed',
	name: 'Bedroom',
	serviceId: 'bed-light',
	isOn: true,
	brightness: 10,
	color: null,
	temperature: null,
	children: []
};

const living: BridgeArea = {
	id: 'living',
	name: 'Living room',
	serviceId: 'living-light',
	isOn: false,
	brightness: 40,
	color: { x: 0.4, y: 0.4 },
	temperature: null,
	children: ['desk']
};

async function setup() {
	const gateway = new FakeGateway();
	const app = createHueApp({ gateway });
	const ready = app.initialize();
	at(gateway.listCalls, 0).resolve([{ ...desk }, { ...lamp }]);
	await ready;
	const renders: ReactHueApp[] = [];
	const hook = renderHook(() => {
		const hue = useHueApp(app);
		renders.push(hue);
		return hue;
	});
	return { gateway, app, hook, renders };
}

function light(hue: ReactHueApp, id: string): ReactLight {
	const found = hue.lights.find((candidate) => candidate.id === id);
	if (!found) {
		throw new Error(`No light ${id}`);
	}
	return found;
}

function countSubscriptions() {
	const counter = { active: 0, total: 0 };
	const original = Signal.prototype.subscribe;
	vi.spyOn(Signal.prototype, 'subscribe').mockImplementation(function (this: Signal<unknown>, fn) {
		counter.active += 1;
		counter.total += 1;
		const dispose = original.call(this, fn);
		return () => {
			counter.active -= 1;
			dispose();
		};
	});
	return counter;
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe('useHueApp', () => {
	test('exposes initial state as plain values after initialize', async () => {
		const { hook } = await setup();
		const hue = hook.result.current;

		expect(hue.status).toBe('ready');
		expect(hue.error).toBeUndefined();
		expect(hue.rooms).toEqual([]);
		expect(hue.zones).toEqual([]);
		expect(Object.isFrozen(hue.rooms)).toBe(true);
		expect(Object.isFrozen(hue.zones)).toBe(true);
		expect(hue.lights).toEqual([
			{
				id: 'desk',
				name: 'Desk',
				isOn: false,
				brightness: 40,
				color: { x: 0.3, y: 0.3 },
				temperature: null,
				gamut: null,
				mirekRange: null,
				colors: [xyToHex({ x: 0.3, y: 0.3 })]
			},
			{
				id: 'lamp',
				name: 'Lamp',
				isOn: true,
				brightness: null,
				color: null,
				temperature: null,
				gamut: null,
				mirekRange: null,
				colors: []
			}
		]);
		expect(Object.isFrozen(hue.lights)).toBe(true);
		expect(Object.isFrozen(light(hue, 'desk'))).toBe(true);
	});

	test('tracks status and error through loading and failure', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const hook = renderHook(() => useHueApp(app));

		expect(hook.result.current.status).toBe('idle');
		expect(hook.result.current.lights).toEqual([]);

		const failure = new Error('bridge offline');
		let pending!: Promise<void>;
		act(() => {
			pending = hook.result.current.initialize();
		});
		expect(hook.result.current.status).toBe('loading');
		expect(hook.result.current.error).toBeUndefined();

		await act(async () => {
			at(gateway.listCalls, 0).reject(failure);
			await expect(pending).rejects.toBe(failure);
		});
		expect(hook.result.current.status).toBe('error');
		expect(hook.result.current.error).toBe(failure);

		let retry!: Promise<void>;
		act(() => {
			retry = hook.result.current.initialize();
		});
		expect(hook.result.current.status).toBe('loading');
		expect(hook.result.current.error).toBeUndefined();

		await act(async () => {
			at(gateway.listCalls, 1).resolve([{ ...desk }]);
			await retry;
		});
		expect(hook.result.current.status).toBe('ready');
		expect(hook.result.current.lights.map((item) => item.id)).toEqual(['desk']);
	});

	test('shows optimistic toggle and dim immediately, before the gateway settles', async () => {
		const { gateway, hook } = await setup();

		let toggled!: Promise<void>;
		let dimmed!: Promise<void>;
		act(() => {
			toggled = hook.result.current.toggleLight('desk');
			dimmed = hook.result.current.dimLight('desk', 75);
		});

		expect(gateway.commands).toHaveLength(2);
		expect(light(hook.result.current, 'desk')).toMatchObject({ isOn: true, brightness: 75 });

		await act(async () => {
			gateway.commands.forEach((command) => command.resolve());
			await Promise.all([toggled, dimmed]);
		});
		expect(light(hook.result.current, 'desk')).toMatchObject({ isOn: true, brightness: 75 });
	});

	test('propagates rollback when the gateway rejects', async () => {
		const { gateway, hook } = await setup();

		let toggled!: Promise<void>;
		let dimmed!: Promise<void>;
		act(() => {
			toggled = hook.result.current.toggleLight('desk');
			dimmed = hook.result.current.dimLight('desk', 90);
		});
		expect(light(hook.result.current, 'desk')).toMatchObject({ isOn: true, brightness: 90 });

		await act(async () => {
			gateway.commands.forEach((command) => command.reject(new Error('rejected')));
			await expect(toggled).rejects.toThrow('rejected');
			await expect(dimmed).rejects.toThrow('rejected');
		});
		expect(light(hook.result.current, 'desk')).toMatchObject({ isOn: false, brightness: 40 });
	});

	test('shows an optimistic color change and its rollback', async () => {
		const { gateway, hook } = await setup();

		let changed!: Promise<void>;
		act(() => {
			changed = hook.result.current.changeColor('desk', { x: 0.64, y: 0.33 });
		});

		expect(light(hook.result.current, 'desk').color).toEqual({ x: 0.64, y: 0.33 });
		expect(Object.isFrozen(light(hook.result.current, 'desk').color)).toBe(true);

		await act(async () => {
			at(gateway.commands, 0).reject(new Error('rejected'));
			await expect(changed).rejects.toThrow('rejected');
		});

		expect(light(hook.result.current, 'desk').color).toEqual({ x: 0.3, y: 0.3 });
		expect(light(hook.result.current, 'lamp').color).toBeNull();
	});

	test('keeps snapshots and actions stable while nothing changed', async () => {
		const { gateway, hook, renders } = await setup();
		const before = hook.result.current;

		hook.rerender();
		expect(hook.result.current).toBe(before);
		expect(hook.result.current.lights).toBe(before.lights);

		let toggled!: Promise<void>;
		act(() => {
			toggled = before.toggleLight('desk');
		});
		const after = hook.result.current;

		expect(after.lights).not.toBe(before.lights);
		expect(light(after, 'desk')).not.toBe(light(before, 'desk'));
		expect(light(after, 'lamp')).toBe(light(before, 'lamp'));
		expect(after.rooms).toBe(before.rooms);
		expect(after.zones).toBe(before.zones);
		expect(after.initialize).toBe(before.initialize);
		expect(after.toggleLight).toBe(before.toggleLight);
		expect(after.dimLight).toBe(before.dimLight);
		expect(after.changeColor).toBe(before.changeColor);
		expect(after.changeTemperature).toBe(before.changeTemperature);
		expect(after.toggleRoom).toBe(before.toggleRoom);
		expect(after.dimRoom).toBe(before.dimRoom);
		expect(after.changeRoomColor).toBe(before.changeRoomColor);
		expect(after.changeRoomTemperature).toBe(before.changeRoomTemperature);
		expect(after.applyRoomPreset).toBe(before.applyRoomPreset);
		expect(after.toggleZone).toBe(before.toggleZone);
		expect(after.dimZone).toBe(before.dimZone);
		expect(after.changeZoneColor).toBe(before.changeZoneColor);
		expect(after.changeZoneTemperature).toBe(before.changeZoneTemperature);
		expect(after.applyZonePreset).toBe(before.applyZonePreset);

		await act(async () => {
			at(gateway.commands, 0).resolve();
			await toggled;
		});
		expect(hook.result.current).toBe(after);
		expect(renders).toHaveLength(3);
	});

	test('shares derived snapshots between components using the same app', async () => {
		const { app, hook } = await setup();
		const other = renderHook(() => useHueApp(app));

		expect(other.result.current).toBe(hook.result.current);
		expect(other.result.current.lights).toBe(hook.result.current.lights);
	});

	test('does not re-render for the initial Preact notification', async () => {
		const { renders } = await setup();
		await act(async () => {});

		expect(renders).toHaveLength(1);
	});

	test('subscribes on mount and unsubscribes on unmount', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const ready = app.initialize();
		at(gateway.listCalls, 0).resolve([{ ...desk }]);
		await ready;

		const subscriptions = countSubscriptions();
		const first = renderHook(() => useHueApp(app));
		const second = renderHook(() => useHueApp(app));
		expect(subscriptions.active).toBe(2);

		first.unmount();
		expect(subscriptions.active).toBe(1);

		second.unmount();
		expect(subscriptions.active).toBe(0);
		expect(subscriptions.total).toBe(2);

		const toggled = app.toggleLight('desk');
		expect(light(first.result.current, 'desk').isOn).toBe(false);
		at(gateway.commands, 0).resolve();
		await toggled;
	});

	test('lists rooms and zones by name and toggles a room optimistically', async () => {
		const gateway = new AreasGateway({
			rooms: [living, bedroom],
			zones: [
				{
					id: 'down',
					name: 'Downstairs',
					serviceId: 'down-light',
					isOn: true,
					brightness: null,
					color: null,
					temperature: null,
					children: []
				}
			]
		});
		const app = createHueApp({ gateway, settleMs: 0 });
		const ready = app.initialize();
		at(gateway.listCalls, 0).resolve([{ ...desk }]);
		await ready;

		const hook = renderHook(() => useHueApp(app));
		const before = hook.result.current;
		const listedBedroom = before.rooms.find((room) => room.id === 'bed');

		expect(before.rooms.map((room) => room.name)).toEqual(['Bedroom', 'Living room']);
		expect(before.zones.map((zone) => zone.name)).toEqual(['Downstairs']);
		expect(before.rooms.find((room) => room.id === 'living')).toMatchObject({
			isOn: false,
			brightness: 40,
			color: { x: 0.4, y: 0.4 },
			colors: desk.color ? [xyToHex(desk.color)] : []
		});
		expect(Object.isFrozen(listedBedroom)).toBe(true);
		expect(Object.isFrozen(listedBedroom?.colors)).toBe(true);

		let toggled!: Promise<void>;
		act(() => {
			toggled = before.toggleRoom('living');
		});

		const after = hook.result.current;

		expect(after.rooms.find((room) => room.id === 'living')?.isOn).toBe(true);
		expect(after.rooms.find((room) => room.id === 'bed')).toBe(listedBedroom);
		expect(after.zones).toBe(before.zones);
		expect(after.toggleRoom).toBe(before.toggleRoom);
		expect(gateway.areaPower).toEqual([['living-light', true]]);

		await act(async () => {
			await toggled;
		});
		expect(hook.result.current.rooms.find((room) => room.id === 'living')?.isOn).toBe(true);
	});
});
