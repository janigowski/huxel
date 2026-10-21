import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, lazyPlugins } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
	plugins: lazyPlugins(() => [svelte()]),

	test: {
		expect: { requireAssertions: true },

		projects: [
			{
				extends: true,
				test: {
					name: 'client',

					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},

					include: ['test/**/*.svelte.test.ts']
				}
			},

			{
				test: {
					name: 'server',
					environment: 'node',
					include: ['test/**/*.test.ts'],
					exclude: ['test/**/*.svelte.test.ts']
				}
			}
		]
	}
});
