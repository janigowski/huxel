import { describe, expect, test } from 'bun:test';
import type { DiscoveredBridge } from '@huxel/client';
import { bridgeBaseUrl, BridgeNotFoundError, resolveBridge } from '../src/bridge/resolve-bridge';
import type { Config, ConfigStore } from '../src/config/config-store';

function memoryStore(initial?: Config): ConfigStore & { saved: Config[] } {
	let config = initial;
	const saved: Config[] = [];
	return {
		saved,
		load: async () => config,
		save: async (next) => {
			config = next;
			saved.push(next);
		}
	};
}

function discovery(bridges: DiscoveredBridge[]) {
	let calls = 0;
	return {
		get calls() {
			return calls;
		},
		discover: async () => {
			calls += 1;
			return bridges;
		}
	};
}

const configured: Config = { bridge: { id: 'configured', ip: '10.0.0.2' }, appKey: 'key' };
const discovered: DiscoveredBridge = { id: 'DISCOVERED', internalipaddress: '10.0.0.3', port: 443 };

describe('resolveBridge', () => {
	test('prefers the environment over config and discovery', async () => {
		const probe = discovery([discovered]);

		const session = await resolveBridge({
			env: { HUE_BRIDGE_IP: '10.0.0.1', HUE_BRIDGE_ID: 'ENV' },
			store: memoryStore(configured),
			discover: probe.discover
		});

		expect(session).toEqual({ bridge: { id: 'env', ip: '10.0.0.1' }, appKey: undefined });
		expect(probe.calls).toBe(0);
	});

	test('keeps the stored app key when the environment names the configured bridge', async () => {
		const session = await resolveBridge({
			env: { HUE_BRIDGE_IP: '10.0.0.9', HUE_BRIDGE_ID: 'CONFIGURED' },
			store: memoryStore(configured),
			discover: discovery([]).discover
		});

		expect(session).toEqual({ bridge: { id: 'configured', ip: '10.0.0.9' }, appKey: 'key' });
	});

	test('uses the config before discovery', async () => {
		const probe = discovery([discovered]);

		const session = await resolveBridge({
			env: {},
			store: memoryStore(configured),
			discover: probe.discover
		});

		expect(session).toEqual({ bridge: configured.bridge, appKey: 'key' });
		expect(probe.calls).toBe(0);
	});

	test('discovers the first bridge and remembers it', async () => {
		const store = memoryStore();

		const session = await resolveBridge({
			env: {},
			store,
			discover: discovery([discovered, { id: 'other', internalipaddress: '10.0.0.4' }]).discover
		});

		expect(session).toEqual({
			bridge: { id: 'discovered', ip: '10.0.0.3', port: 443 },
			appKey: undefined
		});
		expect(store.saved).toEqual([{ bridge: { id: 'discovered', ip: '10.0.0.3', port: 443 } }]);
	});

	test('fails with a hint when no bridge is found', async () => {
		const result = resolveBridge({
			env: {},
			store: memoryStore(),
			discover: discovery([]).discover
		});

		await expect(result).rejects.toBeInstanceOf(BridgeNotFoundError);
		await expect(result).rejects.toThrow('HUE_BRIDGE_IP and HUE_BRIDGE_ID');
	});

	test('fails when only one environment variable is set', async () => {
		const result = resolveBridge({
			env: { HUE_BRIDGE_IP: '10.0.0.1' },
			store: memoryStore(),
			discover: discovery([]).discover
		});

		await expect(result).rejects.toBeInstanceOf(BridgeNotFoundError);
	});
});

describe('bridgeBaseUrl', () => {
	test('adds the port only when known', () => {
		expect(bridgeBaseUrl({ id: 'a', ip: '10.0.0.1' })).toBe('https://10.0.0.1');
		expect(bridgeBaseUrl({ id: 'a', ip: '10.0.0.1', port: 8443 })).toBe('https://10.0.0.1:8443');
	});
});
