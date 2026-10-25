import { describe, expect, it } from 'vite-plus/test';
import { areaPresets, findAreaPreset } from '../src/preset';

const bright = areaPresets[0]!;
const relax = areaPresets[1]!;
const energize = areaPresets[2]!;

describe('area presets', () => {
	it('offers Bright, Relax, and Energize', () => {
		expect(areaPresets.map((preset) => preset.name)).toEqual(['Bright', 'Relax', 'Energize']);
	});

	it('matches a preset only when color and brightness both agree', () => {
		expect(findAreaPreset(bright.color, bright.brightness)).toBe(bright);
		expect(findAreaPreset(relax.color, relax.brightness - 0.4)).toBe(relax);
		expect(findAreaPreset(energize.color, energize.brightness)).toBe(energize);
		expect(findAreaPreset(bright.color, relax.brightness)).toBeUndefined();
		expect(
			findAreaPreset({ x: bright.color.x + 0.02, y: bright.color.y }, bright.brightness)
		).toBeUndefined();
		expect(findAreaPreset(null, bright.brightness)).toBeUndefined();
		expect(findAreaPreset(bright.color, null)).toBeUndefined();
	});

	it('matches a temperature-only preset by mirek and brightness', () => {
		expect(findAreaPreset(null, bright.brightness, bright.mirek)).toBe(bright);
		expect(findAreaPreset(null, relax.brightness, relax.mirek)).toBe(relax);
		expect(findAreaPreset(null, energize.brightness - 0.4, energize.mirek)).toBe(energize);
		expect(findAreaPreset(null, relax.brightness, bright.mirek)).toBeUndefined();
		expect(findAreaPreset(null, bright.brightness, bright.mirek + 1)).toBeUndefined();
		expect(findAreaPreset(bright.color, relax.brightness, relax.mirek)).toBeUndefined();
	});
});
