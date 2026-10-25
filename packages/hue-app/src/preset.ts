import type { XyColor } from './color';

export type PresetId = 'bright' | 'relax' | 'energize';

export interface AreaPreset {
	readonly id: PresetId;
	readonly name: string;
	readonly color: XyColor;
	readonly brightness: number;
}

const COLOR_TOLERANCE = 0.01;
const BRIGHTNESS_TOLERANCE = 0.5;

function define(id: PresetId, name: string, color: XyColor, brightness: number): AreaPreset {
	return Object.freeze({
		id,
		name,
		color: Object.freeze({ x: color.x, y: color.y }),
		brightness
	});
}

export const areaPresets: readonly AreaPreset[] = Object.freeze([
	define('bright', 'Bright', { x: 0.4573, y: 0.4102 }, 100),
	define('relax', 'Relax', { x: 0.5016, y: 0.4153 }, 57),
	define('energize', 'Energize', { x: 0.3149, y: 0.325 }, 80)
]);

export function areaPreset(id: string): AreaPreset | undefined {
	return areaPresets.find((preset) => preset.id === id);
}

export function findAreaPreset(
	color: XyColor | null,
	brightness: number | null
): AreaPreset | undefined {
	if (!color || brightness === null || !Number.isFinite(brightness)) {
		return undefined;
	}

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
