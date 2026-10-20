import { afterEach, describe, expect, test } from 'bun:test';
import { testRender } from '@opentui/react/test-utils';
import { createHueApp, type BridgeLight, type HueGateway } from 'hue-app';
import { act } from 'react';
import { LightsScreen } from '../src/ui/LightsScreen';

class FakeGateway implements HueGateway {
	readonly powerCommands: [string, boolean][] = [];
	readonly brightnessCommands: [string, number][] = [];

	constructor(private readonly lights: BridgeLight[]) {}

	async listLights() {
		return this.lights;
	}

	setPower(lightId: string, isOn: boolean) {
		this.powerCommands.push([lightId, isOn]);
		return new Promise<void>(() => {});
	}

	async setBrightness(lightId: string, brightness: number) {
		this.brightnessCommands.push([lightId, brightness]);
	}
}

let setup: Awaited<ReturnType<typeof testRender>> | undefined;

async function press(...keys: string[]) {
	await act(async () => {
		for (const key of keys) {
			setup?.mockInput.pressKey(key);
		}
	});
}

afterEach(async () => {
	await act(async () => {
		setup?.renderer.destroy();
	});
	setup = undefined;
});

async function renderLights(gateway: FakeGateway, ready: string, width = 80, height = 20) {
	await act(async () => {
		setup = await testRender(<LightsScreen app={createHueApp({ gateway })} />, {
			width,
			height
		});
	});
	if (!setup) {
		throw new Error('Render failed');
	}
	const rendered = setup;
	await act(async () => {
		await rendered.waitForFrame((frame) => frame.includes(ready));
	});
	return rendered;
}

function row(frame: string, name: string) {
	return frame.split('\n').find((line) => line.includes(name));
}

function lights(deskBrightness = 80) {
	return new FakeGateway([
		{ id: 'b', name: 'Kitchen', isOn: false, brightness: 40 },
		{ id: 'a', name: 'Desk', isOn: true, brightness: deskBrightness },
		{ id: 'c', name: 'Plug', isOn: true, brightness: null }
	]);
}

describe('LightsScreen', () => {
	test('lists lights by name and toggles the selected one optimistically', async () => {
		const gateway = lights();
		const { captureCharFrame, waitForFrame } = await renderLights(gateway, 'Plug');

		const rows = captureCharFrame().split('\n');
		const desk = rows.findIndex((row) => row.includes('Desk'));
		expect(rows.join('\n')).toContain('2/3 on');
		expect(desk).toBeGreaterThan(-1);
		expect(rows[desk]).toContain('›');
		expect(rows[desk]).toContain('80% ████████░░');
		expect(rows.findIndex((row) => row.includes('Kitchen'))).toBe(desk + 1);
		expect(rows[desk + 2]).toContain('100%');

		await press('j');
		await press(' ');

		const toggled = await waitForFrame((frame) => frame.includes('3/3 on'));
		expect(row(toggled, 'Kitchen')).toContain('› 02 ●');
		expect(gateway.powerCommands).toEqual([['b', true]]);
	});

	test('dims the selected light only while it is on', async () => {
		const gateway = lights();
		const { waitForFrame } = await renderLights(gateway, 'Plug');

		await press('l');
		expect(row(await waitForFrame((frame) => frame.includes('90%')), 'Desk')).toContain('90%');

		await press('j');
		await press('l');
		await press('h');
		expect(gateway.brightnessCommands).toEqual([['a', 90]]);
	});

	test('toggles the newly selected light when keys arrive together', async () => {
		const gateway = lights();
		const { waitForFrame } = await renderLights(gateway, 'Plug');

		await press('j', ' ');

		expect(row(await waitForFrame((frame) => frame.includes('3/3 on')), 'Kitchen')).toContain(
			'› 02 ●'
		);
		expect(gateway.powerCommands).toEqual([['b', true]]);
	});

	test('accumulates dim steps that arrive together', async () => {
		const gateway = lights(50);
		const { waitForFrame } = await renderLights(gateway, 'Plug');

		await press('l', 'l', 'l');

		expect(row(await waitForFrame((frame) => frame.includes('80%')), 'Desk')).toContain('80%');
		expect(gateway.brightnessCommands.at(-1)).toEqual(['a', 80]);
		expect(gateway.brightnessCommands.map(([, brightness]) => brightness)).not.toContain(70);
	});

	test('keeps the selected row visible in a long list', async () => {
		const gateway = new FakeGateway(
			Array.from({ length: 30 }, (_, index) => ({
				id: `light-${index}`,
				name: `Light ${String(index + 1).padStart(2, '0')}`,
				isOn: true,
				brightness: 50
			}))
		);
		const { captureCharFrame, waitForFrame } = await renderLights(gateway, 'Light 01', 80, 12);

		await press(...Array.from({ length: 29 }, () => 'j'));

		const frame = await waitForFrame((frame) => frame.includes('› 30'));
		const rows = frame.split('\n').filter((line) => /Light \d\d/.test(line));
		expect(row(frame, '› 30')).toContain('Light 30');
		expect(rows.length).toBeGreaterThan(3);
		expect(new Set(rows).size).toBe(rows.length);
		expect(frame).toContain('q quit');
		expect(captureCharFrame()).not.toContain('Light 01');
	});
});
