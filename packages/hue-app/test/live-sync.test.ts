import { effect } from '@preact/signals-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createHueApp,
	HueAppDisposedError,
	HueAppError,
	LightNotColorCapableError,
	LightNotDimmableError,
	LightNotFoundError
} from '../src/index.js';
import type {
	BridgeLight,
	HueAppConnection,
	HueGateway,
	LightChange,
	LightChangeObserver,
	XyColor
} from '../src/index.js';
import { bridgeLight, FakeGateway, flushMicrotasks } from './fakes.js';

const SETTLE_MS = 1000;

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

async function setup(
	options: { lights?: BridgeLight[]; settleMs?: number; gateway?: FakeGateway } = {}
) {
	const gateway = options.gateway ?? new FakeGateway();
	const app = createHueApp({ gateway, settleMs: options.settleMs ?? SETTLE_MS });
	const initialization = app.initialize();
	gateway.listCalls[0]!.resolve(options.lights ?? [bridgeLight()]);
	await initialization;
	const observer = gateway.observer;
	observer.onConnectionChange('live');

	const light = (id = 'desk') => {
		const found = app.state.lights.get(id);
		if (!found) {
			throw new Error(`No light ${id}`);
		}
		return found;
	};
	const update = (
		fields: Omit<Extract<LightChange, { kind: 'updated' }>, 'kind' | 'id'>,
		id = 'desk'
	) => observer.onChanges([{ kind: 'updated', id, ...fields }]);
	const startResync = () => {
		observer.onConnected();
		const call = gateway.listCalls.at(-1);
		if (!call) {
			throw new Error('No resync');
		}
		return call;
	};
	const resync = async (lights: BridgeLight[]) => {
		startResync().resolve(lights);
		await flushMicrotasks();
	};

	return { app, gateway, observer, light, update, startResync, resync };
}

describe('reconciliation with command lanes', () => {
	it('applies remote values immediately while the lane is quiet', async () => {
		const { light, update } = await setup();

		update({ brightness: 70 });
		expect(light().brightness.value).toBe(70);
		expect(light().isOn.value).toBe(false);

		update({ isOn: true });
		expect(light().isOn.value).toBe(true);
		expect(light().brightness.value).toBe(70);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('does not flicker when the bridge echoes intermediate slider values', async () => {
		const { app, gateway, light, update } = await setup();
		const seen: Array<number | null> = [];
		const unsubscribe = light().brightness.subscribe((value) => seen.push(value));

		const first = app.dimLight('desk', 40);
		const superseded = app.dimLight('desk', 60);
		const latest = app.dimLight('desk', 80);

		update({ brightness: 40 });
		expect(light().brightness.value).toBe(80);

		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		update({ brightness: 40 });
		expect(light().brightness.value).toBe(80);

		gateway.brightnessCalls[1]!.result.resolve();
		await Promise.all([superseded, latest]);
		update({ brightness: 80 });
		expect(light().brightness.value).toBe(80);

		await vi.advanceTimersByTimeAsync(SETTLE_MS);

		expect(light().brightness.value).toBe(80);
		expect(seen).toEqual([30, 40, 60, 80]);
		expect(vi.getTimerCount()).toBe(0);
		unsubscribe();
	});

	it('ignores a late echo of an older value when the echo of the latest value follows within the window', async () => {
		const { app, gateway, light, update } = await setup();
		const seen: Array<number | null> = [];
		const unsubscribe = light().brightness.subscribe((value) => seen.push(value));

		const first = app.dimLight('desk', 40);
		const latest = app.dimLight('desk', 80);
		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		gateway.brightnessCalls[1]!.result.resolve();
		await latest;

		update({ brightness: 40 });
		await vi.advanceTimersByTimeAsync(SETTLE_MS / 2);
		update({ brightness: 80 });
		await vi.advanceTimersByTimeAsync(SETTLE_MS);

		expect(seen).toEqual([30, 40, 80]);
		unsubscribe();
	});

	it('applies an external change received during the settle window once the window ends', async () => {
		const { app, gateway, light, update } = await setup();

		const dim = app.dimLight('desk', 50);
		gateway.brightnessCalls[0]!.result.resolve();
		await dim;

		update({ brightness: 20 });
		expect(light().brightness.value).toBe(50);

		await vi.advanceTimersByTimeAsync(SETTLE_MS - 1);
		expect(light().brightness.value).toBe(50);

		await vi.advanceTimersByTimeAsync(1);
		expect(light().brightness.value).toBe(20);
		expect(vi.getTimerCount()).toBe(0);

		update({ brightness: 25 });
		expect(light().brightness.value).toBe(25);
	});

	it('restarts the settle window after every response', async () => {
		const { app, gateway, light, update } = await setup();

		const first = app.dimLight('desk', 50);
		gateway.brightnessCalls[0]!.result.resolve();
		await first;

		await vi.advanceTimersByTimeAsync(SETTLE_MS - 200);
		const second = app.dimLight('desk', 60);
		update({ brightness: 20 });
		await vi.advanceTimersByTimeAsync(400);
		expect(light().brightness.value).toBe(60);

		gateway.brightnessCalls[1]!.result.resolve();
		await second;
		await vi.advanceTimersByTimeAsync(SETTLE_MS - 1);
		expect(light().brightness.value).toBe(60);

		update({ brightness: 60 });
		await vi.advanceTimersByTimeAsync(1);
		expect(light().brightness.value).toBe(60);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('does not notify when a remote value equals the current value', async () => {
		const { app, gateway, light, update } = await setup();
		const dim = app.dimLight('desk', 50);
		gateway.brightnessCalls[0]!.result.resolve();
		await dim;

		const seen: Array<number | null> = [];
		const unsubscribe = light().brightness.subscribe((value) => seen.push(value));

		update({ brightness: 50 });
		await vi.advanceTimersByTimeAsync(SETTLE_MS);
		update({ brightness: 50 });

		expect(seen).toEqual([50]);
		unsubscribe();
	});

	it('reverts a failed command to the buffered remote value', async () => {
		const { app, gateway, light, update } = await setup();
		const error = new Error('80 failed');

		const dim = app.dimLight('desk', 80);
		const rejection = expect(dim).rejects.toBe(error);
		update({ brightness: 55 });
		expect(light().brightness.value).toBe(80);

		gateway.brightnessCalls[0]!.result.reject(error);
		await rejection;
		expect(light().brightness.value).toBe(55);

		await vi.advanceTimersByTimeAsync(SETTLE_MS);
		expect(light().brightness.value).toBe(55);

		const retry = app.dimLight('desk', 90);
		const retryRejection = expect(retry).rejects.toBe(error);
		gateway.brightnessCalls[1]!.result.reject(error);
		await retryRejection;
		expect(light().brightness.value).toBe(55);
	});

	it('reverts a failed command to the last confirmed value when no remote value arrived', async () => {
		const { app, gateway, light } = await setup();
		const error = new Error('80 failed');

		const dim = app.dimLight('desk', 80);
		const rejection = expect(dim).rejects.toBe(error);
		gateway.brightnessCalls[0]!.result.reject(error);
		await rejection;

		expect(light().brightness.value).toBe(30);
		await vi.advanceTimersByTimeAsync(SETTLE_MS);
		expect(light().brightness.value).toBe(30);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('keeps newer pending input after a failure and reverts to the remote value when it fails too', async () => {
		const { app, gateway, light, update } = await setup();
		const firstError = new Error('40 failed');
		const latestError = new Error('80 failed');

		const first = app.dimLight('desk', 40);
		const latest = app.dimLight('desk', 80);
		const firstRejection = expect(first).rejects.toBe(firstError);
		const latestRejection = expect(latest).rejects.toBe(latestError);
		update({ brightness: 55 });

		gateway.brightnessCalls[0]!.result.reject(firstError);
		await firstRejection;
		expect(light().brightness.value).toBe(80);

		gateway.brightnessCalls[1]!.result.reject(latestError);
		await latestRejection;
		expect(light().brightness.value).toBe(55);
	});

	it('applies the latest remote value after a successful command when no echo follows', async () => {
		const { app, gateway, light, update } = await setup();

		const dim = app.dimLight('desk', 80);
		update({ brightness: 55 });
		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		expect(light().brightness.value).toBe(80);

		await vi.advanceTimersByTimeAsync(SETTLE_MS);
		expect(light().brightness.value).toBe(55);
	});

	it('discards a remote value received before a newer command that succeeded (settleMs 0)', async () => {
		const { app, gateway, light, update } = await setup({ settleMs: 0 });

		const first = app.dimLight('desk', 80);
		update({ brightness: 40 });
		const latest = app.dimLight('desk', 60);
		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		gateway.brightnessCalls[1]!.result.resolve();
		await latest;

		expect(light().brightness.value).toBe(60);
	});

	it('discards a remote value received in the settle window before a newer command that succeeded', async () => {
		const { app, gateway, light, update } = await setup();

		const first = app.dimLight('desk', 80);
		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		update({ brightness: 40 });
		const latest = app.dimLight('desk', 60);
		gateway.brightnessCalls[1]!.result.resolve();
		await latest;
		await vi.advanceTimersByTimeAsync(SETTLE_MS);

		expect(light().brightness.value).toBe(60);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('still reverts to a remote value received before a newer command that failed', async () => {
		const { app, gateway, light, update } = await setup();
		const error = new Error('60 failed');

		const first = app.dimLight('desk', 80);
		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		update({ brightness: 40 });
		const latest = app.dimLight('desk', 60);
		const rejection = expect(latest).rejects.toBe(error);
		gateway.brightnessCalls[1]!.result.reject(error);
		await rejection;

		expect(light().brightness.value).toBe(40);
	});

	it('keeps remote brightness and power independent', async () => {
		const { app, gateway, light, update } = await setup();

		const toggle = app.toggleLight('desk');
		update({ brightness: 70 });
		expect(light().brightness.value).toBe(70);
		expect(light().isOn.value).toBe(true);

		update({ isOn: false });
		expect(light().isOn.value).toBe(true);
		expect(light().brightness.value).toBe(70);

		const dim = app.dimLight('desk', 20);
		update({ isOn: true });
		expect(light().isOn.value).toBe(true);
		expect(light().brightness.value).toBe(20);

		gateway.powerCalls[0]!.result.resolve();
		gateway.brightnessCalls[0]!.result.resolve();
		await Promise.all([toggle, dim]);
		await vi.advanceTimersByTimeAsync(SETTLE_MS);

		expect(light().isOn.value).toBe(true);
		expect(light().brightness.value).toBe(20);
	});

	it('applies name updates immediately, bypassing busy lanes', async () => {
		const { app, gateway, light, update } = await setup();
		const toggle = app.toggleLight('desk');
		const dim = app.dimLight('desk', 90);

		update({ name: 'Office' });

		expect(light().name.value).toBe('Office');
		expect(light().isOn.value).toBe(true);
		expect(light().brightness.value).toBe(90);

		gateway.powerCalls[0]!.result.resolve();
		gateway.brightnessCalls[0]!.result.resolve();
		await Promise.all([toggle, dim]);
	});

	it('applies buffered remote values as soon as the lane is idle when settleMs is 0', async () => {
		const { app, gateway, light, update } = await setup({ settleMs: 0 });

		const dim = app.dimLight('desk', 50);
		update({ brightness: 20 });
		expect(light().brightness.value).toBe(50);

		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		expect(light().brightness.value).toBe(20);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('uses a 1500 ms settle window by default', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;
		const light = app.state.lights.get('desk')!;

		const dim = app.dimLight('desk', 50);
		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		gateway.observer.onChanges([{ kind: 'updated', id: 'desk', brightness: 20 }]);

		await vi.advanceTimersByTimeAsync(1499);
		expect(light.brightness.value).toBe(50);
		await vi.advanceTimersByTimeAsync(1);
		expect(light.brightness.value).toBe(20);
	});
});

describe('remote color', () => {
	const red: XyColor = { x: 0.64, y: 0.33 };
	const blue: XyColor = { x: 0.15, y: 0.06 };

	it('applies a remote color immediately while the lane is quiet without touching other fields', async () => {
		const { light, update } = await setup();

		update({ color: red });

		expect(light().color.value).toEqual(red);
		expect(Object.isFrozen(light().color.value)).toBe(true);
		expect(light().brightness.value).toBe(30);
		expect(light().isOn.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('does not notify when a remote color equals the current color', async () => {
		const { app, gateway, light, update } = await setup();
		const seen: Array<XyColor | null> = [];
		const unsubscribe = light().color.subscribe((value) => seen.push(value));

		update({ color: { x: 0.3, y: 0.3 } });

		const change = app.changeColor('desk', red);
		gateway.colorCalls[0]!.result.resolve();
		await change;
		update({ color: { ...red } });
		await vi.advanceTimersByTimeAsync(SETTLE_MS);
		update({ color: { ...red } });

		expect(seen).toEqual([{ x: 0.3, y: 0.3 }, red]);
		unsubscribe();
	});

	it('buffers a remote color during the settle window and applies it once the window ends', async () => {
		const { app, gateway, light, update } = await setup();

		const change = app.changeColor('desk', red);
		gateway.colorCalls[0]!.result.resolve();
		await change;

		update({ color: blue });
		expect(light().color.value).toEqual(red);

		await vi.advanceTimersByTimeAsync(SETTLE_MS - 1);
		expect(light().color.value).toEqual(red);

		await vi.advanceTimersByTimeAsync(1);
		expect(light().color.value).toEqual(blue);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('does not flicker when the bridge echoes intermediate colors', async () => {
		const { app, gateway, light, update } = await setup();
		const seen: Array<XyColor | null> = [];
		const unsubscribe = light().color.subscribe((value) => seen.push(value));

		const first = app.changeColor('desk', red);
		const latest = app.changeColor('desk', blue);
		update({ color: red });
		gateway.colorCalls[0]!.result.resolve();
		await first;
		gateway.colorCalls[1]!.result.resolve();
		await latest;
		update({ color: blue });
		await vi.advanceTimersByTimeAsync(SETTLE_MS);

		expect(seen).toEqual([{ x: 0.3, y: 0.3 }, red, blue]);
		unsubscribe();
	});

	it('reverts a failed color command to the buffered remote color', async () => {
		const { app, gateway, light, update } = await setup();
		const error = new Error('color failed');

		const change = app.changeColor('desk', red);
		const rejection = expect(change).rejects.toBe(error);
		update({ color: blue });
		expect(light().color.value).toEqual(red);

		gateway.colorCalls[0]!.result.reject(error);
		await rejection;

		expect(light().color.value).toEqual(blue);
	});

	it('keeps remote color independent from busy power and brightness lanes', async () => {
		const { app, gateway, light, update } = await setup();

		const toggle = app.toggleLight('desk');
		const dim = app.dimLight('desk', 80);
		update({ color: red, isOn: false, brightness: 10 });

		expect(light().color.value).toEqual(red);
		expect(light().isOn.value).toBe(true);
		expect(light().brightness.value).toBe(80);

		gateway.powerCalls[0]!.result.resolve();
		gateway.brightnessCalls[0]!.result.resolve();
		await Promise.all([toggle, dim]);
	});

	it('merges color from a resync, keeps event colors received meanwhile, and respects in-flight commands', async () => {
		const { app, gateway, light, startResync, resync, update } = await setup({
			lights: [bridgeLight(), bridgeLight({ id: 'floor', name: 'Floor' })]
		});

		await resync([
			bridgeLight({ color: red }),
			bridgeLight({ id: 'floor', name: 'Floor', color: null })
		]);
		expect(light().color.value).toEqual(red);
		expect(light('floor').color.value).toBeNull();
		await expect(app.changeColor('floor', blue)).rejects.toBeInstanceOf(LightNotColorCapableError);

		const snapshot = startResync();
		update({ color: blue });
		snapshot.resolve([bridgeLight({ color: red }), bridgeLight({ id: 'floor', color: red })]);
		await flushMicrotasks();
		expect(light().color.value).toEqual(blue);
		expect(light('floor').color.value).toEqual(red);

		const change = app.changeColor('desk', { x: 0.3, y: 0.6 });
		await resync([bridgeLight({ color: blue }), bridgeLight({ id: 'floor', color: red })]);
		expect(light().color.value).toEqual({ x: 0.3, y: 0.6 });

		gateway.colorCalls[0]!.result.resolve();
		await change;
	});

	it('builds added lights with their color', async () => {
		const { observer, light } = await setup();

		observer.onChanges([
			{ kind: 'added', light: bridgeLight({ id: 'strip', name: 'Strip', color: blue }) },
			{ kind: 'added', light: bridgeLight({ id: 'plug', name: 'Plug', color: null }) }
		]);

		expect(light('strip').color.value).toEqual(blue);
		expect(Object.isFrozen(light('strip').color.value)).toBe(true);
		expect(light('plug').color.value).toBeNull();
	});
});

describe('live changes', () => {
	it('applies one batch atomically', async () => {
		const { app, observer } = await setup({
			lights: [bridgeLight(), bridgeLight({ id: 'floor', name: 'Floor', brightness: 10 })]
		});
		const runs: unknown[] = [];
		const stop = effect(() => {
			runs.push([
				app.state.lights.value.map((light) => light.id),
				app.state.lights.get('desk')?.brightness.value,
				app.state.lights.get('floor')?.isOn.value
			]);
		});

		observer.onChanges([
			{ kind: 'updated', id: 'desk', brightness: 60 },
			{ kind: 'updated', id: 'floor', isOn: true },
			{ kind: 'added', light: bridgeLight({ id: 'lamp', name: 'Lamp' }) }
		]);

		expect(runs).toEqual([
			[['desk', 'floor'], 30, false],
			[['desk', 'floor', 'lamp'], 60, true]
		]);
		stop();
	});

	it('ignores updates for unknown lights', async () => {
		const { app, update } = await setup();
		const before = app.state.lights.value;

		update({ brightness: 10, name: 'Ghost' }, 'ghost');

		expect(app.state.lights.value).toBe(before);
		expect(app.state.lights.get('ghost')).toBeUndefined();
	});

	it('adds new lights and merges added events for existing lights preserving identity', async () => {
		const { app, observer, light } = await setup();
		const desk = light();

		observer.onChanges([
			{ kind: 'added', light: bridgeLight({ id: 'lamp', name: 'Lamp', brightness: null }) },
			{ kind: 'added', light: bridgeLight({ name: 'Desk 2', isOn: true, brightness: 45 }) }
		]);

		expect(app.state.lights.value.map((item) => item.id)).toEqual(['desk', 'lamp']);
		expect(light()).toBe(desk);
		expect(desk.name.value).toBe('Desk 2');
		expect(desk.isOn.value).toBe(true);
		expect(desk.brightness.value).toBe(45);
		expect(light('lamp').brightness.value).toBeNull();
	});

	it('removes lights, disposes their lanes, and creates a new instance when re-added', async () => {
		const { app, gateway, observer, light } = await setup();
		const desk = light();
		const dim = app.dimLight('desk', 50);
		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		expect(vi.getTimerCount()).toBe(1);

		observer.onChanges([{ kind: 'removed', id: 'desk' }]);

		expect(app.state.lights.get('desk')).toBeUndefined();
		expect(vi.getTimerCount()).toBe(0);
		await expect(app.toggleLight('desk')).rejects.toBeInstanceOf(LightNotFoundError);

		observer.onChanges([{ kind: 'added', light: bridgeLight() }]);
		expect(light()).not.toBe(desk);
		expect(light().brightness.value).toBe(30);
	});

	it('lets an in-flight command on a removed light settle without touching the new instance', async () => {
		const { app, gateway, observer, light } = await setup();
		const error = new Error('gone');
		const dim = app.dimLight('desk', 70);
		const rejection = expect(dim).rejects.toBe(error);

		observer.onChanges([
			{ kind: 'removed', id: 'desk' },
			{ kind: 'added', light: bridgeLight({ brightness: 10 }) }
		]);
		gateway.brightnessCalls[0]!.result.reject(error);
		await rejection;

		expect(light().brightness.value).toBe(10);
		expect(vi.getTimerCount()).toBe(0);
	});
});

describe('resync', () => {
	it('merges a snapshot on every connect: preserves identity, adds and removes lights', async () => {
		const { app, light, resync } = await setup({
			lights: [bridgeLight(), bridgeLight({ id: 'floor', name: 'Floor' })]
		});
		const desk = light();
		const floor = light('floor');

		await resync([
			bridgeLight({ name: 'Office', isOn: true, brightness: 75 }),
			bridgeLight({ id: 'lamp', name: 'Lamp', brightness: null })
		]);

		expect(app.state.lights.value.map((item) => item.id)).toEqual(['desk', 'lamp']);
		expect(light()).toBe(desk);
		expect(desk.name.value).toBe('Office');
		expect(desk.isOn.value).toBe(true);
		expect(desk.brightness.value).toBe(75);
		expect(light('lamp').brightness.value).toBeNull();
		expect(floor.isOn.value).toBe(false);

		await resync([bridgeLight({ name: 'Office', isOn: true, brightness: 75 })]);
		expect(app.state.lights.value.map((item) => item.id)).toEqual(['desk']);
	});

	it('does not notify collection subscribers when membership is unchanged', async () => {
		const { app, resync } = await setup();
		const snapshots: unknown[] = [];
		const unsubscribe = app.state.lights.subscribe((lights) => snapshots.push(lights));

		await resync([bridgeLight({ brightness: 90 })]);

		expect(snapshots).toHaveLength(1);
		expect(app.state.lights.get('desk')?.brightness.value).toBe(90);
		unsubscribe();
	});

	it('routes snapshot values through lanes so in-flight commands are respected', async () => {
		const { app, gateway, light, resync, update } = await setup();

		const dim = app.dimLight('desk', 80);
		await resync([bridgeLight({ brightness: 30, name: 'Office' })]);
		expect(light().brightness.value).toBe(80);
		expect(light().name.value).toBe('Office');

		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		update({ brightness: 80 });
		await vi.advanceTimersByTimeAsync(SETTLE_MS);
		expect(light().brightness.value).toBe(80);
	});

	it('does not clobber fields changed by events while the snapshot is in flight', async () => {
		const { light, startResync, update } = await setup();

		const snapshot = startResync();
		update({ brightness: 90 });
		snapshot.resolve([bridgeLight({ brightness: 30, isOn: true, name: 'Office' })]);
		await flushMicrotasks();

		expect(light().brightness.value).toBe(90);
		expect(light().isOn.value).toBe(true);
		expect(light().name.value).toBe('Office');
	});

	it('does not resurrect a light removed by an event during the resync', async () => {
		const { app, observer, startResync } = await setup();

		const snapshot = startResync();
		observer.onChanges([{ kind: 'removed', id: 'desk' }]);
		snapshot.resolve([bridgeLight()]);
		await flushMicrotasks();

		expect(app.state.lights.get('desk')).toBeUndefined();
	});

	it('does not remove a light added by an event during the resync', async () => {
		const { app, observer, light, startResync } = await setup();

		const snapshot = startResync();
		observer.onChanges([{ kind: 'added', light: bridgeLight({ id: 'lamp', name: 'Lamp' }) }]);
		const lamp = light('lamp');
		snapshot.resolve([bridgeLight()]);
		await flushMicrotasks();

		expect(light('lamp')).toBe(lamp);
		expect(app.state.lights.value.map((item) => item.id)).toEqual(['desk', 'lamp']);
	});

	it('keeps a light removed and re-added during the resync with the event values', async () => {
		const { observer, light, startResync } = await setup();

		const snapshot = startResync();
		observer.onChanges([
			{ kind: 'removed', id: 'desk' },
			{ kind: 'added', light: bridgeLight({ name: 'New desk', brightness: 5 }) }
		]);
		const desk = light();
		snapshot.resolve([bridgeLight({ name: 'Old desk', brightness: 30 })]);
		await flushMicrotasks();

		expect(light()).toBe(desk);
		expect(desk.name.value).toBe('New desk');
		expect(desk.brightness.value).toBe(5);
	});

	it('overlays events for lights only known to the snapshot', async () => {
		const { light, startResync, update } = await setup();

		const snapshot = startResync();
		update({ isOn: true }, 'lamp');
		snapshot.resolve([bridgeLight(), bridgeLight({ id: 'lamp', name: 'Lamp', isOn: false })]);
		await flushMicrotasks();

		expect(light('lamp').isOn.value).toBe(true);
	});

	it('applies only the latest of overlapping resyncs when it resolves first', async () => {
		const { light, startResync } = await setup();

		const older = startResync();
		const newer = startResync();
		newer.resolve([bridgeLight({ name: 'Newer' })]);
		await flushMicrotasks();
		older.resolve([bridgeLight({ name: 'Older' }), bridgeLight({ id: 'lamp' })]);
		await flushMicrotasks();

		expect(light().name.value).toBe('Newer');
	});

	it('applies only the latest of overlapping resyncs when it resolves last', async () => {
		const { app, light, startResync } = await setup();

		const older = startResync();
		const newer = startResync();
		older.resolve([bridgeLight({ name: 'Older' }), bridgeLight({ id: 'lamp' })]);
		await flushMicrotasks();
		expect(light().name.value).toBe('Desk');
		expect(app.state.lights.get('lamp')).toBeUndefined();

		newer.resolve([bridgeLight({ name: 'Newer' })]);
		await flushMicrotasks();
		expect(light().name.value).toBe('Newer');
	});

	it('ignores an older resync even when the latest one fails', async () => {
		const { app, light, startResync } = await setup();

		const older = startResync();
		const newer = startResync();
		newer.reject(new Error('offline'));
		await flushMicrotasks();
		older.resolve([bridgeLight({ name: 'Older' })]);
		await flushMicrotasks();

		expect(light().name.value).toBe('Desk');
		expect(app.state.status.value).toBe('ready');
	});

	it('keeps current lights and status when a resync fails, and recovers on the next connect', async () => {
		const { app, light, startResync, resync, update } = await setup();
		const desk = light();

		startResync().reject(new Error('bridge busy'));
		await flushMicrotasks();

		expect(app.state.status.value).toBe('ready');
		expect(app.state.error.value).toBeUndefined();
		expect(light()).toBe(desk);

		update({ brightness: 12 });
		expect(desk.brightness.value).toBe(12);

		await resync([bridgeLight({ name: 'Recovered' })]);
		expect(desk.name.value).toBe('Recovered');
	});

	it('writes null brightness for lights that become non-dimmable and restores dimming later', async () => {
		const { app, light, resync } = await setup();

		await resync([bridgeLight({ brightness: null })]);
		expect(light().brightness.value).toBeNull();
		await expect(app.dimLight('desk', 50)).rejects.toBeInstanceOf(LightNotDimmableError);

		await resync([bridgeLight({ brightness: 40 })]);
		expect(light().brightness.value).toBe(40);
	});

	it('reverts to a buffered null brightness when an in-flight dim fails', async () => {
		const { app, gateway, light, resync } = await setup();
		const error = new Error('not dimmable');

		const dim = app.dimLight('desk', 70);
		const rejection = expect(dim).rejects.toBe(error);
		await resync([bridgeLight({ brightness: null })]);
		expect(light().brightness.value).toBe(70);

		gateway.brightnessCalls[0]!.result.reject(error);
		await rejection;
		expect(light().brightness.value).toBeNull();
	});
});

describe('live sync lifecycle', () => {
	it('starts watching only after the initial load succeeds, once across concurrent calls', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });

		const first = app.initialize();
		const second = app.initialize();
		expect(gateway.observers).toHaveLength(0);

		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await Promise.all([first, second]);
		await app.initialize();

		expect(gateway.observers).toHaveLength(1);
		expect(gateway.listCalls).toHaveLength(1);
	});

	it('starts watching once after a failed load is retried', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const error = new Error('offline');

		const failed = app.initialize();
		const rejection = expect(failed).rejects.toBe(error);
		gateway.listCalls[0]!.reject(error);
		await rejection;
		expect(gateway.observers).toHaveLength(0);

		const retry = app.initialize();
		gateway.listCalls[1]!.resolve([bridgeLight()]);
		await retry;
		expect(gateway.observers).toHaveLength(1);
	});

	it('never watches with live: false', async () => {
		const gateway = new FakeGateway();
		const watch = vi.spyOn(gateway, 'watch');
		const app = createHueApp({ gateway, live: false });
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		expect(watch).not.toHaveBeenCalled();
		expect(app.state.connection.value).toBe('offline');
		app.dispose();
	});

	it('works with gateways that do not implement watch', async () => {
		const fake = new FakeGateway();
		const gateway: HueGateway = {
			listLights: () => fake.listLights(),
			setPower: (id, isOn) => fake.setPower(id, isOn),
			setBrightness: (id, brightness) => fake.setBrightness(id, brightness),
			setColor: (id, color) => fake.setColor(id, color)
		};
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		fake.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		expect(app.state.status.value).toBe('ready');
		expect(app.state.connection.value).toBe('offline');
		const toggle = app.toggleLight('desk');
		fake.powerCalls[0]!.result.resolve();
		await toggle;
		app.dispose();
		expect(vi.getTimerCount()).toBe(0);
	});

	it('shows connecting while watching even if the gateway never reports a state', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const states: HueAppConnection[] = [];
		const unsubscribe = app.state.connection.subscribe((state) => states.push(state));
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		expect(states).toEqual(['offline', 'connecting']);
		gateway.observer.onConnectionChange('live');
		expect(app.state.connection.value).toBe('live');
		unsubscribe();
	});

	it('goes back to offline when watch throws synchronously', async () => {
		const gateway = new FakeGateway();
		gateway.watch = () => {
			throw new Error('no event stream');
		};
		const app = createHueApp({ gateway });
		const states: HueAppConnection[] = [];
		const unsubscribe = app.state.connection.subscribe((state) => states.push(state));
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		expect(states).toEqual(['offline', 'connecting', 'offline']);
		unsubscribe();
	});

	it('keeps the app usable when watch throws synchronously', async () => {
		const gateway = new FakeGateway();
		gateway.watch = (observer: LightChangeObserver) => {
			observer.onConnectionChange('connecting');
			throw new Error('no event stream');
		};
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);

		await expect(initialization).resolves.toBeUndefined();
		expect(app.state.status.value).toBe('ready');
		expect(app.state.connection.value).toBe('offline');
		expect(() => app.dispose()).not.toThrow();
	});

	it('mirrors connection changes and goes offline on dispose', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const states: HueAppConnection[] = [];
		const unsubscribe = app.state.connection.subscribe((state) => states.push(state));
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		gateway.observer.onConnectionChange('connecting');
		gateway.observer.onConnectionChange('live');
		gateway.observer.onConnectionChange('reconnecting');
		gateway.observer.onConnectionChange('live');
		app.dispose();

		expect(states).toEqual(['offline', 'connecting', 'live', 'reconnecting', 'live', 'offline']);
		unsubscribe();
	});

	it('unwatches when disposed from a callback invoked synchronously inside watch', async () => {
		const gateway = new FakeGateway();
		let app!: ReturnType<typeof createHueApp>;
		const watch = gateway.watch.bind(gateway);
		gateway.watch = (observer: LightChangeObserver) => {
			const unwatch = watch(observer);
			observer.onConnectionChange('connecting');
			app.dispose();
			return unwatch;
		};
		app = createHueApp({ gateway });
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		expect(gateway.unwatchCalls).toBe(1);
		expect(app.state.connection.value).toBe('offline');
	});
});

describe('dispose', () => {
	it('unwatches once, clears every settle timer and is idempotent', async () => {
		const { app, gateway } = await setup({
			lights: [bridgeLight(), bridgeLight({ id: 'floor', name: 'Floor' })]
		});
		const dims = [app.dimLight('desk', 50), app.dimLight('floor', 60), app.toggleLight('desk')];
		gateway.brightnessCalls.forEach((call) => call.result.resolve());
		gateway.powerCalls.forEach((call) => call.result.resolve());
		await Promise.all(dims);
		expect(vi.getTimerCount()).toBe(3);

		app.dispose();
		app.dispose();

		expect(gateway.unwatchCalls).toBe(1);
		expect(vi.getTimerCount()).toBe(0);
		expect(app.state.connection.value).toBe('offline');
	});

	it('does not apply buffered remote values after dispose', async () => {
		const { app, gateway, light, update } = await setup();
		const dim = app.dimLight('desk', 50);
		update({ brightness: 20 });
		gateway.brightnessCalls[0]!.result.resolve();
		await dim;

		app.dispose();
		await vi.advanceTimersByTimeAsync(SETTLE_MS * 2);

		expect(light().brightness.value).toBe(50);
	});

	it('ignores late resync results and late gateway callbacks', async () => {
		const { app, gateway, observer, light, startResync } = await setup();
		const snapshot = startResync();
		const listCalls = gateway.listCalls.length;

		app.dispose();
		snapshot.resolve([bridgeLight({ name: 'Late' }), bridgeLight({ id: 'lamp' })]);
		await flushMicrotasks();
		observer.onChanges([
			{ kind: 'updated', id: 'desk', brightness: 99, name: 'Later' },
			{ kind: 'added', light: bridgeLight({ id: 'plug' }) },
			{ kind: 'removed', id: 'desk' }
		]);
		observer.onConnectionChange('live');
		observer.onConnected();
		await flushMicrotasks();

		expect(light().name.value).toBe('Desk');
		expect(light().brightness.value).toBe(30);
		expect(app.state.lights.value.map((item) => item.id)).toEqual(['desk']);
		expect(app.state.connection.value).toBe('offline');
		expect(gateway.listCalls).toHaveLength(listCalls);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('rejects initialize and commands after dispose with HueAppDisposedError', async () => {
		const { app, gateway } = await setup();
		app.dispose();

		const error = await app.initialize().catch((reason: unknown) => reason);
		expect(error).toBeInstanceOf(HueAppDisposedError);
		expect(error).toBeInstanceOf(HueAppError);
		await expect(app.toggleLight('desk')).rejects.toBeInstanceOf(HueAppDisposedError);
		await expect(app.dimLight('desk', 50)).rejects.toBeInstanceOf(HueAppDisposedError);
		await expect(app.toggleLight('missing')).rejects.toBeInstanceOf(HueAppDisposedError);
		expect(gateway.powerCalls).toHaveLength(0);
		expect(gateway.brightnessCalls).toHaveLength(0);
		expect(gateway.listCalls).toHaveLength(1);
	});

	it('lets in-flight and pending commands settle normally after dispose', async () => {
		const { app, gateway, light } = await setup();
		const error = new Error('failed');
		const first = app.dimLight('desk', 40);
		const latest = app.dimLight('desk', 80);
		const toggle = app.toggleLight('desk');
		const toggleRejection = expect(toggle).rejects.toBe(error);

		app.dispose();
		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		gateway.brightnessCalls[1]!.result.resolve();
		await latest;
		gateway.powerCalls[0]!.result.reject(error);
		await toggleRejection;

		expect(light().brightness.value).toBe(80);
		expect(light().isOn.value).toBe(false);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('ignores the initial load result and never watches when disposed during the load', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		const rejection = expect(initialization).rejects.toBeInstanceOf(HueAppDisposedError);

		app.dispose();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await rejection;

		expect(app.state.lights.value).toEqual([]);
		expect(gateway.observers).toHaveLength(0);
		expect(app.state.connection.value).toBe('offline');
	});

	it('does not record a load failure that settles after dispose', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		const rejection = expect(initialization).rejects.toBeInstanceOf(HueAppDisposedError);

		app.dispose();
		gateway.listCalls[0]!.reject(new Error('offline'));
		await rejection;

		expect(app.state.error.value).toBeUndefined();
		expect(app.state.status.value).not.toBe('error');
	});

	it('can be disposed before initialize without watching', () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		app.dispose();
		expect(gateway.unwatchCalls).toBe(0);
		expect(gateway.listCalls).toHaveLength(0);
	});
});
