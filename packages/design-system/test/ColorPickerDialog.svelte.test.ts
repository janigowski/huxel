import { GAMUT_C, clampToGamut, hexToXy, kelvinFromMirek, xyToHsv } from '@huxel/app';
import { page, userEvent } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ColorPickerDialog from '../src/components/ColorPickerDialog.svelte';
import EchoColorPicker from './EchoColorPicker.svelte';

const red = hexToXy('#ff0000');
const narrow = { minimum: 200, maximum: 400 };

async function renderPicker(
	overrides: Partial<{
		color: { x: number; y: number } | null;
		temperature: { mirek: number | null } | null;
		brightness: number | null;
		mirekRange: { minimum: number; maximum: number } | null;
		gamut: typeof GAMUT_C | null;
	}> = {}
) {
	const oncolor = vi.fn();
	const ontemperature = vi.fn();
	const onbrightness = vi.fn();

	await render(ColorPickerDialog, {
		open: true,
		name: 'Desk',
		color: red,
		temperature: { mirek: null },
		brightness: 80,
		gamut: GAMUT_C,
		mirekRange: { minimum: 153, maximum: 500 },
		oncolor,
		ontemperature,
		onbrightness,
		...overrides
	});

	return { oncolor, ontemperature, onbrightness };
}

function wait(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function pointer(
	target: EventTarget,
	type: 'pointerdown' | 'pointermove' | 'pointerup',
	x: number,
	y: number,
	buttons: number
) {
	target.dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			pointerType: 'mouse',
			button: 0,
			buttons,
			clientX: x,
			clientY: y
		})
	);
}

describe('ColorPickerDialog', () => {
	it('opens on the current color with brightness', async () => {
		await renderPicker();

		const dialog = page.getByRole('dialog', { name: 'Desk color' });
		const wheel = page.getByRole('slider', { name: 'Hue and saturation' });

		await expect.element(dialog).toBeVisible();
		await expect.element(wheel).toHaveAttribute('aria-valuenow', '0');
		await expect.element(page.getByRole('radio', { name: 'Color' })).toBeChecked();
		await expect.element(page.getByRole('slider', { name: 'Desk brightness' })).toHaveValue('80');
		await expect
			.element(page.getByRole('slider', { name: 'Color temperature' }))
			.not.toBeInTheDocument();
	});

	it('does not change color when the pointer hovers the wheel', async () => {
		const { oncolor } = await renderPicker();
		const wheel = page.getByRole('slider', { name: 'Hue and saturation' });

		await wheel.hover();

		expect(oncolor).not.toHaveBeenCalled();
		await expect
			.element(wheel)
			.toHaveAttribute('aria-valuetext', '0 degrees, 100 percent saturation');
	});

	it('sends the color under the pointer while a drag is moving', async () => {
		const samples: { x: number; y: number }[] = [];

		await render(EchoColorPicker, {
			color: red,
			oncolor: (color: { x: number; y: number }) => {
				samples.push(color);
			}
		});

		const wheel = page.getByRole('slider', { name: 'Hue and saturation' });

		await wheel.dropTo(page.getByRole('button', { name: 'Close' }), { steps: 12 });
		await wait(200);

		const hues = samples.map((color) => Math.round(xyToHsv(color).h));
		const settled = hues.length;

		expect(settled).toBeGreaterThan(0);
		expect(hues.at(-1)).toBeGreaterThan(20);
		expect(hues.at(-1)).toBeLessThan(70);
		expect(wheel.element().getAttribute('aria-valuenow')).toBe(String(hues.at(-1)));

		await wait(200);

		expect(samples).toHaveLength(settled);
	});

	it('throttles a fast drag to the first color and the latest color', async () => {
		const { oncolor } = await renderPicker();
		const wheel = page.getByRole('slider', { name: 'Hue and saturation' });
		const rect = wheel.element().getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		pointer(wheel.element(), 'pointerdown', centerX, rect.top + 4, 1);

		for (let step = 0; step < 8; step += 1) {
			pointer(window, 'pointermove', centerX + 12 + step * 8, centerY, 1);
		}

		expect(oncolor).toHaveBeenCalledTimes(1);

		await wait(120);

		expect(oncolor).toHaveBeenCalledTimes(2);

		pointer(window, 'pointerup', centerX + 80, centerY, 0);
		await wait(200);

		expect(oncolor).toHaveBeenCalledTimes(3);
		await wait(200);
		expect(oncolor).toHaveBeenCalledTimes(3);
	});

	it('tracks a drag that ends outside the wheel', async () => {
		const { oncolor } = await renderPicker();
		const wheel = page.getByRole('slider', { name: 'Hue and saturation' });
		let moves = 0;

		wheel.element().addEventListener('pointermove', () => {
			moves += 1;
		});

		await wheel.dropTo(page.getByRole('button', { name: 'Close' }), { steps: 12 });
		await wait(200);

		expect(moves).toBeGreaterThan(5);
		expect(oncolor).toHaveBeenCalled();
		const hsv = xyToHsv(oncolor.mock.calls.at(-1)?.[0]);

		expect(hsv.s).toBeGreaterThan(0.5);
		expect(wheel.element().getAttribute('aria-valuetext')).toMatch(/100 percent saturation/);

		const afterDrag = wheel.element().getAttribute('aria-valuetext');

		await wheel.hover();

		expect(wheel.element().getAttribute('aria-valuetext')).toBe(afterDrag);
	});

	it('sends a gamut-clamped xy color while the wheel is adjusted', async () => {
		const { oncolor } = await renderPicker();

		await page.getByRole('slider', { name: 'Hue and saturation' }).click();
		await userEvent.keyboard('{ArrowRight}');

		expect(oncolor).toHaveBeenCalled();
		const color = oncolor.mock.calls.at(-1)?.[0];

		expect(color).toBeDefined();
		expect(clampToGamut(color, GAMUT_C)).toEqual(color);
		await expect.element(page.getByRole('dialog')).toBeVisible();
	});

	it('switches to the light mirek range and applies white live', async () => {
		const { ontemperature } = await renderPicker();

		await page.getByRole('radio', { name: 'Temperature' }).click();

		const slider = page.getByRole('slider', { name: 'Color temperature' });

		await expect.element(slider).toHaveAttribute('aria-valuemin', '2000');
		await expect.element(slider).toHaveAttribute('aria-valuemax', '6536');
		expect(ontemperature).toHaveBeenCalled();
		const mirek = ontemperature.mock.calls.at(-1)?.[0] as number;

		expect(mirek).toBeGreaterThanOrEqual(153);
		expect(mirek).toBeLessThanOrEqual(500);

		slider.element().focus();
		await userEvent.keyboard('{ArrowRight}');

		const cooler = ontemperature.mock.calls.at(-1)?.[0] as number;

		expect(cooler).toBeLessThan(mirek);
		expect(cooler).toBeGreaterThanOrEqual(153);
	});

	it('hides color for an ambiance light and keeps its mirek span', async () => {
		await renderPicker({
			color: null,
			gamut: null,
			temperature: { mirek: 370 },
			mirekRange: narrow,
			brightness: 30
		});

		const slider = page.getByRole('slider', { name: 'Color temperature' });

		await expect.element(slider).toHaveAttribute('aria-valuenow', String(kelvinFromMirek(370)));
		await expect.element(slider).toHaveAttribute('aria-valuemin', String(kelvinFromMirek(400)));
		await expect.element(slider).toHaveAttribute('aria-valuemax', String(kelvinFromMirek(200)));
		await expect
			.element(page.getByRole('slider', { name: 'Hue and saturation' }))
			.not.toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Color' })).not.toBeInTheDocument();
	});

	it('hides white for a color-only light', async () => {
		await renderPicker({ temperature: null, mirekRange: null });

		await expect.element(page.getByRole('slider', { name: 'Hue and saturation' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Temperature' })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('slider', { name: 'Color temperature' }))
			.not.toBeInTheDocument();
	});

	it('closes from the close button', async () => {
		await renderPicker();

		await page.getByRole('button', { name: 'Close' }).click();

		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
