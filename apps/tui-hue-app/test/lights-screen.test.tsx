import { afterEach, describe, expect, test } from 'bun:test';
import { testRender } from '@opentui/react/test-utils';
import {
	areaPresets,
	createHueApp,
	type BridgeArea,
	type BridgeLight,
	type HueGateway
} from 'hue-app';
import { act } from 'react';
import type { Connection } from '../src/connection';
import { App } from '../src/ui/App';
import { LightsScreen } from '../src/ui/LightsScreen';
import { palette } from '../src/ui/palette';

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

	async setColor() {}

	async setTemperature() {}
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

async function renderLights(
	gateway: HueGateway,
	ready: string,
	width = 80,
	height = 20,
	onQuit?: () => void
) {
	await act(async () => {
		setup = await testRender(
			<LightsScreen app={createHueApp({ gateway, settleMs: 0 })} onQuit={onQuit} />,
			{ width, height, kittyKeyboard: true }
		);
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
		{ id: 'b', name: 'Kitchen', isOn: false, brightness: 40, color: null, temperature: null },
		{
			id: 'a',
			name: 'Desk',
			isOn: true,
			brightness: deskBrightness,
			color: null,
			temperature: null
		},
		{ id: 'c', name: 'Plug', isOn: true, brightness: null, color: null, temperature: null }
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
				brightness: 50,
				color: null,
				temperature: null
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

const attic: BridgeArea = {
	id: 'attic',
	name: 'Attic',
	serviceId: 'attic-light',
	isOn: true,
	brightness: 40,
	color: { x: 0.4, y: 0.4 },
	children: []
};

const kitchen: BridgeArea = {
	id: 'kitchen',
	name: 'Kitchen',
	serviceId: 'kitchen-light',
	isOn: false,
	brightness: 20,
	color: null,
	children: []
};

const hall: BridgeArea = {
	id: 'hall',
	name: 'Hall',
	serviceId: 'hall-light',
	isOn: true,
	brightness: null,
	color: null,
	children: []
};

const deskLight: BridgeLight = {
	id: 'desk',
	name: 'Desk',
	isOn: true,
	brightness: 50,
	color: null
};

class AreaGateway extends FakeGateway {
	readonly areaPower: [string, boolean][] = [];
	readonly areaBrightness: [string, number][] = [];
	readonly areaColor: [string, { readonly x: number; readonly y: number }][] = [];
	private rejectPower: ((error: Error) => void) | undefined;

	constructor(
		lights: BridgeLight[],
		private readonly areas: { rooms: BridgeArea[]; zones: BridgeArea[] },
		private readonly powerError?: string
	) {
		super(lights);
	}

	async listAreas() {
		return this.areas;
	}

	setAreaPower(serviceId: string, isOn: boolean) {
		this.areaPower.push([serviceId, isOn]);

		if (this.powerError) {
			return new Promise<void>((_resolve, reject) => {
				this.rejectPower = reject;
			});
		}

		return new Promise<void>(() => {});
	}

	failPower() {
		this.rejectPower?.(new Error(this.powerError ?? 'bridge down'));
	}

	async setAreaBrightness(serviceId: string, brightness: number) {
		this.areaBrightness.push([serviceId, brightness]);
	}

	async setAreaColor(serviceId: string, color: { x: number; y: number }) {
		this.areaColor.push([serviceId, color]);
	}
}

class PendingGateway implements HueGateway {
	listLights(): Promise<BridgeLight[]> {
		return new Promise(() => {});
	}

	async setPower() {}

	async setBrightness() {}

	async setColor() {}
}

function home(atticBrightness = attic.brightness) {
	return new AreaGateway([deskLight], {
		rooms: [{ ...attic, brightness: atticBrightness }, kitchen],
		zones: [hall]
	});
}

function preset(id: 'bright' | 'relax' | 'energize') {
	const found = areaPresets.find((entry) => entry.id === id);

	if (!found) {
		throw new Error(`Missing ${id} preset`);
	}

	return found;
}

describe('rooms and zones', () => {
	test('lists rooms and zones by name ahead of the lights', async () => {
		const { captureCharFrame } = await renderLights(home(), 'Desk', 80, 24);
		const frame = captureCharFrame();
		const rows = frame.split('\n');
		const atticRow = rows.findIndex((line) => line.includes('Attic'));
		const kitchenRow = rows.findIndex((line) => line.includes('Kitchen'));
		const hallRow = rows.findIndex((line) => line.includes('Hall'));
		const deskRow = rows.findIndex((line) => line.includes('Desk'));

		expect(frame).toContain('Rooms');
		expect(frame).toContain('1/2 on');
		expect(frame).toContain('Zones');
		expect(atticRow).toBeGreaterThan(-1);
		expect(rows[atticRow]).toContain('›');
		expect(kitchenRow).toBeGreaterThan(atticRow);
		expect(hallRow).toBeGreaterThan(kitchenRow);
		expect(deskRow).toBeGreaterThan(hallRow);
		expect(rows[atticRow]).toContain('Custom');
	});

	test('toggles the selected room and the next key reaches that room', async () => {
		const gateway = home();
		const { waitForFrame } = await renderLights(gateway, 'Desk', 80, 24);

		await press('j', ' ');

		const frame = await waitForFrame((next) => next.includes('2/2 on'));
		expect(row(frame, 'Kitchen')).toContain('› 02 ●');
		expect(gateway.areaPower).toEqual([['kitchen-light', true]]);
	});

	test('dims a room only while it is on and can be dimmed', async () => {
		const gateway = home(50);
		const { waitForFrame } = await renderLights(gateway, 'Desk', 80, 24);

		await press('l', 'l', 'l');

		expect(row(await waitForFrame((frame) => frame.includes('80%')), 'Attic')).toContain('80%');
		expect(gateway.areaBrightness.at(-1)).toEqual(['attic-light', 80]);
		expect(gateway.areaBrightness.map(([, brightness]) => brightness)).not.toContain(70);

		await press('j', 'l');
		await press('j', 'l');
		await press('j', 'l');

		expect(gateway.areaBrightness.map(([, brightness]) => brightness)).not.toContain(70);
		expect(gateway.brightnessCommands).toEqual([['desk', 60]]);
	});

	test('applies the selected preset and palette color', async () => {
		const gateway = home();
		const bright = preset('bright');
		const orange = palette[1];

		if (!orange) {
			throw new Error('Missing orange');
		}

		const { captureCharFrame, waitForFrame } = await renderLights(gateway, 'Desk', 80, 24);

		await press('p', ' ');

		expect(await waitForFrame((frame) => frame.includes('Bright current'))).toContain('Attic');
		expect(gateway.areaColor[0]).toEqual(['attic-light', bright.color]);
		expect(gateway.areaBrightness.at(-1)).toEqual(['attic-light', bright.brightness]);

		await press('BACKSPACE');
		const closed = await waitForFrame(
			(frame) => frame.includes('Bright') && !frame.includes('Presets')
		);
		expect(closed).toContain('Attic');

		await press('c', 'j', ' ');

		expect(await waitForFrame((frame) => frame.includes('Orange current'))).toContain('Color');
		expect(gateway.areaColor.at(-1)).toEqual(['attic-light', orange.xy]);
	});

	test('keeps presets and colors closed when the selection cannot use them', async () => {
		const { captureCharFrame } = await renderLights(home(), 'Desk', 80, 24);

		await press('j', 'p', 'c');
		expect(captureCharFrame()).not.toContain('Presets');
		expect(captureCharFrame()).not.toContain('Color');

		await press('j', 'c');
		expect(captureCharFrame()).not.toContain('Color');

		await press('j', 'p');
		expect(captureCharFrame()).not.toContain('Presets');
	});

	test('applies a zone preset without dimming a zone that has no brightness', async () => {
		const gateway = home();
		const bright = preset('bright');
		await renderLights(gateway, 'Desk', 80, 24);

		await press('j', 'j', 'p', ' ');

		expect(gateway.areaColor[0]).toEqual(['hall-light', bright.color]);
		expect(gateway.areaBrightness).toEqual([]);
	});

	test('reports a rejected room command and restores the room', async () => {
		const gateway = new AreaGateway([deskLight], { rooms: [attic], zones: [] }, 'bridge down');
		const { waitForFrame } = await renderLights(gateway, 'Desk', 80, 24);

		await press(' ');
		await act(async () => {
			gateway.failPower();
		});

		const frame = await waitForFrame((next) => next.includes('bridge down'));
		expect(row(frame, 'Attic')).toContain('●');
		expect(gateway.areaPower).toEqual([['attic-light', false]]);
	});

	test('escape closes a chooser before it quits', async () => {
		let quits = 0;
		const { captureCharFrame, waitForFrame } = await renderLights(home(), 'Attic', 80, 24, () => {
			quits += 1;
		});

		await press('p');
		expect(await waitForFrame((frame) => frame.includes('Presets'))).toContain('Attic');

		await press('BACKSPACE');
		expect(quits).toBe(0);
		expect(
			await waitForFrame((frame) => frame.includes('Attic') && !frame.includes('Presets'))
		).toContain('Rooms');

		await press('ESCAPE');
		expect(quits).toBe(1);
	});

	test('escape in the app closes presets without quitting', async () => {
		let quits = 0;
		const gateway = home();
		const connection: Connection = {
			async resolve() {
				return { bridge: { id: 'bridge', ip: '127.0.0.1' }, appKey: 'key' };
			},
			async link() {
				return 'key';
			},
			open() {
				return createHueApp({ gateway, settleMs: 0 });
			}
		};

		await act(async () => {
			setup = await testRender(
				<App
					connection={connection}
					onQuit={() => {
						quits += 1;
					}}
				/>,
				{
					width: 80,
					height: 30,
					kittyKeyboard: true
				}
			);
		});
		if (!setup) {
			throw new Error('Render failed');
		}
		const rendered = setup;
		await act(async () => {
			await rendered.waitForFrame((frame) => frame.includes('Attic'));
		});

		await press('p');
		expect(await rendered.waitForFrame((frame) => frame.includes('Presets'))).toContain('Attic');

		await press('BACKSPACE');
		expect(quits).toBe(0);
		expect(
			await rendered.waitForFrame((frame) => frame.includes('Attic') && !frame.includes('Presets'))
		).toContain('Rooms');

		await press('ESCAPE');
		expect(quits).toBe(1);
	});

	test('shows a loading line for each section', async () => {
		const { captureCharFrame } = await renderLights(new PendingGateway(), 'Loading rooms');
		const loading = captureCharFrame();

		expect(loading).toContain('Loading rooms…');
		expect(loading).toContain('Loading zones…');
		expect(loading).toContain('Loading lights…');
		expect(loading).not.toContain('No rooms');
	});

	test('shows an empty line for each section', async () => {
		const { captureCharFrame } = await renderLights(new FakeGateway([]), 'No lights');
		const empty = captureCharFrame();

		expect(empty).toContain('No rooms');
		expect(empty).toContain('No zones');
		expect(empty).toContain('No lights');
	});
});
