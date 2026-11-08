import { createCliRenderer } from '@opentui/core';
import { createRoot } from '@opentui/react';
import { discoverBridges } from '@huxel/client';
import { createConfigStore, defaultConfigPath } from './config/config-store';
import { createConnection } from './connection';
import { App } from './ui/App';

const connection = createConnection({
	env: process.env,
	store: createConfigStore(defaultConfigPath()),
	discover: () => discoverBridges()
});

const renderer = await createCliRenderer({ exitOnCtrlC: false });

try {
	createRoot(renderer).render(<App connection={connection} onQuit={() => renderer.destroy()} />);
} catch (error) {
	renderer.destroy();
	await renderer.closed;
	throw error;
}

await renderer.closed;
process.exit(0);
