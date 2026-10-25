import './tokens.css';
import { palette } from 'design-system';
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
	colors: ['#ff0000', '#0000ff']
};

async function renderCard(area = living) {
	await render(AreaCard, {
		area,
		ontoggle: vi.fn(),
		ondim: vi.fn(),
		oneditcolor: vi.fn()
	});

	const article = page.getByRole('article').element();
	const bar = article.querySelector('[data-gradient]') as HTMLElement;

	return { article, bar };
}

describe('AreaCard', () => {
	it('paints child colors as a 14px bar across the card', async () => {
		const { article, bar } = await renderCard();
		const style = getComputedStyle(bar);

		expect(bar.clientWidth).toBe(article.clientWidth);
		expect(style.height).toBe('14px');
		expect(bar.style.getPropertyValue('--stops')).toBe('#ff0000, #0000ff');
		expect(style.backgroundImage).toContain('rgb(255, 0, 0)');
		expect(style.backgroundImage).toContain('rgb(0, 0, 255)');
		expect(style.backgroundImage).toMatch(/to right|90deg/);
		expect(bar.style.opacity).toBe(String(gradientOpacity(true, 80)));
	});

	it('keeps the same bar when the room is off', async () => {
		const { bar } = await renderCard({ ...living, isOn: false, brightness: 10 });

		expect(getComputedStyle(bar).height).toBe('14px');
		expect(bar.style.opacity).toBe(String(gradientOpacity(false, 10)));
	});

	it('hatches the bar when the room has no child colors', async () => {
		const { bar } = await renderCard({ ...living, colors: [] });

		expect(bar.className).toContain('empty');
		expect(getComputedStyle(bar).backgroundImage).toContain('repeating-linear-gradient');
		expect(getComputedStyle(bar).height).toBe('14px');
	});
});
