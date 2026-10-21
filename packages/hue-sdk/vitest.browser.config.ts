import { playwright } from 'vite-plus/test/browser-playwright';
import { defineConfig } from 'vite-plus';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		exclude: ['test/**/*.node.test.ts', 'node_modules/**'],
		browser: {
			enabled: true,
			headless: true,
			screenshotFailures: false,
			provider: playwright(),
			instances: [{ browser: 'chromium' }]
		}
	}
});
