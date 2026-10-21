import { describe, expect, it } from 'vitest';
import { BridgeConnection, type AppKeyStorage } from './connection.svelte';

function memoryStorage(entries: Record<string, string> = {}): AppKeyStorage {
	const values = new Map(Object.entries(entries));

	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => {
			values.set(key, value);
		}
	};
}

describe('BridgeConnection', () => {
	it('stays unlinked without a stored application key', () => {
		const connection = new BridgeConnection(memoryStorage());

		expect(connection.appKey).toBe('');
		expect(connection.app).toBeNull();
	});

	it('restores the application key from storage', () => {
		const connection = new BridgeConnection(memoryStorage({ 'hue-app-key': 'stored-key' }));

		expect(connection.appKey).toBe('stored-key');
		expect(connection.app).not.toBeNull();

		connection.app?.dispose();
	});
});
