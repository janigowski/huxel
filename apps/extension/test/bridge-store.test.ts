import { describe, expect, it } from 'vite-plus/test';
import { MemoryStorage } from '../src/adapters/memory-storage';
import {
	createBridgeStore,
	DRAFT_HOST_KEY,
	LINKED_BRIDGE_KEY,
	parseLinkedBridge
} from '../src/bridge/bridge-store';

describe('parseLinkedBridge', () => {
	it('accepts a record with and without a bridge id', () => {
		expect(parseLinkedBridge({ host: '192.168.1.10', appKey: 'key' })).toEqual({
			host: '192.168.1.10',
			appKey: 'key'
		});
		expect(parseLinkedBridge({ host: '192.168.1.10', id: 'abc', appKey: 'key' })).toEqual({
			host: '192.168.1.10',
			id: 'abc',
			appKey: 'key'
		});
	});

	it('normalizes the stored host', () => {
		expect(parseLinkedBridge({ host: 'https://192.168.1.10/', appKey: 'key' })?.host).toBe(
			'192.168.1.10'
		);
	});

	it.each([
		undefined,
		null,
		'192.168.1.10',
		{ host: '192.168.1.10' },
		{ host: '192.168.1.10', appKey: '' },
		{ host: 42, appKey: 'key' },
		{ host: 'not a host/', appKey: 'key' },
		{ host: '192.168.1.10', id: 7, appKey: 'key' }
	])('rejects %j', (value) => {
		expect(parseLinkedBridge(value)).toBeNull();
	});
});

describe('createBridgeStore', () => {
	it('saves, loads and forgets the linked bridge', async () => {
		const storage = new MemoryStorage();
		const store = createBridgeStore(storage);

		await store.saveLinkedBridge({ host: '192.168.1.10', id: 'abc', appKey: 'key' });

		expect(await store.loadLinkedBridge()).toEqual({
			host: '192.168.1.10',
			id: 'abc',
			appKey: 'key'
		});

		await store.forgetLinkedBridge();

		expect(await store.loadLinkedBridge()).toBeNull();
		expect(storage.snapshot()).toEqual({});
	});

	it('ignores a corrupt linked bridge record', async () => {
		const store = createBridgeStore(new MemoryStorage({ [LINKED_BRIDGE_KEY]: { appKey: 1 } }));

		expect(await store.loadLinkedBridge()).toBeNull();
	});

	it('round trips the draft host and drops invalid values', async () => {
		const storage = new MemoryStorage();
		const store = createBridgeStore(storage);

		await store.saveDraftHost('192.168.1.10');

		expect(await store.loadDraftHost()).toBe('192.168.1.10');

		await storage.set(DRAFT_HOST_KEY, 12);

		expect(await store.loadDraftHost()).toBeNull();
	});
});
