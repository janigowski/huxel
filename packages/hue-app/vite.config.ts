import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
	plugins: lazyPlugins(() => [svelte({ dynamicCompileOptions: () => ({ generate: 'client' }) })]),

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

	pack: {
		entry: ['src/index.ts', 'src/svelte/index.ts', 'src/react/index.ts'],
		platform: 'neutral',
		unbundle: true,
		dts: true,
		publint: { level: 'suggestion', strict: true },
		failOnWarn: true
	},

	test: {
		include: ['test/**/*.test.ts']
	}
});
