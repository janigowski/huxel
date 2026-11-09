import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('tailwind theme', () => {
	test('keeps token utilities and drops the default scale', () => {
		const dir = mkdtempSync(join(tmpdir(), 'huxel-tokens-'));
		const output = join(dir, 'out.css');
		const binary = join(root, 'node_modules', '.bin', 'tailwindcss');
		const result = spawnSync(
			binary,
			['--input', join(root, 'src', 'tailwind.css'), '--output', output, '--cwd', root],
			{ cwd: root, encoding: 'utf8' }
		);

		try {
			if (result.error) {
				throw result.error;
			}

			if (result.status !== 0) {
				throw new Error(result.stderr || result.stdout || 'tailwindcss failed');
			}

			const css = readFileSync(output, 'utf8');

			expect(css).toContain('.bg-page');
			expect(css).toContain('.p-4');
			expect(css).toContain('.text-heading-1');
			expect(css).not.toContain('.bg-red-500');
			expect(css).not.toContain('.p-5');
		} finally {
			rmSync(dir, { recursive: true, force: true });
		}
	}, 30_000);
});
