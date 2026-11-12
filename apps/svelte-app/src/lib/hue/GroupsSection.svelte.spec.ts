import { page } from 'vite-plus/test/browser';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import GroupsSection from './GroupsSection.svelte';

const living = {
	id: 'living',
	name: 'Living room',
	isOn: true,
	brightness: 40,
	color: { x: 0.64, y: 0.33 },
	temperature: null,
	colors: ['#ff0000']
};

describe('GroupsSection', () => {
	it('shows a loading notice while the group list is empty', async () => {
		await render(GroupsSection, {
			title: 'Rooms',
			groups: [],
			loading: true,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onchangetemperature: vi.fn()
		});

		await expect.element(page.getByRole('heading', { name: 'Rooms' })).toBeVisible();
		await expect.element(page.getByText('Loading rooms…')).toBeVisible();
	});

	it('toggles a room and reports a rejected command', async () => {
		const ontoggle = vi.fn(async () => {
			throw new Error('bridge down');
		});

		await render(GroupsSection, {
			title: 'Rooms',
			groups: [living],
			loading: false,
			ontoggle,
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onchangetemperature: vi.fn()
		});

		await page.getByRole('button', { pressed: true }).click();

		expect(ontoggle).toHaveBeenCalledWith('living');
		await expect.element(page.getByRole('alert')).toHaveTextContent('bridge down');
	});

	it('opens one picker with color and temperature circles', async () => {
		await render(GroupsSection, {
			title: 'Rooms',
			groups: [
				{
					...living,
					color: null,
					temperature: { mirek: 370 },
					supportsColor: true,
					supportsTemperature: true
				}
			],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onchangetemperature: vi.fn()
		});

		const button = page.getByRole('button', { name: /Living room color/ });

		await expect.element(button).toBeVisible();
		await expect.element(page.getByRole('button', { name: /presets/ })).not.toBeInTheDocument();
		await button.click();
		await expect.element(page.getByRole('radio', { name: 'Color' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Temperature' })).toBeVisible();
		await expect.element(page.getByRole('slider', { name: 'Color temperature' })).toBeVisible();

		await page.getByRole('radio', { name: 'Color' }).click();

		await expect.element(page.getByRole('slider', { name: 'Hue and saturation' })).toBeVisible();
	});

	it('reports a rejected color command', async () => {
		const onchangecolor = vi.fn(async () => {
			throw new Error('Room "living" does not support color');
		});

		await render(GroupsSection, {
			title: 'Rooms',
			groups: [living],
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

	it('opens the color wheel when the room lights do not share one color', async () => {
		await render(GroupsSection, {
			title: 'Rooms',
			groups: [{ ...living, color: null, colors: ['#ff0000', '#0000ff'] }],
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
});
