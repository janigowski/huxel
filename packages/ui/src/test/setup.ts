import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import '@huxel/tokens/tokens.css';

afterEach(() => {
	cleanup();
});

if (typeof globalThis.CSS === 'undefined' || typeof globalThis.CSS.escape !== 'function') {
	const css = globalThis.CSS ?? {};

	Object.defineProperty(globalThis, 'CSS', {
		configurable: true,
		value: css
	});

	css.escape = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}
