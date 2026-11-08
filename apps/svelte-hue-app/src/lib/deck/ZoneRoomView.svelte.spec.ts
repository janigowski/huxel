import './tokens.css';
import { areaPresets, mirekToHex, xyToHex } from '@huxel/app';
import { page, userEvent } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ZoneRoomView from './ZoneRoomView.svelte';

function rgb(hex: string): string {
	const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));

	return `rgb(${channels.join(', ')})`;
}

async function renderView(
	preset: 'bright' | 'relax' | 'energize' | null = 'relax',
	onchange = vi.fn(),
	temperature = false
) {
	await render(ZoneRoomView, { open: true, name: 'Living room', preset, temperature, onchange });

	return onchange;
}

describe('ZoneRoomView', () => {
	it('opens as a modal labelled by the room or zone', async () => {
		await renderView();

		const dialog = page.getByRole('dialog', { name: 'Living room' });

		await expect.element(dialog).toBeVisible();
		expect(dialog.element().matches(':modal')).toBe(true);
	});

	it('offers Bright, Relax, and Energize', async () => {
		await renderView(null);

		expect(page.getByRole('radio').elements()).toHaveLength(3);

		for (const preset of areaPresets) {
			const radio = page.getByRole('radio', { name: preset.name });

			await expect.element(radio).toBeInTheDocument();
			await expect.element(radio).not.toBeChecked();
		}
	});

	it('checks the active preset and reports a new choice', async () => {
		const onchange = await renderView();

		await expect.element(page.getByRole('radio', { name: 'Relax' })).toBeChecked();

		await page.getByText('Bright').click();

		expect(onchange).toHaveBeenCalledWith('bright');
		await expect.element(page.getByRole('dialog')).toBeVisible();
	});

	it('closes with the close button', async () => {
		await renderView();

		await page.getByRole('button', { name: 'Close' }).click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});

	it('paints temperature presets from mirek instead of xy', async () => {
		await renderView(null, vi.fn(), true);

		const bright = areaPresets.find((preset) => preset.id === 'bright')!;
		const swatch = page
			.getByRole('radio', { name: 'Bright' })
			.element()
			.closest('label')
			?.querySelector('.swatch');

		expect(swatch).toBeInstanceOf(HTMLElement);
		expect(getComputedStyle(swatch as HTMLElement).backgroundColor).toBe(
			rgb(mirekToHex(bright.mirek))
		);
		expect(getComputedStyle(swatch as HTMLElement).backgroundColor).not.toBe(
			rgb(xyToHex(bright.color))
		);
	});

	it('closes on Escape', async () => {
		await renderView();

		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
