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
			'apps/svelte-hue-app/.svelte-kit',
			'apps/svelte-hue-app/build',
			'apps/svelte-hue-app/static',
			'apps/svelte-hue-app/project.inlang',
			'apps/svelte-hue-app/src/lib/paraglide',
			'packages/design-system/.svelte-kit',
			'apps/extension-hue-app/.e2e',
			'packages/hue-sdk/docs/clip-v2'
		],
		overrides: [
			{
				files: ['packages/design-system/**', 'apps/extension-hue-app/**'],
				options: { svelte: true }
			},
			{
				files: ['apps/svelte-hue-app/**'],
				options: {
					svelte: true,
					sortTailwindcss: {
						stylesheet: './apps/svelte-hue-app/src/routes/layout.css'
					}
				}
			}
		]
	}
});
