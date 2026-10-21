import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { palette } from '$lib/hue/palette';
import ColorDialog from './ColorDialog.svelte';

const red = palette.find((entry) => entry.name === 'Red')!;
const blue = palette.find((entry) => entry.name === 'Blue')!;

function renderDialog(onchange = vi.fn()) {
	render(ColorDialog, { open: true, lightName: 'Kitchen', color: red.xy, onchange });

	return onchange;
}

describe('ColorDialog', () => {
	it('opens as a modal labelled by its heading', async () => {
		renderDialog();

		const dialog = page.getByRole('dialog', { name: 'Kitchen color' });

		await expect.element(dialog).toBeVisible();
		expect(dialog.element().matches(':modal')).toBe(true);
	});

	it('exposes a named radio for every palette color', async () => {
		renderDialog();

		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(page.getByRole('radio').elements()).toHaveLength(12);

		for (const entry of palette) {
			await expect.element(page.getByRole('radio', { name: entry.name })).toBeInTheDocument();
		}
	});

	it('checks the current color', async () => {
		renderDialog();

		await expect.element(page.getByRole('radio', { name: 'Red' })).toBeChecked();
		await expect.element(page.getByRole('radio', { name: 'Blue' })).not.toBeChecked();
	});

	it('calls onchange with the chosen color and stays open', async () => {
		const onchange = renderDialog();

		await page.getByText('Blue').click();

		expect(onchange).toHaveBeenCalledWith(blue.xy);
		await expect.element(page.getByRole('dialog')).toBeVisible();
	});

	it('closes on Escape', async () => {
		renderDialog();

		const dialog = page.getByRole('dialog', { name: 'Kitchen color' });

		await expect.element(dialog).toBeVisible();
		await userEvent.keyboard('{Escape}');

		await expect.element(dialog).not.toBeInTheDocument();
	});

	it('closes with the close button', async () => {
		renderDialog();

		await page.getByRole('button', { name: 'Close' }).click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
