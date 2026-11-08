export interface XyColor {
	readonly x: number;
	readonly y: number;
}

const HEX_PATTERN = /^#?([0-9a-f]{6})$/i;
const WHITE_POINT: XyColor = Object.freeze({ x: 0.3127, y: 0.329 });

export function hexToXy(hex: string): XyColor {
	const digits = typeof hex === 'string' ? HEX_PATTERN.exec(hex)?.[1] : undefined;

	if (digits === undefined) {
		throw new TypeError(`Expected a hex color like #rrggbb, received "${String(hex)}"`);
	}

	const r = linearChannel(digits, 0);
	const g = linearChannel(digits, 2);
	const b = linearChannel(digits, 4);
	const x = 0.4124 * r + 0.3576 * g + 0.1805 * b;
	const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
	const z = 0.0193 * r + 0.1192 * g + 0.9505 * b;
	const sum = x + y + z;

	if (sum === 0) {
		return WHITE_POINT;
	}

	return Object.freeze({ x: round(x / sum), y: round(y / sum) });
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
