import type { SvelteArea } from '@huxel/app/svelte';
import { page } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import AreaSection from '../src/components/AreaSection.svelte';

function area(overrides: Partial<SvelteArea> & Pick<SvelteArea, 'id' | 'name'>): SvelteArea {
	return {
		isOn: true,
		brightness: 40,
		color: { x: 0.5, y: 0.4 },
		temperature: null,
		colors: [],
		...overrides
	};
}

describe('AreaSection', () => {
	it('keeps every area on its own row, in the order given', async () => {
		await render(AreaSection, {
			title: 'Rooms',
			areas: [
				area({ id: 'living', name: 'Living room' }),
				area({ id: 'kitchen', name: 'Kitchen', isOn: false })
			],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onchangetemperature: vi.fn()
		});

		const living = page
			.getByRole('button', { name: 'Living room, On' })
			.element()
			.closest('article');
		const kitchen = page.getByRole('button', { name: 'Kitchen, Off' }).element().closest('article');

		if (!living || !kitchen) {
			throw new Error('Missing area row');
		}

		const first = living.getBoundingClientRect();
		const second = kitchen.getBoundingClientRect();
		const name = living.querySelector('p')?.getBoundingClientRect();
		const slider = living.querySelector('input')?.getBoundingClientRect();

		if (!name || !slider) {
			throw new Error('Missing row controls');
		}

		expect(first.left).toBe(second.left);
		expect(first.top).toBeLessThan(second.top);
		expect(Math.abs(name.top - slider.top)).toBeLessThan(8);
	});

	it('opens one picker with color and temperature circles', async () => {
		await render(AreaSection, {
			title: 'Rooms',
			areas: [
				area({
					id: 'living',
					name: 'Living room',
					color: null,
					temperature: { mirek: 370 },
					supportsColor: true,
					supportsTemperature: true,
					colors: ['#ff942b']
				})
			],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onchangetemperature: vi.fn()
		});

		await page.getByRole('button', { name: 'Living room color, White' }).click();

		await expect.element(page.getByRole('radio', { name: 'Color' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Temperature' })).toBeVisible();
		await expect.element(page.getByRole('slider', { name: 'Color temperature' })).toBeVisible();

		await page.getByRole('radio', { name: 'Color' }).click();

		await expect.element(page.getByRole('slider', { name: 'Hue and saturation' })).toBeVisible();
	});

	it('opens the color wheel when the room lights do not share one color', async () => {
		await render(AreaSection, {
			title: 'Rooms',
			areas: [
				area({
					id: 'living',
					name: 'Living room',
					color: null,
					colors: ['#ff0000', '#0000ff']
				})
			],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onchangetemperature: vi.fn()
		});

		await page.getByRole('button', { name: 'Living room color, Custom' }).click();

		await expect.element(page.getByRole('dialog', { name: 'Living room color' })).toBeVisible();
		await expect.element(page.getByRole('slider', { name: 'Hue and saturation' })).toBeVisible();
	});

	it('reports a rejected color command', async () => {
		const onchangecolor = vi.fn(async () => {
			throw new Error('Room "living" does not support color');
		});

		await render(AreaSection, {
			title: 'Rooms',
			areas: [area({ id: 'living', name: 'Living room' })],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor,
			onchangetemperature: vi.fn()
		});

		await page.getByRole('button', { name: /Living room color/ }).click();
		await page.getByRole('slider', { name: 'Hue and saturation' }).click();

		expect(onchangecolor).toHaveBeenCalled();
		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Room "living" does not support color');
	});
});
