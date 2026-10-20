import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte({ dynamicCompileOptions: () => ({ generate: 'client' }) })],
	environments: {
		__vitest__: {
			optimizeDeps: {
				rolldownOptions: {
					tsconfig: false
				}
			}
		}
	},
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
