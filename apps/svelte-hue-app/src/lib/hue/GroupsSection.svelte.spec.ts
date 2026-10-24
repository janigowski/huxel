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
			onchangecolor: vi.fn()
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
			onchangecolor: vi.fn()
		});

		await page.getByRole('button', { pressed: true }).click();

		expect(ontoggle).toHaveBeenCalledWith('living');
		await expect.element(page.getByRole('alert')).toHaveTextContent('bridge down');
	});
});
