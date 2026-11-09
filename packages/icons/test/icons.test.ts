import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { iconNames } from '../src/generated/names';
import { isPaintedIcon, paintedIconNames, paintedMarkup } from '../src/generated/painted';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgDir = join(root, 'src', 'svg');
const svgFiles = readdirSync(svgDir).filter((file) => file.endsWith('.svg'));
const sprite = readFileSync(join(root, 'src', 'generated', 'sprite.svg'), 'utf8');

describe('icon names', () => {
	test('every svg file has a name and every name has a file', () => {
		const stems = svgFiles.map((file) => file.slice(0, -4)).sort();

		expect(stems).toEqual([...iconNames]);
	});
});

describe('sprite', () => {
	test('contains a symbol for every non-painted name', () => {
		for (const name of iconNames) {
			if (isPaintedIcon(name)) {
				continue;
			}

			expect(sprite).toContain(`id="hx-icon-${name}"`);
		}
	});

	test('does not contain the painted spark icon', () => {
		expect(sprite).not.toContain('hx-icon-spark');
	});

	test('includes mark', () => {
		expect(sprite).toContain('id="hx-icon-mark"');
	});
});

describe('painted icons', () => {
	test('paintedMarkup interpolates the id and avoids symbol', () => {
		const markup = paintedMarkup('spark', 'spark-1');

		expect(markup).toContain('id="spark-1"');
		expect(markup).toContain('url(#spark-1)');
		expect(markup).not.toContain('<symbol');
	});

	test('paintedMarkup keeps two instances apart', () => {
		expect(paintedMarkup('spark', 'a')).not.toContain('spark-b');
		expect(paintedMarkup('spark', 'b')).toContain('url(#b)');
	});

	test('paintedMarkup rejects unknown names', () => {
		expect(() => paintedMarkup('other' as (typeof paintedIconNames)[number], 'x')).toThrow();
	});

	test('isPaintedIcon recognises spark only', () => {
		expect(isPaintedIcon('spark')).toBe(true);
		expect(isPaintedIcon('check')).toBe(false);
	});
});

describe('source files', () => {
	test('every non-mark svg is 16x16', () => {
		for (const file of svgFiles) {
			if (file === 'mark.svg') {
				continue;
			}

			expect(readFileSync(join(svgDir, file), 'utf8')).toContain('viewBox="0 0 16 16"');
		}
	});

	test('favicon mark uses the brand fill and contains the period', () => {
		const mark = readFileSync(join(root, 'src', 'mark.svg'), 'utf8');

		expect(mark).toContain('viewBox="0 0 32 32"');
		expect(mark).toContain('fill="#FF7247"');
		expect(mark).not.toContain('currentColor');
		expect(mark).not.toContain('<rect');
		expect(mark).toContain('M28.2 24.2h2.8V27h-2.8z');
	});

	test('stroke icons use no hardcoded colors', () => {
		for (const file of svgFiles) {
			expect(readFileSync(join(svgDir, file), 'utf8')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
		}
	});
});

describe('build --check', () => {
	test('exits 0 after a normal build', () => {
		const result = spawnSync(process.execPath, [join(root, 'scripts', 'build.ts'), '--check'], {
			cwd: root
		});

		expect(result.status).toBe(0);
	});
});
