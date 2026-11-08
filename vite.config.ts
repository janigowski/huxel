import { defineConfig } from 'vite-plus';

export default defineConfig({
	fmt: {
		useTabs: true,
		singleQuote: true,
		trailingComma: 'none',
		printWidth: 100,
		sortPackageJson: false,
		ignorePatterns: [
			'bun.lock',
			'dist',
			'coverage',
			'apps/svelte-app/.svelte-kit',
			'apps/svelte-app/build',
			'apps/svelte-app/static',
			'apps/svelte-app/project.inlang',
			'apps/svelte-app/src/lib/paraglide',
			'packages/design-system/.svelte-kit',
			'apps/extension/.e2e',
			'packages/client/docs/clip-v2'
		],
		overrides: [
			{
				files: ['packages/design-system/**', 'apps/extension/**'],
				options: { svelte: true }
			},
			{
				files: ['apps/svelte-app/**'],
				options: {
					svelte: true,
					sortTailwindcss: {
						stylesheet: './apps/svelte-app/src/routes/layout.css'
					}
				}
			}
		]
	}
});
