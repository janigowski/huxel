import { describe, expect, it } from 'vite-plus/test';
import {
	GAMUT_C,
	clampToGamut,
	gamutForType,
	hexToXy,
	hsvToXy,
	rgbToXy,
	xyToHex,
	xyToHsv
} from '../src/index';

function channels(hex: string): number[] {
	return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

describe('hexToXy', () => {
	it.each([
		['#ff0000', 0.64, 0.33],
		['#00ff00', 0.3, 0.6],
		['#0000ff', 0.15, 0.06],
		['#ffffff', 0.3127, 0.329]
	])('converts %s to the sRGB primaries and white point', (hex, x, y) => {
		const color = hexToXy(hex);

		expect(color.x).toBeCloseTo(x, 3);
		expect(color.y).toBeCloseTo(y, 3);
	});

	it('accepts hex without a hash and in any case', () => {
		expect(hexToXy('FF8000')).toEqual(hexToXy('#ff8000'));
		expect(hexToXy('#Ff8000')).toEqual(hexToXy('#ff8000'));
	});

	it('rounds to 4 decimals like the bridge', () => {
		const { x, y } = hexToXy('#ff0000');

		expect(x).toBe(0.6401);
		expect(y).toBe(0.33);
	});

	it('returns the D65 white point for black', () => {
		expect(hexToXy('#000000')).toEqual({ x: 0.3127, y: 0.329 });
	});

	it('returns frozen colors', () => {
		expect(Object.isFrozen(hexToXy('#ff0000'))).toBe(true);
		expect(Object.isFrozen(hexToXy('#000000'))).toBe(true);
	});

	it.each(['', '#fff', 'ff00000', '#gg0000', 'red', '# ff0000', undefined as unknown as string])(
		'throws a TypeError for invalid hex %j',
		(hex) => {
			expect(() => hexToXy(hex)).toThrow(TypeError);
		}
	);
});

describe('xyToHex', () => {
	it('converts the primaries and white point to lowercase hex', () => {
		expect(xyToHex({ x: 0.64, y: 0.33 })).toBe('#ff0000');
		expect(xyToHex({ x: 0.3, y: 0.6 })).toBe('#00ff00');
		expect(xyToHex({ x: 0.15, y: 0.06 })).toBe('#0000ff');
		expect(xyToHex({ x: 0.3127, y: 0.329 })).toBe('#ffffff');
	});

	it('normalizes so the brightest channel is full', () => {
		expect(xyToHex(hexToXy('#800000'))).toBe('#ff0000');
	});

	it('clamps colors outside the sRGB gamut', () => {
		expect(xyToHex({ x: 0.7, y: 0.3 })).toMatch(/^#ff[0-9a-f]{4}$/);
		expect(xyToHex({ x: 0.17, y: 0.7 })).toMatch(/^#[0-9a-f]{2}ff[0-9a-f]{2}$/);
	});

	it('returns black when y is zero', () => {
		expect(xyToHex({ x: 0.5, y: 0 })).toBe('#000000');
	});

	it.each([
		'#ff0000',
		'#00ff00',
		'#0000ff',
		'#ffff00',
		'#ff8000',
		'#8000ff',
		'#ff0080',
		'#80ff00',
		'#0080ff'
	])('round trips saturated %s within 1 per channel', (hex) => {
		const result = channels(xyToHex(hexToXy(hex)));

		channels(hex).forEach((expected, index) => {
			expect(Math.abs((result[index] ?? -1) - expected)).toBeLessThanOrEqual(1);
		});
	});
});

describe('rgb and hsv to xy', () => {
	it.each([
		['#ff0000', 0, 1],
		['#00ff00', 120, 1],
		['#0000ff', 240, 1],
		['#ffffff', 0, 0]
	])('matches hexToXy for %s', (hex, hue, saturation) => {
		expect(rgbToXy(...bytes(hex))).toEqual(hexToXy(hex));
		expect(hsvToXy({ h: hue, s: saturation })).toEqual(hexToXy(hex));
	});

	it('reads a wheel position back from xy', () => {
		expect(xyToHsv(hexToXy('#ff0000'))).toEqual({ h: 0, s: 1 });
		expect(xyToHsv(hexToXy('#00ff00')).h).toBeCloseTo(120, 5);
		expect(xyToHsv(hexToXy('#0000ff')).h).toBeCloseTo(240, 5);
		expect(xyToHsv(hexToXy('#ffffff')).s).toBe(0);
	});

	it('keeps gamut vertices and pulls outside colors onto the triangle', () => {
		expect(clampToGamut(GAMUT_C.red, GAMUT_C)).toEqual(GAMUT_C.red);
		expect(clampToGamut(GAMUT_C.green, GAMUT_C)).toEqual(GAMUT_C.green);
		expect(clampToGamut(GAMUT_C.blue, GAMUT_C)).toEqual(GAMUT_C.blue);

		const outside = { x: 0.01, y: 0.01 };
		const clamped = clampToGamut(outside, GAMUT_C);

		expect(clamped).not.toEqual(outside);
		expect(clampToGamut(clamped, GAMUT_C)).toEqual(clamped);
		expect(clamped.x).toBeGreaterThanOrEqual(0);
		expect(clamped.y).toBeGreaterThanOrEqual(0);
	});

	it('clamps rgb that falls outside a narrow gamut', () => {
		const narrow = {
			red: { x: 0.5, y: 0.4 },
			green: { x: 0.4, y: 0.5 },
			blue: { x: 0.3, y: 0.3 }
		};
		const open = rgbToXy(255, 0, 0);
		const closed = rgbToXy(255, 0, 0, narrow);

		expect(closed).not.toEqual(open);
		expect(clampToGamut(closed, narrow)).toEqual(closed);
	});

	it('maps Hue gamut letters and ignores unknown types', () => {
		expect(gamutForType('A')?.red).toEqual({ x: 0.704, y: 0.296 });
		expect(gamutForType('B')?.blue).toEqual({ x: 0.167, y: 0.04 });
		expect(gamutForType('C')).toBe(GAMUT_C);
		expect(gamutForType('other')).toBeNull();
		expect(gamutForType(undefined)).toBeNull();
	});
});

function bytes(hex: string): [number, number, number] {
	return [
		parseInt(hex.slice(1, 3), 16),
		parseInt(hex.slice(3, 5), 16),
		parseInt(hex.slice(5, 7), 16)
	];
}
