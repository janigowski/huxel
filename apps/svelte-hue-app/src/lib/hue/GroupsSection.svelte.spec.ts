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
			onapplypreset: vi.fn()
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
			onapplypreset: vi.fn()
		});

		await page.getByRole('button', { pressed: true }).click();

		expect(ontoggle).toHaveBeenCalledWith('living');
		await expect.element(page.getByRole('alert')).toHaveTextContent('bridge down');
	});

	it('opens presets for a room the bridge reports without a grouped color', async () => {
		await render(GroupsSection, {
			title: 'Rooms',
			groups: [{ ...living, id: 'biurko', name: 'Biurko', color: null, colors: ['#ffe94d'] }],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onapplypreset: vi.fn()
		});

		await page.getByRole('button', { name: 'Biurko presets, Custom' }).click();

		const dialog = page.getByRole('dialog', { name: 'Biurko' });

		await expect.element(dialog).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Bright' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Relax' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Energize' })).toBeInTheDocument();
	});

	it('applies a preset from the room dialog and reports a rejected command', async () => {
		const onapplypreset = vi.fn(async () => {
			throw new Error('scene rejected');
		});

		await render(GroupsSection, {
			title: 'Rooms',
			groups: [living],
			loading: false,
			ontoggle: vi.fn(),
			ondim: vi.fn(),
			onchangecolor: vi.fn(),
			onapplypreset
		});

		await page.getByRole('button', { name: 'Living room presets, Custom' }).click();
		await expect.element(page.getByRole('dialog', { name: 'Living room' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Bright' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Relax' })).toBeInTheDocument();
		await expect.element(page.getByRole('radio', { name: 'Energize' })).toBeInTheDocument();

		await page.getByText('Relax').click();

		expect(onapplypreset).toHaveBeenCalledWith('living', 'relax');
		await expect.element(page.getByRole('alert')).toHaveTextContent('scene rejected');
	});
});
