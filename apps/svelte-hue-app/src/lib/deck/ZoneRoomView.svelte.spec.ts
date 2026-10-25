import './tokens.css';
import { areaPresets } from 'hue-app';
import { page, userEvent } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ZoneRoomView from './ZoneRoomView.svelte';

async function renderView(
	preset: 'bright' | 'relax' | 'energize' | null = 'relax',
	onchange = vi.fn()
) {
	await render(ZoneRoomView, { open: true, name: 'Living room', preset, onchange });

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

	it('closes on Escape', async () => {
		await renderView();

		await userEvent.keyboard('{Escape}');

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
