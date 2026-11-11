export interface XyColor {
	readonly x: number;
	readonly y: number;
}

const HEX_PATTERN = /^#?([0-9a-f]{6})$/i;
const WHITE_POINT: XyColor = Object.freeze({ x: 0.3127, y: 0.329 });

export interface GamutTriangle {
	readonly red: XyColor;
	readonly green: XyColor;
	readonly blue: XyColor;
}

export interface HsvColor {
	readonly h: number;
	readonly s: number;
}

export const GAMUT_A: GamutTriangle = triangle(
	{ x: 0.704, y: 0.296 },
	{ x: 0.2151, y: 0.7106 },
	{ x: 0.138, y: 0.08 }
);

export const GAMUT_B: GamutTriangle = triangle(
	{ x: 0.675, y: 0.322 },
	{ x: 0.409, y: 0.518 },
	{ x: 0.167, y: 0.04 }
);

export const GAMUT_C: GamutTriangle = triangle(
	{ x: 0.6915, y: 0.3038 },
	{ x: 0.17, y: 0.7 },
	{ x: 0.1532, y: 0.0475 }
);

const GAMUT_BY_TYPE: Readonly<Record<string, GamutTriangle>> = Object.freeze({
	A: GAMUT_A,
	B: GAMUT_B,
	C: GAMUT_C
});

export function hexToXy(hex: string): XyColor {
	const digits = typeof hex === 'string' ? HEX_PATTERN.exec(hex)?.[1] : undefined;

	if (digits === undefined) {
		throw new TypeError(`Expected a hex color like #rrggbb, received "${String(hex)}"`);
	}

	return chromaticity(linearChannel(digits, 0), linearChannel(digits, 2), linearChannel(digits, 4));
}

export function xyToHex(color: XyColor): string {
	if (!(color.y > 0)) {
		return '#000000';
	}

	const x = color.x / color.y;
	const z = (1 - color.x - color.y) / color.y;
	const linear = [
		3.2406 * x - 1.5372 - 0.4986 * z,
		-0.9689 * x + 1.8758 + 0.0415 * z,
		0.0557 * x - 0.204 + 1.057 * z
	].map((channel) => Math.max(channel, 0));
	const max = Math.max(...linear);

	if (max === 0) {
		return '#000000';
	}

	return `#${linear.map((channel) => toHex(fromLinear(channel / max))).join('')}`;
}

export function sameColor(a: XyColor | null, b: XyColor | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}

	return a.x === b.x && a.y === b.y;
}

export function freezeColor(color: XyColor | null): XyColor | null {
	return color === null ? null : Object.freeze({ x: color.x, y: color.y });
}

export function isXyColor(color: unknown): color is XyColor {
	if (typeof color !== 'object' || color === null) {
		return false;
	}

	const { x, y } = color as XyColor;

	return isUnit(x) && isUnit(y);
}

export function xyColorFrom(
	xy: { readonly x?: unknown; readonly y?: unknown } | null | undefined
): XyColor | null {
	if (typeof xy?.x !== 'number' || typeof xy.y !== 'number') {
		return null;
	}

	return { x: xy.x, y: xy.y };
}

export function gamutForType(type: string | null | undefined): GamutTriangle | null {
	if (!type) {
		return null;
	}

	return GAMUT_BY_TYPE[type] ?? null;
}

export function rgbToXy(
	red: number,
	green: number,
	blue: number,
	gamut?: GamutTriangle | null
): XyColor {
	const xy = chromaticity(linearByte(red), linearByte(green), linearByte(blue));

	return gamut ? clampToGamut(xy, gamut) : xy;
}

export function hsvToXy(color: HsvColor, gamut?: GamutTriangle | null): XyColor {
	const { r, g, b } = hsvToRgb(color.h, color.s);

	return rgbToXy(r, g, b, gamut);
}

export function xyToHsv(color: XyColor): HsvColor {
	const hex = xyToHex(color);
	const red = parseInt(hex.slice(1, 3), 16) / 255;
	const green = parseInt(hex.slice(3, 5), 16) / 255;
	const blue = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(red, green, blue);
	const min = Math.min(red, green, blue);
	const delta = max - min;
	let hue = 0;

	if (delta !== 0) {
		if (max === red) {
			hue = ((green - blue) / delta) % 6;
		} else if (max === green) {
			hue = (blue - red) / delta + 2;
		} else {
			hue = (red - green) / delta + 4;
		}

		hue *= 60;

		if (hue < 0) {
			hue += 360;
		}
	}

	return Object.freeze({
		h: hue,
		s: max === 0 ? 0 : delta / max
	});
}

export function clampToGamut(color: XyColor, gamut: GamutTriangle): XyColor {
	if (insideGamut(color, gamut)) {
		return Object.freeze({ x: round(color.x), y: round(color.y) });
	}

	const edges = [
		closestPoint(gamut.red, gamut.green, color),
		closestPoint(gamut.green, gamut.blue, color),
		closestPoint(gamut.blue, gamut.red, color)
	];
	let best = edges[0] ?? color;
	let bestDistance = distanceSquared(color, best);

	for (const edge of edges.slice(1)) {
		const edgeDistance = distanceSquared(color, edge);

		if (edgeDistance < bestDistance) {
			best = edge;
			bestDistance = edgeDistance;
		}
	}

	return Object.freeze({ x: round(best.x), y: round(best.y) });
}

export function freezeGamut(gamut: GamutTriangle | null): GamutTriangle | null {
	if (gamut === null) {
		return null;
	}

	return triangle(gamut.red, gamut.green, gamut.blue);
}

export function sameGamut(a: GamutTriangle | null, b: GamutTriangle | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}

	return sameColor(a.red, b.red) && sameColor(a.green, b.green) && sameColor(a.blue, b.blue);
}

function isUnit(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function linearChannel(digits: string, offset: number): number {
	const channel = parseInt(digits.slice(offset, offset + 2), 16) / 255;

	return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function fromLinear(channel: number): number {
	return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function toHex(channel: number): string {
	const value = Math.round(Math.min(Math.max(channel, 0), 1) * 255);

	return value.toString(16).padStart(2, '0');
}

function round(value: number): number {
	return Math.round(value * 10_000) / 10_000;
}

function chromaticity(red: number, green: number, blue: number): XyColor {
	const x = 0.4124 * red + 0.3576 * green + 0.1805 * blue;
	const y = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	const z = 0.0193 * red + 0.1192 * green + 0.9505 * blue;
	const sum = x + y + z;

	if (sum === 0) {
		return WHITE_POINT;
	}

	return Object.freeze({ x: round(x / sum), y: round(y / sum) });
}

function linearByte(channel: number): number {
	const value = Math.min(255, Math.max(0, channel)) / 255;

	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function hsvToRgb(hue: number, saturation: number): { r: number; g: number; b: number } {
	const wheel = ((hue % 360) + 360) % 360;
	const chroma = Math.min(1, Math.max(0, saturation));
	const x = chroma * (1 - Math.abs(((wheel / 60) % 2) - 1));
	const match = 1 - chroma;
	let red = 0;
	let green = 0;
	let blue = 0;

	if (wheel < 60) {
		red = chroma;
		green = x;
	} else if (wheel < 120) {
		red = x;
		green = chroma;
	} else if (wheel < 180) {
		green = chroma;
		blue = x;
	} else if (wheel < 240) {
		green = x;
		blue = chroma;
	} else if (wheel < 300) {
		red = x;
		blue = chroma;
	} else {
		red = chroma;
		blue = x;
	}

	return {
		r: Math.round((red + match) * 255),
		g: Math.round((green + match) * 255),
		b: Math.round((blue + match) * 255)
	};
}

function triangle(red: XyColor, green: XyColor, blue: XyColor): GamutTriangle {
	return Object.freeze({
		red: Object.freeze({ x: red.x, y: red.y }),
		green: Object.freeze({ x: green.x, y: green.y }),
		blue: Object.freeze({ x: blue.x, y: blue.y })
	});
}

function insideGamut(color: XyColor, gamut: GamutTriangle): boolean {
	const v1 = { x: gamut.green.x - gamut.red.x, y: gamut.green.y - gamut.red.y };
	const v2 = { x: gamut.blue.x - gamut.red.x, y: gamut.blue.y - gamut.red.y };
	const q = { x: color.x - gamut.red.x, y: color.y - gamut.red.y };
	const denom = cross(v1, v2);

	if (denom === 0) {
		return false;
	}

	const s = cross(q, v2) / denom;
	const t = cross(v1, q) / denom;
	const epsilon = 1e-6;

	return s >= -epsilon && t >= -epsilon && s + t <= 1 + epsilon;
}

function closestPoint(start: XyColor, end: XyColor, color: XyColor): XyColor {
	const abx = end.x - start.x;
	const aby = end.y - start.y;
	const denom = abx * abx + aby * aby;

	if (denom === 0) {
		return start;
	}

	const t = Math.min(
		1,
		Math.max(0, ((color.x - start.x) * abx + (color.y - start.y) * aby) / denom)
	);

	return { x: start.x + abx * t, y: start.y + aby * t };
}

function cross(a: XyColor, b: XyColor): number {
	return a.x * b.y - a.y * b.x;
}

function distanceSquared(a: XyColor, b: XyColor): number {
	return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}
