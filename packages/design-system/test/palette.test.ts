import { describe, expect, it } from 'vite-plus/test';
import { findPaletteColor, palette } from '../src/palette';

describe('palette', () => {
	it('defines 12 distinct colors', () => {
		expect(palette).toHaveLength(12);

		for (const entry of palette) {
			expect(findPaletteColor(entry.xy)).toBe(entry);
		}
	});

	it('matches a color within tolerance', () => {
		const red = palette[0];

		expect(findPaletteColor({ x: red.xy.x + 0.005, y: red.xy.y - 0.005 })).toBe(red);
	});

	it('returns undefined for unknown or missing colors', () => {
		expect(findPaletteColor({ x: 0.1, y: 0.8 })).toBeUndefined();
		expect(findPaletteColor(null)).toBeUndefined();
	});
});
