import type { ReadonlySignal } from '@preact/signals-core';
import { flushSync, tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import { createHueApp, type HueApp } from '../src/index.js';
import { createSvelteHueApp, type SvelteHueApp, type SvelteLight } from '../src/svelte/index.js';
import { at, desk, FakeGateway, lamp } from './fake-gateway.js';

async function setup() {
	const gateway = new FakeGateway();
	const app = createHueApp({ gateway });
	const hue = createSvelteHueApp(app);
	const ready = hue.initialize();
	at(gateway.listCalls, 0).resolve([{ ...desk }, { ...lamp }]);
	await ready;
	return { gateway, app, hue };
}

function coreLight(app: HueApp, id: string) {
	const light = app.state.lights.get(id);
	if (!light) {
		throw new Error(`No core light ${id}`);
	}
	return light;
}

function countSubscriptions(source: Pick<ReadonlySignal<unknown>, 'subscribe'>) {
	const counter = { active: 0, total: 0 };
	const original = source.subscribe.bind(source);
	source.subscribe = (fn) => {
		counter.active += 1;
		counter.total += 1;
		const dispose = original(fn);
		return () => {
			counter.active -= 1;
			dispose();
		};
	};
	return counter;
}

function watch<T>(read: () => T) {
	const runs: T[] = [];
	const cleanup = $effect.root(() => {
		$effect(() => {
			runs.push(read());
		});
	});
	flushSync();
	return { runs, cleanup };
}

describe('createSvelteHueApp', () => {
	test('exposes initial state as plain values after initialize', async () => {
		const { hue } = await setup();

		expect(hue.status).toBe('ready');
		expect(hue.error).toBeUndefined();
		expect(hue.lights.all.map((light) => light.id)).toEqual(['desk', 'lamp']);
		expect(hue.lights.get('desk')).toMatchObject({
			id: 'desk',
			name: 'Desk',
			isOn: false,
			brightness: 40,
			color: { x: 0.3, y: 0.3 }
		});
		expect(hue.lights.get('lamp')?.brightness).toBeNull();
		expect(hue.lights.get('lamp')?.color).toBeNull();
		expect(hue.lights.get('missing')).toBeUndefined();
	});

	test('tracks status and error through loading and failure', async () => {
		const gateway = new FakeGateway();
		const hue = createSvelteHueApp(createHueApp({ gateway }));
		const { runs, cleanup } = watch(() => [hue.status, hue.error]);

		expect(runs).toEqual([['idle', undefined]]);

		const failure = new Error('bridge offline');
		const pending = hue.initialize();
		flushSync();
		expect(runs.at(-1)).toEqual(['loading', undefined]);

		at(gateway.listCalls, 0).reject(failure);
		await expect(pending).rejects.toBe(failure);
		flushSync();
		expect(runs.at(-1)).toEqual(['error', failure]);

		cleanup();
	});

	test('returns the same wrappers across repeated reads', async () => {
		const { hue } = await setup();
		const first = hue.lights.get('desk');
		const all = hue.lights.all;

		expect(first).toBeDefined();
		expect(hue.lights.get('desk')).toBe(first);
		expect(hue.lights.all).toBe(all);
		expect(at(all, 0)).toBe(first);
		expect(at(hue.lights.all, 1)).toBe(hue.lights.get('lamp'));
	});

	test('propagates the lights loaded by initialize into effects that read them before', async () => {
		const gateway = new FakeGateway();
		const hue = createSvelteHueApp(createHueApp({ gateway }));
		const { runs, cleanup } = watch(() => ({
			ids: hue.lights.all.map((light) => light.id),
			lamp: hue.lights.get('lamp')?.name
		}));

		expect(runs).toEqual([{ ids: [], lamp: undefined }]);

		const ready = hue.initialize();
		flushSync();
		expect(runs).toHaveLength(1);

		at(gateway.listCalls, 0).resolve([{ ...desk }, { ...lamp }]);
		await ready;
		flushSync();

		expect(runs).toEqual([
			{ ids: [], lamp: undefined },
			{ ids: ['desk', 'lamp'], lamp: 'Lamp' }
		]);
		expect(hue.lights.get('lamp')).toBe(at(hue.lights.all, 1));

		cleanup();
	});

	test('propagates core signal changes through deriveds', async () => {
		const { gateway, hue } = await setup();
		const labels: string[] = [];
		const cleanup = $effect.root(() => {
			const light = $derived(hue.lights.get('desk'));
			const label = $derived(
				light ? `${light.name}: ${light.isOn ? 'on' : 'off'} ${light.brightness}` : 'none'
			);
			$effect(() => {
				labels.push(label);
			});
		});
		flushSync();
		expect(labels).toEqual(['Desk: off 40']);

		const toggled = hue.toggleLight('desk');
		flushSync();
		const dimmed = hue.dimLight('desk', 60);
		flushSync();
		expect(labels).toEqual(['Desk: off 40', 'Desk: on 40', 'Desk: on 60']);

		gateway.commands.forEach((command) => command.resolve());
		await Promise.all([toggled, dimmed]);
		flushSync();
		expect(labels).toHaveLength(3);

		cleanup();
	});

	test('shows optimistic toggle and dim immediately, before the gateway settles', async () => {
		const { gateway, hue } = await setup();
		const light = hue.lights.get('desk') as SvelteLight;
		const { runs, cleanup } = watch(() => ({ isOn: light.isOn, brightness: light.brightness }));

		const toggled = hue.toggleLight('desk');
		const dimmed = hue.dimLight('desk', 75);
		flushSync();

		expect(gateway.commands).toHaveLength(2);
		expect(runs.at(-1)).toEqual({ isOn: true, brightness: 75 });

		gateway.commands.forEach((command) => command.resolve());
		await Promise.all([toggled, dimmed]);
		flushSync();
		expect(runs.at(-1)).toEqual({ isOn: true, brightness: 75 });

		cleanup();
	});

	test('propagates rollback when the gateway rejects', async () => {
		const { gateway, hue } = await setup();
		const light = hue.lights.get('desk') as SvelteLight;
		const { runs, cleanup } = watch(() => [light.isOn, light.brightness]);

		const toggled = hue.toggleLight('desk');
		const dimmed = hue.dimLight('desk', 90);
		flushSync();
		expect(runs.at(-1)).toEqual([true, 90]);

		gateway.commands.forEach((command) => command.reject(new Error('rejected')));
		await expect(toggled).rejects.toThrow('rejected');
		await expect(dimmed).rejects.toThrow('rejected');
		flushSync();

		expect(runs.at(-1)).toEqual([false, 40]);
		expect(light.isOn).toBe(false);
		expect(light.brightness).toBe(40);

		cleanup();
	});

	test('tracks optimistic, rolled back, and remote color changes reactively', async () => {
		const { gateway, hue } = await setup();
		const light = hue.lights.get('desk') as SvelteLight;
		const { runs, cleanup } = watch(() => light.color);

		at(gateway.observers, 0).onChanges([
			{ kind: 'updated', id: 'desk', color: { x: 0.15, y: 0.06 } }
		]);
		flushSync();
		expect(runs.at(-1)).toEqual({ x: 0.15, y: 0.06 });

		const changed = hue.changeColor('desk', { x: 0.64, y: 0.33 });
		flushSync();
		expect(runs.at(-1)).toEqual({ x: 0.64, y: 0.33 });

		at(gateway.commands, 0).reject(new Error('rejected'));
		await expect(changed).rejects.toThrow('rejected');
		flushSync();

		expect(runs).toEqual([
			{ x: 0.3, y: 0.3 },
			{ x: 0.15, y: 0.06 },
			{ x: 0.64, y: 0.33 },
			{ x: 0.15, y: 0.06 }
		]);
		expect(light.color).toEqual({ x: 0.15, y: 0.06 });
		hue.dispose();
		cleanup();
	});

	test('returns current values when read outside a reactive context', async () => {
		const { gateway, hue } = await setup();
		const light = hue.lights.get('desk') as SvelteLight;

		const toggled = hue.toggleLight('desk');
		expect(light.isOn).toBe(true);

		at(gateway.commands, 0).reject(new Error('rejected'));
		await expect(toggled).rejects.toThrow('rejected');
		expect(light.isOn).toBe(false);
	});

	test('subscribes lazily, shares one subscription, and releases it after cleanup', async () => {
		const gateway = new FakeGateway();
		const app = createHueApp({ gateway });
		const ready = app.initialize();
		at(gateway.listCalls, 0).resolve([{ ...desk }]);
		await ready;

		const isOnSubscriptions = countSubscriptions(coreLight(app, 'desk').isOn);
		const collectionSubscriptions = countSubscriptions(app.state.lights);
		const hue: SvelteHueApp = createSvelteHueApp(app);
		const light = hue.lights.get('desk') as SvelteLight;

		expect(light.isOn).toBe(false);
		expect(isOnSubscriptions.total).toBe(0);
		expect(collectionSubscriptions.total).toBe(0);

		const first = watch(() => light.isOn);
		const second = watch(() => hue.lights.get('desk')?.isOn);
		expect(isOnSubscriptions.active).toBe(1);
		expect(collectionSubscriptions.active).toBe(1);

		first.cleanup();
		await tick();
		expect(isOnSubscriptions.active).toBe(1);

		second.cleanup();
		await tick();
		expect(isOnSubscriptions.active).toBe(0);
		expect(collectionSubscriptions.active).toBe(0);
		expect(isOnSubscriptions.total).toBe(1);

		const toggled = app.toggleLight('desk');
		flushSync();
		expect(first.runs).toEqual([false]);
		expect(second.runs).toEqual([false]);
		expect(light.isOn).toBe(true);

		at(gateway.commands, 0).resolve();
		await toggled;
	});

	test('does not re-run effects for the initial Preact notification', async () => {
		const { hue } = await setup();
		const light = hue.lights.get('desk') as SvelteLight;
		const { runs, cleanup } = watch(() => [light.name, light.isOn, light.brightness]);

		flushSync();
		await tick();
		flushSync();

		expect(runs).toHaveLength(1);
		cleanup();
	});

	test('tracks remote name changes reactively', async () => {
		const { gateway, hue } = await setup();
		const light = hue.lights.get('desk') as SvelteLight;
		const { runs, cleanup } = watch(() => light.name);

		at(gateway.observers, 0).onChanges([{ kind: 'updated', id: 'desk', name: 'Office' }]);
		flushSync();

		expect(runs).toEqual(['Desk', 'Office']);
		expect(light.name).toBe('Office');
		cleanup();
	});

	test('tracks connection state and goes offline on dispose', async () => {
		const { gateway, hue } = await setup();
		const { runs, cleanup } = watch(() => hue.connection);
		const observer = at(gateway.observers, 0);

		observer.onConnectionChange('live');
		flushSync();
		hue.dispose();
		flushSync();

		expect(runs).toEqual(['connecting', 'live', 'offline']);
		expect(gateway.unwatchCalls).toBe(1);
		await expect(hue.toggleLight('desk')).rejects.toThrow('disposed');
		cleanup();
	});
});
