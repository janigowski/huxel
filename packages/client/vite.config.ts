import { defineConfig } from 'vite-plus';

export default defineConfig({
	pack: {
		entry: ['src/index.ts'],
		platform: 'neutral',
		unbundle: true,
		dts: true,
		publint: { level: 'suggestion', strict: true },
		failOnWarn: true
	},

	test: {
		include: ['test/**/*.test.ts'],
		typecheck: {
			include: ['test/**/*.test-d.ts'],
			tsconfig: './tsconfig.json'
		}
	}
});
