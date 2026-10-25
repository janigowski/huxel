import type { XyColor } from './color';

export type PresetId = 'bright' | 'relax' | 'energize';

export interface AreaPreset {
	readonly id: PresetId;
	readonly name: string;
	readonly color: XyColor;
	readonly mirek: number;
	readonly brightness: number;
}

const COLOR_TOLERANCE = 0.01;
const BRIGHTNESS_TOLERANCE = 0.5;

function define(
	id: PresetId,
	name: string,
	color: XyColor,
	mirek: number,
	brightness: number
): AreaPreset {
	return Object.freeze({
		id,
		name,
		color: Object.freeze({ x: color.x, y: color.y }),
		mirek,
		brightness
	});
}

export const areaPresets: readonly AreaPreset[] = Object.freeze([
	define('bright', 'Bright', { x: 0.4573, y: 0.4102 }, 367, 100),
	define('relax', 'Relax', { x: 0.5016, y: 0.4153 }, 447, 57),
	define('energize', 'Energize', { x: 0.3149, y: 0.325 }, 156, 80)
]);

export function areaPreset(id: string): AreaPreset | undefined {
	return areaPresets.find((preset) => preset.id === id);
}

export function findAreaPreset(
	color: XyColor | null,
	brightness: number | null,
	mirek: number | null = null
): AreaPreset | undefined {
	if (brightness === null || !Number.isFinite(brightness)) {
		return undefined;
	}

	if (color) {
		return matchColor(color, brightness);
	}

	if (mirek === null || !Number.isFinite(mirek)) {
		return undefined;
	}

	return areaPresets.find(
		(preset) =>
			preset.mirek === mirek && Math.abs(preset.brightness - brightness) <= BRIGHTNESS_TOLERANCE
	);
}

function matchColor(color: XyColor, brightness: number): AreaPreset | undefined {
	let closest: AreaPreset | undefined;
	let closestDistance = COLOR_TOLERANCE;

	for (const preset of areaPresets) {
		if (Math.abs(preset.brightness - brightness) > BRIGHTNESS_TOLERANCE) {
			continue;
		}

		const distance = Math.hypot(preset.color.x - color.x, preset.color.y - color.y);

		if (distance <= closestDistance) {
			closest = preset;
			closestDistance = distance;
		}
	}

	return closest;
}
