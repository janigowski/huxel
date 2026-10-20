import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte({ dynamicCompileOptions: () => ({ generate: 'client' }) })],
	ssr: {
		resolve: {
			conditions: ['browser'],
			externalConditions: ['browser']
		}
	},
	test: {
		include: ['test/**/*.test.ts']
	}
});
