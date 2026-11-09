import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tokenNames, tokenValue } from '../src/values';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('tokens', () => {
	test('resolves locked ramp and semantic colors', () => {
		expect(hex('--color-neutral-1200')).toBe('#0B0C0B');
		expect(hex('--color-neutral-1100')).toBe('#171817');
		expect(hex('--color-neutral-1000')).toBe('#222321');
		expect(hex('--color-neutral-800')).toBe('#373735');
		expect(hex('--color-neutral-400')).toBe('#ADA9A4');
		expect(hex('--color-neutral-200')).toBe('#ECE7E1');
		expect(hex('--color-brand-500')).toBe('#FF7247');
		expect(hex('--foreground-neutral-primary')).toBe('#ECE7E1');
		expect(hex('--background-default')).toBe('#0B0C0B');
		expect(hex('--focus-border')).toBe('#FF7247');
	});

	test('matches duration, easing, and space', () => {
		expect(tokenValue('--duration-short')).toBe('100ms');
		expect(tokenValue('--duration-default')).toBe('200ms');
		expect(tokenValue('--duration-long')).toBe('300ms');
		expect(tokenValue('--ease-default')).toBe('cubic-bezier(0.2, 0, 0, 1)');
		expect(tokenValue('--ease-emphasis')).toBe('cubic-bezier(0.32, 0.72, 0, 1)');

		const spaces: Record<string, string> = {
			'--space-1': '4px',
			'--space-2': '8px',
			'--space-3': '12px',
			'--space-4': '16px',
			'--space-6': '24px',
			'--space-8': '32px',
			'--space-12': '48px',
			'--space-16': '64px'
		};

		for (const [name, value] of Object.entries(spaces)) {
			expect(tokenValue(name)).toBe(value);
		}

		expect(tokenNames()).not.toContain('--space-5');
	});

	test('keeps type at 12px or larger and leaves transitions specific', () => {
		const sizes = tokenNames().filter((name) => name.startsWith('--font-size-'));

		expect(sizes.length).toBeGreaterThan(0);

		for (const name of sizes) {
			expect(Number.parseFloat(tokenValue(name))).toBeGreaterThanOrEqual(12);
		}

		expect(tokenValue('--font-sans').toLowerCase()).not.toContain('inter');

		const css = readdirSync(join(root, 'src'))
			.filter((file) => file.endsWith('.css'))
			.map((file) => readFileSync(join(root, 'src', file), 'utf8'))
			.join('\n');

		expect(css).not.toContain('transition: all');
	});

	test('meets contrast on the dark surface', () => {
		const page = tokenValue('--color-neutral-1200');

		expectContrast(tokenValue('--foreground-neutral-primary'), page, 4.5);
		expectContrast(tokenValue('--foreground-neutral-secondary'), page, 4.5);
		expectContrast(tokenValue('--color-neutral-500'), page, 4.5);
		expectContrast(page, tokenValue('--color-brand-500'), 4.5);
		expectContrast(page, tokenValue('--color-brand-400'), 4.5);
		expectContrast(page, tokenValue('--color-brand-600'), 4.5);
		expectContrast(tokenValue('--color-neutral-200'), tokenValue('--color-critical-700'), 4.5);
		expectContrast(tokenValue('--color-neutral-200'), tokenValue('--color-success-700'), 4.5);
		expectContrast(tokenValue('--color-neutral-200'), tokenValue('--color-featured-700'), 4.5);
		expectContrast(tokenValue('--color-neutral-100'), tokenValue('--color-warning-800'), 4.5);
		expectContrast(tokenValue('--color-brand-500'), page, 4.5);
		expectContrast(tokenValue('--color-critical-400'), page, 4.5);
		expectContrast(tokenValue('--color-warning-400'), page, 4.5);
		expectContrast(tokenValue('--color-success-400'), page, 4.5);
		expectContrast(tokenValue('--color-featured-400'), page, 4.5);
		expectContrast(tokenValue('--color-neutral-600'), page, 3);
	});
});

function hex(name: string): string {
	return tokenValue(name).toUpperCase();
}

function expectContrast(foreground: string, background: string, minimum: number): void {
	expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
}

function contrast(foreground: string, background: string): number {
	const lighter = Math.max(luminance(foreground), luminance(background));
	const darker = Math.min(luminance(foreground), luminance(background));

	return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
	const match = /^#([0-9A-Fa-f]{6})$/.exec(hex);

	if (match?.[1] === undefined) {
		throw new Error(`Expected a hex color, received ${hex}.`);
	}

	const digits = match[1];

	return 0.2126 * channel(digits, 0) + 0.7152 * channel(digits, 2) + 0.0722 * channel(digits, 4);
}

function channel(hex: string, offset: number): number {
	const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;

	if (value <= 0.04045) {
		return value / 12.92;
	}

	return ((value + 0.055) / 1.055) ** 2.4;
}
