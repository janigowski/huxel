import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
	plugins: lazyPlugins(() => [tailwindcss(), svelte()]),

	build: {
		target: 'chrome120',
		modulePreload: { polyfill: false },
		rollupOptions: {
			input: { popup: 'popup.html' }
		}
	},

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
					exclude: ['test/**/*.svelte.test.ts', 'test/e2e/**']
				}
			},

			{
				test: {
					name: 'e2e',
					environment: 'node',
					include: ['test/e2e/**/*.test.ts'],
					globalSetup: ['test/e2e/build-extension.ts'],
					testTimeout: 30_000,
					hookTimeout: 60_000
				}
			}
		]
	}
});
