import './tokens.css';
import { palette } from '@huxel/design-system';
import type { SvelteArea } from '@huxel/app/svelte';
import { page } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import AreaCard from './AreaCard.svelte';
import { gradientOpacity } from './readout';

const red = palette.find((entry) => entry.name === 'Red')!;

const living = {
	id: 'living',
	name: 'Living room',
	isOn: true,
	brightness: 80,
	color: red.xy,
	temperature: null,
	colors: ['#ff0000', '#0000ff']
};

async function renderCard(area: SvelteArea = living) {
	await render(AreaCard, {
		area,
		ontoggle: vi.fn(),
		ondim: vi.fn(),
		oneditcolor: vi.fn(),
		oneditpresets: vi.fn()
	});

	const article = page.getByRole('article').element();
	const bar = article.querySelector('[data-gradient]') as HTMLElement;

	return { article, bar };
}

describe('AreaCard', () => {
	it('paints child colors as a 14px bar along the card', async () => {
		const { article, bar } = await renderCard();
		const style = getComputedStyle(bar);

		expect(style.width).toBe('14px');
		expect(bar.clientHeight).toBe(article.clientHeight);
		expect(bar.style.getPropertyValue('--stops')).toBe('#ff0000, #0000ff');
		expect(style.backgroundImage).toBe('linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))');
		expect(bar.style.opacity).toBe(String(gradientOpacity(true, 80)));
	});

	it('keeps the same bar when the room is off', async () => {
		const { bar } = await renderCard({ ...living, isOn: false, brightness: 10 });

		expect(getComputedStyle(bar).width).toBe('14px');
		expect(bar.style.opacity).toBe(String(gradientOpacity(false, 10)));
	});

	it('offers presets when the room can take color and brightness', async () => {
		await renderCard();

		await expect
			.element(page.getByRole('button', { name: 'Living room presets, Custom' }))
			.toBeVisible();
	});

	it('names the active preset from mirek when the room has no xy color', async () => {
		await renderCard({
			...living,
			color: null,
			brightness: 57,
			temperature: { mirek: 447 },
			colors: ['#ff942b']
		});

		await expect
			.element(page.getByRole('button', { name: 'Living room presets, Relax' }))
			.toBeVisible();
	});

	it('offers presets when the room has no grouped color', async () => {
		await renderCard({ ...living, color: null, colors: ['#ffe94d'] });

		await expect
			.element(page.getByRole('button', { name: 'Living room presets, Custom' }))
			.toBeVisible();
	});

	it('hatches the bar when the room has no child colors', async () => {
		const { bar } = await renderCard({ ...living, colors: [] });

		expect(bar.className).toContain('empty');
		expect(getComputedStyle(bar).backgroundImage).toContain('repeating-linear-gradient');
		expect(getComputedStyle(bar).width).toBe('14px');
	});
});
