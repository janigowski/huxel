import type { SvelteLight } from 'hue-app/svelte';
import { page } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { palette } from '../src/palette';
import LightGrid from '../src/components/LightGrid.svelte';

const red = palette.find((entry) => entry.name === 'Red')!;
const blue = palette.find((entry) => entry.name === 'Blue')!;

function light(overrides: Partial<SvelteLight> = {}): SvelteLight {
	return { id: 'desk', name: 'Desk', isOn: true, brightness: 50, color: red.xy, ...overrides };
}

async function renderGrid(lights: SvelteLight[]) {
	const onchangecolor = vi.fn();
	const props = { lights, ontoggle: vi.fn(), ondim: vi.fn(), onchangecolor };
	const screen = await render(LightGrid, props);

	return { onchangecolor, rerender: (next: SvelteLight[]) => screen.rerender({ lights: next }) };
}

describe('LightGrid color editing', () => {
	it('opens a modal for the clicked light and changes its color', async () => {
		const { onchangecolor } = await renderGrid([
			light(),
			light({ id: 'lamp', name: 'Lamp', color: blue.xy })
		]);

		await page.getByRole('button', { name: 'Lamp color: Blue' }).click();

		const dialog = page.getByRole('dialog', { name: 'Lamp color' });

		await expect.element(dialog).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Blue' })).toBeChecked();

		await page.getByText('Red', { exact: true }).last().click();

		expect(onchangecolor).toHaveBeenCalledWith('lamp', red.xy);
	});

	it('disables the color label when the light is off and hides it without color support', async () => {
		await renderGrid([light({ isOn: false }), light({ id: 'plug', name: 'Plug', color: null })]);

		await expect.element(page.getByRole('button', { name: 'Desk color: Red' })).toBeDisabled();
		expect(page.getByRole('button', { name: /Plug color/ }).elements()).toHaveLength(0);
	});

	it('stays modal when the lights are reordered', async () => {
		const desk = light();
		const lamp = light({ id: 'lamp', name: 'Lamp' });
		const { rerender } = await renderGrid([desk, lamp]);

		await page.getByRole('button', { name: 'Desk color: Red' }).click();
		await expect.element(page.getByRole('dialog')).toBeVisible();

		await rerender([lamp, desk]);

		expect(page.getByRole('dialog').element().matches(':modal')).toBe(true);
	});

	it('closes when the edited light turns off', async () => {
		const { rerender } = await renderGrid([light()]);

		await page.getByRole('button', { name: 'Desk color: Red' }).click();
		await expect.element(page.getByRole('dialog')).toBeVisible();

		await rerender([light({ isOn: false })]);

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
