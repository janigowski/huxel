import { describe, expect, it } from 'vite-plus/test';
import { mirekToHex } from '../src/temperature';

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
