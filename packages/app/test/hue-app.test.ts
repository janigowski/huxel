import { describe, expect, it } from 'vite-plus/test';
import {
	createHueApp,
	HueAppDisposedError,
	InvalidBrightnessError,
	InvalidColorError,
	InvalidMirekError,
	LightNotColorCapableError,
	LightNotTemperatureCapableError,
	LightNotDimmableError,
	LightNotFoundError,
	areaPresets,
	mirekToHex
} from '../src/index';
import type { BridgeLight, Light, XyColor } from '../src/index';
import { bridgeLight, FakeGateway } from './fakes';

async function setup(lights: BridgeLight[] = [bridgeLight()]) {
	const gateway = new FakeGateway();
	const app = createHueApp({ gateway });
	const initialization = app.initialize();
	gateway.listCalls[0]!.resolve(lights);
	await initialization;
	return { app, gateway };
}

function assertPublicLightType(light: Light): void {
	// @ts-expect-error Public lights do not expose mutation methods
	light.setPower(true);
}

void assertPublicLightType;

describe('HueApp initialization', () => {
	it('loads lights and transitions from idle through loading to ready', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const statuses: string[] = [];
		const unsubscribe = app.state.status.subscribe((status) => statuses.push(status));

		expect(app.state.status.value).toBe('idle');
		expect(app.state.lights.value).toEqual([]);

		const initialization = app.initialize();

		expect(app.state.status.value).toBe('loading');
		expect(gateway.listCalls).toHaveLength(1);

		gateway.listCalls[0]!.resolve([
			bridgeLight(),
			bridgeLight({ id: 'plug', name: 'Plug', isOn: true, brightness: null })
		]);
		await initialization;

		expect(app.state.status.value).toBe('ready');
		expect(statuses).toEqual(['idle', 'loading', 'ready']);
		expect(app.state.lights.value).toHaveLength(2);
		expect(app.state.lights.peek()).toEqual(app.state.lights.value);
		expect(app.state.lights.get('desk')).toMatchObject({ id: 'desk' });
		expect(app.state.lights.get('desk')?.name.value).toBe('Desk');
		expect(app.state.lights.get('desk')?.isOn.value).toBe(false);
		expect(app.state.lights.get('desk')?.brightness.value).toBe(30);
		expect(app.state.lights.get('plug')?.brightness.value).toBeNull();
		unsubscribe();
	});

	it('shares one in-flight load across concurrent initialization calls', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });

		const first = app.initialize();
		const second = app.initialize();

		expect(second).toBe(first);
		expect(gateway.listCalls).toHaveLength(1);

		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await Promise.all([first, second]);
		expect(app.state.status.value).toBe('ready');
	});

	it('returns immediately after success without loading again and preserves light instances', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk');

		await app.initialize();

		expect(gateway.listCalls).toHaveLength(1);
		expect(app.state.lights.get('desk')).toBe(light);
		expect(app.state.status.value).toBe('ready');
	});

	it('notifies light collection subscribers when lights load', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const snapshots: string[][] = [];
		const unsubscribe = app.state.lights.subscribe((lights) =>
			snapshots.push(lights.map((light) => light.id))
		);

		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		expect(snapshots).toEqual([[], ['desk']]);
		unsubscribe();
	});

	it('sets error status, rethrows, and retries on the next initialization call', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const error = new Error('bridge unavailable');
		const initialization = app.initialize();
		const rejection = expect(initialization).rejects.toBe(error);

		gateway.listCalls[0]!.reject(error);
		await rejection;

		expect(app.state.status.value).toBe('error');
		expect(app.state.error.value).toBe(error);

		const retry = app.initialize();
		expect(app.state.status.value).toBe('loading');
		expect(app.state.error.value).toBeUndefined();
		expect(gateway.listCalls).toHaveLength(2);
		gateway.listCalls[1]!.resolve([]);
		await retry;
		expect(app.state.status.value).toBe('ready');
	});
});

describe('toggleLight', () => {
	it('updates synchronously, notifies subscribers, sends the command, and retains success', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const powers: boolean[] = [];
		const unsubscribe = light.isOn.subscribe((isOn) => powers.push(isOn));

		const toggle = app.toggleLight('desk');

		expect(light.isOn.value).toBe(true);
		expect(powers).toEqual([false, true]);
		expect(gateway.powerCalls).toHaveLength(1);
		expect(gateway.powerCalls[0]).toMatchObject({ lightId: 'desk', isOn: true });

		gateway.powerCalls[0]!.result.resolve();
		await toggle;
		expect(light.isOn.value).toBe(true);
		unsubscribe();
	});

	it('reverts and rejects with the same gateway error', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const error = new Error('power failed');
		const toggle = app.toggleLight('desk');
		const rejection = expect(toggle).rejects.toBe(error);

		expect(light.isOn.value).toBe(true);
		gateway.powerCalls[0]!.result.reject(error);
		await rejection;
		expect(light.isOn.value).toBe(false);
	});

	it('rejects unknown ids without calling the gateway', async () => {
		const { app, gateway } = await setup();

		await expect(app.toggleLight('missing')).rejects.toBeInstanceOf(LightNotFoundError);
		await expect(app.dimLight('missing', 50)).rejects.toBeInstanceOf(LightNotFoundError);
		expect(gateway.powerCalls).toHaveLength(0);
		expect(gateway.brightnessCalls).toHaveLength(0);
	});
});

describe('dimLight', () => {
	it('updates synchronously, notifies subscribers, and leaves power unchanged', async () => {
		const { app, gateway } = await setup([bridgeLight({ isOn: false, brightness: 30 })]);
		const light = app.state.lights.get('desk')!;
		const brightnesses: Array<number | null> = [];
		const unsubscribe = light.brightness.subscribe((value) => brightnesses.push(value));

		const dim = app.dimLight('desk', 65);

		expect(light.brightness.value).toBe(65);
		expect(light.isOn.value).toBe(false);
		expect(brightnesses).toEqual([30, 65]);
		expect(gateway.brightnessCalls[0]).toMatchObject({ lightId: 'desk', brightness: 65 });

		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		expect(light.brightness.value).toBe(65);
		expect(light.isOn.value).toBe(false);
		unsubscribe();
	});

	it.each([Number.NaN, -1, 101, Number.POSITIVE_INFINITY])(
		'rejects invalid brightness %s without changing state or calling the gateway',
		async (brightness) => {
			const { app, gateway } = await setup();
			const light = app.state.lights.get('desk')!;

			await expect(app.dimLight('desk', brightness)).rejects.toBeInstanceOf(InvalidBrightnessError);
			expect(light.brightness.value).toBe(30);
			expect(gateway.brightnessCalls).toHaveLength(0);
		}
	);

	it('rejects non-dimmable lights without a gateway call', async () => {
		const { app, gateway } = await setup([bridgeLight({ brightness: null })]);

		await expect(app.dimLight('desk', 50)).rejects.toBeInstanceOf(LightNotDimmableError);
		expect(app.state.lights.get('desk')?.brightness.value).toBeNull();
		expect(gateway.brightnessCalls).toHaveLength(0);
	});

	it('reverts and rejects with the same gateway error', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const error = new Error('brightness failed');
		const dim = app.dimLight('desk', 80);
		const rejection = expect(dim).rejects.toBe(error);

		expect(light.brightness.value).toBe(80);
		gateway.brightnessCalls[0]!.result.reject(error);
		await rejection;
		expect(light.brightness.value).toBe(30);
	});
});

describe('changeColor', () => {
	const red: XyColor = { x: 0.64, y: 0.33 };

	it('updates synchronously, notifies subscribers, and leaves power and brightness unchanged', async () => {
		const { app, gateway } = await setup([bridgeLight({ isOn: false, brightness: 30 })]);
		const light = app.state.lights.get('desk')!;
		const colors: Array<XyColor | null> = [];
		const unsubscribe = light.color.subscribe((value) => colors.push(value));

		const change = app.changeColor('desk', red);

		expect(light.color.value).toEqual(red);
		expect(Object.isFrozen(light.color.value)).toBe(true);
		expect(light.isOn.value).toBe(false);
		expect(light.brightness.value).toBe(30);
		expect(colors).toEqual([{ x: 0.3, y: 0.3 }, red]);
		expect(gateway.calls.slice(1)).toEqual([{ method: 'setColor', lightId: 'desk', value: red }]);

		gateway.colorCalls[0]!.result.resolve();
		await change;

		expect(light.color.value).toEqual(red);
		expect(light.isOn.value).toBe(false);
		expect(light.brightness.value).toBe(30);
		unsubscribe();
	});

	it('reverts and rejects with the same gateway error', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const error = new Error('color failed');
		const change = app.changeColor('desk', red);
		const rejection = expect(change).rejects.toBe(error);

		expect(light.color.value).toEqual(red);
		gateway.colorCalls[0]!.result.reject(error);
		await rejection;

		expect(light.color.value).toEqual({ x: 0.3, y: 0.3 });
	});

	it.each([
		{ x: Number.NaN, y: 0.3 },
		{ x: 0.3, y: Number.POSITIVE_INFINITY },
		{ x: -0.01, y: 0.3 },
		{ x: 0.3, y: 1.01 },
		{ x: '0.3', y: 0.3 } as unknown as XyColor,
		null as unknown as XyColor
	])('rejects invalid color %o without changing state or calling the gateway', async (color) => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;

		await expect(app.changeColor('desk', color)).rejects.toBeInstanceOf(InvalidColorError);
		expect(light.color.value).toEqual({ x: 0.3, y: 0.3 });
		expect(gateway.colorCalls).toHaveLength(0);
	});

	it('accepts the bounds of the xy range', async () => {
		const { app, gateway } = await setup();

		const change = app.changeColor('desk', { x: 0, y: 1 });
		gateway.colorCalls[0]!.result.resolve();

		await expect(change).resolves.toBeUndefined();
		expect(app.state.lights.get('desk')?.color.value).toEqual({ x: 0, y: 1 });
	});

	it('rejects lights without color capability without a gateway call', async () => {
		const { app, gateway } = await setup([bridgeLight({ color: null })]);

		await expect(app.changeColor('desk', red)).rejects.toBeInstanceOf(LightNotColorCapableError);
		expect(app.state.lights.get('desk')?.color.value).toBeNull();
		expect(gateway.colorCalls).toHaveLength(0);
	});

	it('rejects unknown ids and a disposed app without calling the gateway', async () => {
		const { app, gateway } = await setup();

		await expect(app.changeColor('missing', red)).rejects.toBeInstanceOf(LightNotFoundError);

		app.dispose();

		await expect(app.changeColor('desk', red)).rejects.toBeInstanceOf(HueAppDisposedError);
		expect(gateway.colorCalls).toHaveLength(0);
	});

	it('does not keep a reference to the caller color object', async () => {
		const { app, gateway } = await setup();
		const color = { x: 0.5, y: 0.4 };

		const change = app.changeColor('desk', color);
		color.x = 0.1;
		gateway.colorCalls[0]!.result.resolve();
		await change;

		expect(app.state.lights.get('desk')?.color.value).toEqual({ x: 0.5, y: 0.4 });
	});

	it('coalesces picker input and sends the first and latest colors only', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const blue = { x: 0.15, y: 0.06 };

		const first = app.changeColor('desk', red);
		const superseded = app.changeColor('desk', { x: 0.3, y: 0.6 });
		const latest = app.changeColor('desk', blue);

		expect(light.color.value).toEqual(blue);
		expect(gateway.colorCalls.map((call) => call.color)).toEqual([red]);

		gateway.colorCalls[0]!.result.resolve();
		await first;

		expect(gateway.colorCalls.map((call) => call.color)).toEqual([red, blue]);

		gateway.colorCalls[1]!.result.resolve();
		await expect(Promise.all([superseded, latest])).resolves.toEqual([undefined, undefined]);
		expect(light.color.value).toEqual(blue);
	});

	it('runs the color lane independently from power and brightness', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const error = new Error('color failed');

		const toggle = app.toggleLight('desk');
		const dim = app.dimLight('desk', 70);
		const change = app.changeColor('desk', red);
		const rejection = expect(change).rejects.toBe(error);

		expect(gateway.calls.slice(1)).toEqual([
			{ method: 'setPower', lightId: 'desk', value: true },
			{ method: 'setBrightness', lightId: 'desk', value: 70 },
			{ method: 'setColor', lightId: 'desk', value: red }
		]);

		gateway.colorCalls[0]!.result.reject(error);
		await rejection;

		expect(light.color.value).toEqual({ x: 0.3, y: 0.3 });
		expect(light.isOn.value).toBe(true);
		expect(light.brightness.value).toBe(70);

		gateway.powerCalls[0]!.result.resolve();
		gateway.brightnessCalls[0]!.result.resolve();
		await Promise.all([toggle, dim]);
		expect(light.color.value).toEqual({ x: 0.3, y: 0.3 });
	});
});

describe('changeTemperature', () => {
	it('updates a temperature-only light and reverts when the bridge rejects it', async () => {
		const { app, gateway } = await setup([
			bridgeLight({ color: null, temperature: { mirek: 250 } })
		]);
		const light = app.state.lights.get('desk')!;
		const change = app.changeTemperature('desk', 447);

		expect(light.temperature.value).toEqual({ mirek: 447 });
		expect(light.color.value).toBeNull();
		expect(light.colors.value).toEqual([mirekToHex(447)]);
		expect(gateway.calls.slice(1)).toEqual([
			{ method: 'setTemperature', lightId: 'desk', value: 447 }
		]);

		const error = new Error('unreachable');
		const rejection = expect(change).rejects.toBe(error);
		gateway.temperatureCalls[0]!.result.reject(error);
		await rejection;

		expect(light.temperature.value).toEqual({ mirek: 250 });
		expect(light.colors.value).toEqual([mirekToHex(250)]);
	});

	it('rejects lights without color temperature and invalid mirek without a gateway call', async () => {
		const { app, gateway } = await setup();

		await expect(app.changeTemperature('desk', 447)).rejects.toBeInstanceOf(
			LightNotTemperatureCapableError
		);
		await expect(app.changeTemperature('desk', 12.5)).rejects.toBeInstanceOf(InvalidMirekError);
		expect(gateway.temperatureCalls).toHaveLength(0);
	});

	it('applies a mirek preset without sending xy color', async () => {
		const relax = areaPresets.find((preset) => preset.id === 'relax')!;
		const { app, gateway } = await setup([
			bridgeLight({ color: null, temperature: { mirek: 200 }, brightness: 40, isOn: true })
		]);
		const command = app.applyLightPreset('desk', 'relax');

		expect(app.state.lights.get('desk')?.temperature.value).toEqual({ mirek: relax.mirek });
		expect(app.state.lights.get('desk')?.brightness.value).toBe(relax.brightness);
		expect(gateway.colorCalls).toHaveLength(0);
		expect(gateway.temperatureCalls[0]).toMatchObject({ lightId: 'desk', mirek: relax.mirek });
		expect(gateway.brightnessCalls[0]).toMatchObject({
			lightId: 'desk',
			brightness: relax.brightness
		});

		gateway.temperatureCalls[0]!.result.resolve();
		gateway.brightnessCalls[0]!.result.resolve();
		await command;
	});
});

describe('command concurrency', () => {
	it('orders a re-entrant subscriber command after the command that triggered it', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const firstError = new Error('40 failed');
		const secondError = new Error('60 failed');
		let reentrant: Promise<void> | undefined;
		const unsubscribe = light.brightness.subscribe((brightness) => {
			if (brightness === 40) {
				reentrant = app.dimLight('desk', 60);
			}
		});

		const first = app.dimLight('desk', 40);

		expect(light.brightness.value).toBe(60);
		expect(gateway.brightnessCalls.map((call) => call.brightness)).toEqual([40]);
		expect(reentrant).toBeDefined();

		const firstRejection = expect(first).rejects.toBe(firstError);
		const secondRejection = expect(reentrant!).rejects.toBe(secondError);
		gateway.brightnessCalls[0]!.result.reject(firstError);
		await firstRejection;

		expect(light.brightness.value).toBe(60);
		expect(gateway.brightnessCalls.map((call) => call.brightness)).toEqual([40, 60]);

		gateway.brightnessCalls[1]!.result.reject(secondError);
		await secondRejection;
		expect(light.brightness.value).toBe(30);
		unsubscribe();
	});

	it('coalesces slider input, keeps the latest optimistic value, and sends deterministically', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;

		const first = app.dimLight('desk', 40);
		const superseded = app.dimLight('desk', 60);
		const latest = app.dimLight('desk', 80);

		expect(light.brightness.value).toBe(80);
		expect(gateway.brightnessCalls.map((call) => call.brightness)).toEqual([40]);

		gateway.brightnessCalls[0]!.result.resolve();
		await first;

		expect(light.brightness.value).toBe(80);
		expect(gateway.brightnessCalls.map((call) => call.brightness)).toEqual([40, 80]);

		gateway.brightnessCalls[1]!.result.resolve();
		await expect(Promise.all([superseded, latest])).resolves.toEqual([undefined, undefined]);
		expect(light.brightness.value).toBe(80);
	});

	it('does not roll back newer input after an earlier failure and uses the last confirmed value', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const firstError = new Error('40 failed');
		const latestError = new Error('80 failed');

		const first = app.dimLight('desk', 40);
		const latest = app.dimLight('desk', 80);
		const firstRejection = expect(first).rejects.toBe(firstError);
		const latestRejection = expect(latest).rejects.toBe(latestError);

		gateway.brightnessCalls[0]!.result.reject(firstError);
		await firstRejection;

		expect(light.brightness.value).toBe(80);
		expect(gateway.brightnessCalls.map((call) => call.brightness)).toEqual([40, 80]);

		gateway.brightnessCalls[1]!.result.reject(latestError);
		await latestRejection;
		expect(light.brightness.value).toBe(30);
	});

	it('rolls back a failed latest command to the preceding successful command', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const error = new Error('80 failed');

		const first = app.dimLight('desk', 40);
		const latest = app.dimLight('desk', 80);
		const latestRejection = expect(latest).rejects.toBe(error);

		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		expect(light.brightness.value).toBe(80);

		gateway.brightnessCalls[1]!.result.reject(error);
		await latestRejection;
		expect(light.brightness.value).toBe(40);
	});

	it('settles a superseded caller with the replacing command outcome', async () => {
		const { app, gateway } = await setup();
		const first = app.dimLight('desk', 40);
		const superseded = app.dimLight('desk', 60);
		const replacing = app.dimLight('desk', 80);
		const error = new Error('latest failed');
		const supersededRejection = expect(superseded).rejects.toBe(error);
		const replacingRejection = expect(replacing).rejects.toBe(error);

		gateway.brightnessCalls[0]!.result.resolve();
		await first;
		gateway.brightnessCalls[1]!.result.reject(error);

		await supersededRejection;
		await replacingRejection;
	});

	it('serializes a double toggle from on to off to on', async () => {
		const { app, gateway } = await setup([bridgeLight({ isOn: true })]);
		const light = app.state.lights.get('desk')!;

		const off = app.toggleLight('desk');
		const on = app.toggleLight('desk');

		expect(light.isOn.value).toBe(true);
		expect(gateway.powerCalls.map((call) => call.isOn)).toEqual([false]);

		gateway.powerCalls[0]!.result.resolve();
		await off;
		expect(light.isOn.value).toBe(true);
		expect(gateway.powerCalls.map((call) => call.isOn)).toEqual([false, true]);

		gateway.powerCalls[1]!.result.resolve();
		await on;
		expect(light.isOn.value).toBe(true);
	});

	it('runs power and brightness lanes on the same light independently', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;

		const toggle = app.toggleLight('desk');
		const dim = app.dimLight('desk', 70);

		expect(light.isOn.value).toBe(true);
		expect(light.brightness.value).toBe(70);
		expect(gateway.calls.slice(1)).toEqual([
			{ method: 'setPower', lightId: 'desk', value: true },
			{ method: 'setBrightness', lightId: 'desk', value: 70 }
		]);

		gateway.brightnessCalls[0]!.result.resolve();
		await dim;
		expect(light.isOn.value).toBe(true);

		gateway.powerCalls[0]!.result.resolve();
		await toggle;
		expect(light.brightness.value).toBe(70);
	});

	it('keeps rollback isolated to the affected light', async () => {
		const { app, gateway } = await setup([
			bridgeLight({ id: 'desk', brightness: 30 }),
			bridgeLight({ id: 'floor', name: 'Floor', brightness: 20 })
		]);
		const desk = app.state.lights.get('desk')!;
		const floor = app.state.lights.get('floor')!;
		const error = new Error('desk failed');

		const deskDim = app.dimLight('desk', 70);
		const floorDim = app.dimLight('floor', 90);
		const deskRejection = expect(deskDim).rejects.toBe(error);

		gateway.brightnessCalls[1]!.result.resolve();
		await floorDim;
		gateway.brightnessCalls[0]!.result.reject(error);
		await deskRejection;

		expect(desk.brightness.value).toBe(30);
		expect(floor.brightness.value).toBe(90);
	});
});

describe('reactivity and public API', () => {
	it('notifies only subscribers to the changed property on the changed light', async () => {
		const { app, gateway } = await setup([
			bridgeLight({ id: 'desk' }),
			bridgeLight({ id: 'floor', name: 'Floor' })
		]);
		const desk = app.state.lights.get('desk')!;
		const deskPowers: boolean[] = [];
		const unsubscribe = desk.isOn.subscribe((value) => deskPowers.push(value));

		const deskDim = app.dimLight('desk', 70);
		const floorToggle = app.toggleLight('floor');

		expect(deskPowers).toEqual([false]);
		gateway.brightnessCalls[0]!.result.resolve();
		gateway.powerCalls[0]!.result.resolve();
		await Promise.all([deskDim, floorToggle]);
		expect(deskPowers).toEqual([false]);

		const deskToggle = app.toggleLight('desk');
		expect(deskPowers).toEqual([false, true]);
		gateway.powerCalls[1]!.result.resolve();
		await deskToggle;
		unsubscribe();
	});

	it('stops notifications after unsubscribe', async () => {
		const { app, gateway } = await setup();
		const light = app.state.lights.get('desk')!;
		const powers: boolean[] = [];
		const unsubscribe = light.isOn.subscribe((value) => powers.push(value));
		unsubscribe();

		const toggle = app.toggleLight('desk');
		gateway.powerCalls[0]!.result.resolve();
		await toggle;

		expect(powers).toEqual([false]);
	});

	it('exposes read-only computed signals at runtime', async () => {
		const { app } = await setup();
		const light = app.state.lights.get('desk')!;

		expect(() => {
			(light.isOn as any).value = true;
		}).toThrow();
		expect(light.isOn.value).toBe(false);
	});

	it('freezes public light properties at runtime', async () => {
		const { app } = await setup();
		const light = app.state.lights.get('desk')!;

		expect(() => {
			(light as any).id = 'other';
		}).toThrow();
		expect(() => {
			(light as any).isOn = light.isOn;
		}).toThrow();
		expect(light.id).toBe('desk');
		expect(light.isOn.value).toBe(false);
	});

	it('supports a framework-free initialize, get, subscribe, toggle, unsubscribe flow', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const initialization = app.initialize();
		gateway.listCalls[0]!.resolve([bridgeLight()]);
		await initialization;

		const light = app.state.lights.get('desk')!;
		const seen: boolean[] = [];
		const unsubscribe = light.isOn.subscribe((value) => seen.push(value));
		const toggle = app.toggleLight('desk');
		expect(seen).toEqual([false, true]);
		gateway.powerCalls[0]!.result.resolve();
		await toggle;
		unsubscribe();

		expect(light.isOn.value).toBe(true);
	});
});
