import type { SvelteLight } from 'hue-app/svelte';
import { page } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { palette } from '../src/palette';
import LightGrid from '../src/components/LightGrid.svelte';

const red = palette.find((entry) => entry.name === 'Red')!;
const blue = palette.find((entry) => entry.name === 'Blue')!;

function light(overrides: Partial<SvelteLight> = {}): SvelteLight {
	return {
		id: 'desk',
		name: 'Desk',
		isOn: true,
		brightness: 50,
		color: red.xy,
		temperature: null,
		colors: [],
		...overrides
	};
}

function card(name: RegExp): HTMLElement {
	const parent = page.getByRole('button', { name }).element().parentElement;

	if (!parent) {
		throw new Error(`Missing card for ${name}`);
	}

	return parent;
}

async function renderGrid(lights: SvelteLight[]) {
	const onchangecolor = vi.fn();
	const props = { lights, ontoggle: vi.fn(), ondim: vi.fn(), onchangecolor };
	const screen = await render(LightGrid, props);

	return { onchangecolor, rerender: (next: SvelteLight[]) => screen.rerender({ lights: next }) };
}

describe('LightGrid color editing', () => {
	it('paints combined colors as a top-to-bottom gradient faded by brightness', async () => {
		await renderGrid([
			light({ brightness: 100, colors: ['#00ff00'] }),
			light({ id: 'lamp', name: 'Lamp', brightness: 0, colors: ['#ff0000', '#0000ff'] })
		]);

		const full = card(/Desk$/);
		const dim = card(/Lamp$/);

		expect(full.style.getPropertyValue('--combined-opacity')).toBe('1');
		expect(full.style.getPropertyValue('--combined-stops')).toBe('#00ff00');
		expect(dim.style.getPropertyValue('--combined-opacity')).toBe('0.05');
		expect(dim.style.getPropertyValue('--combined-stops')).toBe('#ff0000, #0000ff');

		const wash = getComputedStyle(dim, '::before');
		const mask = wash.getPropertyValue('mask-image') || wash.getPropertyValue('-webkit-mask-image');

		expect(wash.backgroundImage).toContain('rgb(255, 0, 0)');
		expect(wash.backgroundImage).toContain('rgb(0, 0, 255)');
		expect(mask.match(/15%/g)).toHaveLength(1);
		expect(mask).toContain('100%');
	});

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
