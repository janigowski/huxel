import { describe, expect, it } from 'vite-plus/test';
import { clampMirek, kelvinFromMirek, mirekFromKelvin, mirekToHex } from '../src/temperature';

describe('mirekToHex', () => {
	it('maps the preset temperatures to warm, amber, and cool whites', () => {
		expect(mirekToHex(367)).toBe('#ffa859');
		expect(mirekToHex(447)).toBe('#ff942b');
		expect(mirekToHex(156)).toBe('#fffdf8');
	});

	it.each([49, 1001, 366.5, Number.NaN, '366'])('throws a TypeError for %j', (mirek) => {
		expect(() => mirekToHex(mirek as number)).toThrow(TypeError);
	});
});

describe('mirek range', () => {
	const range = { minimum: 153, maximum: 500 };

	it('clamps to the light range and rounds to an integer', () => {
		expect(clampMirek(100, range)).toBe(153);
		expect(clampMirek(900, range)).toBe(500);
		expect(clampMirek(366.6, range)).toBe(367);
		expect(clampMirek(Number.NaN, range)).toBe(153);
	});

	it('converts the usual Hue span between mirek and kelvin', () => {
		expect(kelvinFromMirek(500)).toBe(2000);
		expect(kelvinFromMirek(153)).toBe(6536);
		expect(mirekFromKelvin(2000, range)).toBe(500);
		expect(mirekFromKelvin(6500, range)).toBe(154);
		expect(mirekFromKelvin(kelvinFromMirek(370), range)).toBe(370);
	});
});
