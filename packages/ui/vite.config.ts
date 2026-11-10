import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['src/**/*.test.tsx'],
		setupFiles: ['src/test/setup.ts']
	}
});
