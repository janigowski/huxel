import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';
import { palette } from '../src/ui/palette';

describe('palette', () => {
	test('matches the svelte color dialog', () => {
		const source = readFileSync(
			new URL('../../../packages/design-system/src/palette.ts', import.meta.url),
			'utf8'
		);
		const defined = [...source.matchAll(/define\('([^']+)', '(#[0-9a-f]{6})'\)/g)].map((match) => {
			const name = match[1];
			const hex = match[2];

			if (!name || !hex) {
				throw new Error('Unparsed palette entry');
			}

			return { name, hex };
		});

		expect(palette.map((color) => ({ name: color.name, hex: color.hex }))).toEqual(defined);
	});
});
