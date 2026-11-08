import { bridge } from '$lib/hue/bridge';
import { hueConnection } from '$lib/hue/connection-data';
import { page } from 'vite-plus/test/browser';
import { describe, expect, it } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import StatusBar from './StatusBar.svelte';

const originalBridge = {
	id: '001788fffe7d45eb',
	proxyPath: '/bridge'
};

describe('StatusBar', () => {
	it('reads the bridge and its connection from the data bus', async () => {
		bridge.value = { id: '001788fffe123456', proxyPath: '/bridge' };
		hueConnection.value = null;

		try {
			await render(StatusBar);

			await expect.element(page.getByRole('status')).toHaveTextContent('Not connected');
			await expect.element(page.getByText('Bridge 3456')).toBeInTheDocument();

			hueConnection.value = 'live';
			bridge.value = { id: '001788fffeabcdef', proxyPath: '/bridge' };

			const status = page.getByRole('status');
			await expect.element(status).toHaveTextContent('Live');
			await expect.element(status).toHaveClass('live');
			await expect.element(page.getByText('Bridge CDEF')).toBeInTheDocument();
		} finally {
			bridge.value = originalBridge;
			hueConnection.value = null;
		}
	});
});
