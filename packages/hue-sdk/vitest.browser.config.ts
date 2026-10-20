import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

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
