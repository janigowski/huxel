/// <reference types="vitest" />

import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import manifest from "./src/manifest.config";

export default defineConfig({
    plugins: [svelte(), crx({ manifest })],
    // HACK: https://github.com/crxjs/chrome-extension-tools/issues/696
    // https://github.com/crxjs/chrome-extension-tools/issues/746
    server: {
        port: 5173,
        strictPort: true,
        hmr: {
            clientPort: 5173,
        },
    },
    test: {
        include: ['src/**/*.{test,spec}.ts'],
        globals: true,
        environment: 'jsdom',
        setupFiles: 'vitest.setup.ts',
    },
});