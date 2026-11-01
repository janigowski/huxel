import { hexToXy, type XyColor } from 'hue-app';

export interface PaletteColor {
	readonly name: string;
	readonly hex: string;
	readonly xy: XyColor;
}

const TOLERANCE = 0.01;

function define(name: string, hex: string): PaletteColor {
	return Object.freeze({ name, hex, xy: hexToXy(hex) });
}

export const palette: readonly PaletteColor[] = Object.freeze([
	define('Red', '#ff3b30'),
	define('Orange', '#ff8a1f'),
	define('Amber', '#ffbf00'),
	define('Yellow', '#ffe94d'),
	define('Lime', '#a8e635'),
	define('Green', '#2ecc71'),
	define('Cyan', '#22d3ee'),
	define('Blue', '#2f6bff'),
	define('Indigo', '#5b4bff'),
	define('Purple', '#a24bff'),
	define('Pink', '#ff4fa3'),
	define('White', '#ffffff')
]);

function distance(a: XyColor, b: XyColor): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findPaletteColor(color: XyColor | null): PaletteColor | undefined {
	if (!color) {
		return undefined;
	}

	let closest: PaletteColor | undefined;
	let closestDistance = TOLERANCE;

	for (const entry of palette) {
		const entryDistance = distance(entry.xy, color);

		if (entryDistance <= closestDistance) {
			closest = entry;
			closestDistance = entryDistance;
		}
	}

	return closest;
}
