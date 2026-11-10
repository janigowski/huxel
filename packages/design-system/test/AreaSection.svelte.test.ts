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
			onchangecolor: vi.fn()
		});

		const living = page.getByRole('button', { name: 'Living room, On' }).element().closest('article');
		const kitchen = page
			.getByRole('button', { name: 'Kitchen, Off' })
			.element()
			.closest('article');

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
});
