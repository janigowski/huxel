import {
	areaPresets,
	hexToXy,
	mirekToHex,
	xyToHex,
	type AreaPreset,
	type ColorTemperature,
	type HueAppConnection,
	type HueAppStatus,
	type PresetId,
	type XyColor
} from '@huxel/app';
import type { SvelteArea, SvelteHueApp, SvelteLight } from '@huxel/app/svelte';

interface StudioLight {
	id: string;
	name: string;
	isOn: boolean;
	brightness: number | null;
	color: XyColor | null;
	temperature: ColorTemperature | null;
	colors: string[];
}

interface StudioGroup {
	readonly id: string;
	readonly name: string;
	readonly lightIds: readonly string[];
}

const amber = hexToXy('#ffbf00');
const orange = hexToXy('#ff8a1f');
const pink = hexToXy('#ff4fa3');
const cyan = hexToXy('#22d3ee');
const relax = areaPresets.find((preset) => preset.id === 'relax');

function temperatureLight(
	id: string,
	name: string,
	isOn: boolean,
	mirek: number,
	brightness: number
): StudioLight {
	return {
		id,
		name,
		isOn,
		brightness,
		color: null,
		temperature: { mirek },
		colors: [mirekToHex(mirek)]
	};
}

function colorLight(
	id: string,
	name: string,
	isOn: boolean,
	hex: string,
	color: XyColor,
	brightness: number
): StudioLight {
	return {
		id,
		name,
		isOn,
		brightness,
		color: { x: color.x, y: color.y },
		temperature: null,
		colors: [hex]
	};
}

function seed(): StudioLight[] {
	const warm = relax?.mirek ?? 447;
	const level = relax?.brightness ?? 57;

	return [
		colorLight('sofa', 'Sofa lamp', true, '#ff8a1f', orange, 68),
		colorLight('pendant', 'Pendant', true, '#ffbf00', amber, 54),
		colorLight('shelf', 'Shelf', true, '#ff4fa3', pink, 36),
		colorLight('spots', 'Spots', true, '#ffbf00', amber, 80),
		colorLight('counter', 'Counter', true, '#ffbf00', amber, 80),
		temperatureLight('reading', 'Reading lamp', false, warm, level),
		temperatureLight('bedside', 'Bedside', false, warm, level),
		temperatureLight('desk', 'Desk lamp', true, warm, level),
		colorLight('sconce', 'Sconce', true, '#22d3ee', cyan, 28)
	];
}

export class StudioHome implements SvelteHueApp {
	readonly status: HueAppStatus = 'ready';
	readonly error: unknown = undefined;
	readonly connection: HueAppConnection = 'live';

	private readonly lightState = $state<StudioLight[]>(seed());
	private readonly roomGroups: readonly StudioGroup[] = [
		{ id: 'living', name: 'Living room', lightIds: ['sofa', 'pendant', 'shelf'] },
		{ id: 'kitchen', name: 'Kitchen', lightIds: ['spots', 'counter'] },
		{ id: 'bedroom', name: 'Bedroom', lightIds: ['reading', 'bedside'] },
		{ id: 'hall', name: 'Hall', lightIds: ['sconce'] }
	];
	private readonly zoneGroups: readonly StudioGroup[] = [
		{ id: 'evening', name: 'Evening', lightIds: ['sofa', 'pendant', 'shelf'] },
		{ id: 'desk-zone', name: 'Desk', lightIds: ['desk'] }
	];

	readonly lights: SvelteHueApp['lights'];
	readonly rooms: SvelteHueApp['rooms'];
	readonly zones: SvelteHueApp['zones'];

	constructor() {
		const home = this;

		this.lights = {
			get all() {
				return home.lightState;
			},
			get(id) {
				return home.lightState.find((light) => light.id === id);
			}
		};

		this.rooms = {
			get all() {
				return home.roomGroups.map((group) => home.area(group));
			},
			get(id) {
				const group = home.roomGroups.find((entry) => entry.id === id);

				return group ? home.area(group) : undefined;
			}
		};

		this.zones = {
			get all() {
				return home.zoneGroups.map((group) => home.area(group));
			},
			get(id) {
				const group = home.zoneGroups.find((entry) => entry.id === id);

				return group ? home.area(group) : undefined;
			}
		};
	}

	initialize(): Promise<void> {
		return Promise.resolve();
	}

	dispose(): void {}

	toggleLight(lightId: string): Promise<void> {
		this.update(lightId, (light) => {
			light.isOn = !light.isOn;
		});

		return Promise.resolve();
	}

	dimLight(lightId: string, brightness: number): Promise<void> {
		this.update(lightId, (light) => {
			light.brightness = brightness;
		});

		return Promise.resolve();
	}

	changeColor(lightId: string, color: XyColor): Promise<void> {
		this.update(lightId, (light) => {
			this.paint(light, color);
		});

		return Promise.resolve();
	}

	changeTemperature(lightId: string, mirek: number): Promise<void> {
		this.update(lightId, (light) => {
			this.warm(light, mirek);
		});

		return Promise.resolve();
	}

	applyLightPreset(lightId: string, preset: PresetId): Promise<void> {
		const scene = areaPresets.find((entry) => entry.id === preset);

		if (!scene) {
			return Promise.resolve();
		}

		this.update(lightId, (light) => {
			this.apply(light, scene);
		});

		return Promise.resolve();
	}

	toggleRoom(roomId: string): Promise<void> {
		this.toggleGroup(this.roomGroups.find((group) => group.id === roomId));

		return Promise.resolve();
	}

	dimRoom(roomId: string, brightness: number): Promise<void> {
		this.dimGroup(this.roomGroups.find((group) => group.id === roomId), brightness);

		return Promise.resolve();
	}

	changeRoomColor(roomId: string, color: XyColor): Promise<void> {
		this.paintGroup(this.roomGroups.find((group) => group.id === roomId), color);

		return Promise.resolve();
	}

	changeRoomTemperature(roomId: string, mirek: number): Promise<void> {
		this.warmGroup(this.roomGroups.find((group) => group.id === roomId), mirek);

		return Promise.resolve();
	}

	applyRoomPreset(roomId: string, preset: PresetId): Promise<void> {
		this.applyGroup(this.roomGroups.find((group) => group.id === roomId), preset);

		return Promise.resolve();
	}

	toggleZone(zoneId: string): Promise<void> {
		this.toggleGroup(this.zoneGroups.find((group) => group.id === zoneId));

		return Promise.resolve();
	}

	dimZone(zoneId: string, brightness: number): Promise<void> {
		this.dimGroup(this.zoneGroups.find((group) => group.id === zoneId), brightness);

		return Promise.resolve();
	}

	changeZoneColor(zoneId: string, color: XyColor): Promise<void> {
		this.paintGroup(this.zoneGroups.find((group) => group.id === zoneId), color);

		return Promise.resolve();
	}

	changeZoneTemperature(zoneId: string, mirek: number): Promise<void> {
		this.warmGroup(this.zoneGroups.find((group) => group.id === zoneId), mirek);

		return Promise.resolve();
	}

	applyZonePreset(zoneId: string, preset: PresetId): Promise<void> {
		this.applyGroup(this.zoneGroups.find((group) => group.id === zoneId), preset);

		return Promise.resolve();
	}

	private area(group: StudioGroup): SvelteArea {
		const members = this.members(group.lightIds);

		return {
			id: group.id,
			name: group.name,
			isOn: members.some((light) => light.isOn),
			brightness: averageBrightness(members),
			color: sharedColor(members),
			temperature: sharedTemperature(members),
			colors: [...new Set(members.flatMap((light) => light.colors))]
		};
	}

	private members(ids: readonly string[]): StudioLight[] {
		return ids.flatMap((id) => {
			const light = this.lightState.find((entry) => entry.id === id);

			return light ? [light] : [];
		});
	}

	private update(id: string, change: (light: StudioLight) => void): void {
		const light = this.lightState.find((entry) => entry.id === id);

		if (!light) {
			return;
		}

		change(light);
	}

	private toggleGroup(group: StudioGroup | undefined): void {
		if (!group) {
			return;
		}

		const members = this.members(group.lightIds);
		const next = !members.some((light) => light.isOn);

		for (const light of members) {
			light.isOn = next;
		}
	}

	private dimGroup(group: StudioGroup | undefined, brightness: number): void {
		if (!group) {
			return;
		}

		for (const light of this.members(group.lightIds)) {
			if (light.brightness !== null) {
				light.brightness = brightness;
			}
		}
	}

	private paintGroup(group: StudioGroup | undefined, color: XyColor): void {
		if (!group) {
			return;
		}

		for (const light of this.members(group.lightIds)) {
			this.paint(light, color);
		}
	}

	private warmGroup(group: StudioGroup | undefined, mirek: number): void {
		if (!group) {
			return;
		}

		for (const light of this.members(group.lightIds)) {
			this.warm(light, mirek);
		}
	}

	private applyGroup(group: StudioGroup | undefined, preset: PresetId): void {
		const scene = areaPresets.find((entry) => entry.id === preset);

		if (!group || !scene) {
			return;
		}

		for (const light of this.members(group.lightIds)) {
			this.apply(light, scene);
		}
	}

	private paint(light: StudioLight, color: XyColor): void {
		light.color = { x: color.x, y: color.y };
		light.temperature = null;
		light.colors = [xyToHex(color)];
		light.isOn = true;
	}

	private warm(light: StudioLight, mirek: number): void {
		light.color = null;
		light.temperature = { mirek };
		light.colors = [mirekToHex(mirek)];
		light.isOn = true;
	}

	private apply(light: StudioLight, preset: AreaPreset): void {
		light.isOn = true;

		if (light.brightness !== null) {
			light.brightness = preset.brightness;
		}

		if (light.temperature && !light.color) {
			this.warm(light, preset.mirek);
			light.brightness = preset.brightness;

			return;
		}

		this.paint(light, preset.color);
		light.brightness = preset.brightness;
	}
}

function averageBrightness(lights: readonly StudioLight[]): number | null {
	const levels = lights
		.map((light) => light.brightness)
		.filter((value): value is number => value !== null);

	if (levels.length === 0) {
		return null;
	}

	return Math.round(levels.reduce((sum, value) => sum + value, 0) / levels.length);
}

function sharedColor(lights: readonly StudioLight[]): XyColor | null {
	const first = lights[0]?.color;

	if (!first) {
		return null;
	}

	const same = lights.every(
		(light) =>
			light.color !== null &&
			Math.abs(light.color.x - first.x) < 0.0001 &&
			Math.abs(light.color.y - first.y) < 0.0001
	);

	return same ? { x: first.x, y: first.y } : null;
}

function sharedTemperature(lights: readonly StudioLight[]): ColorTemperature | null {
	const first = lights[0]?.temperature?.mirek;

	if (first == null || lights.some((light) => light.color)) {
		return null;
	}

	const same = lights.every((light) => light.temperature?.mirek === first);

	return same ? { mirek: first } : null;
}
