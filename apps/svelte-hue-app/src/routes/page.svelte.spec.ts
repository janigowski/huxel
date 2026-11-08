import { bridge } from '$lib/hue/bridge';
import { page } from 'vite-plus/test/browser';
import { describe, expect, it } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		bridge.value = { id: '001788fffe7d45eb', proxyPath: '/bridge' };
		await render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
		await expect.element(page.getByRole('status')).toHaveTextContent('Not connected');
		await expect.element(page.getByText('Bridge 45EB')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Rooms' })).not.toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Zones' })).not.toBeInTheDocument();
	});
});
