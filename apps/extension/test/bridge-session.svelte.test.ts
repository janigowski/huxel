import type { DiscoveredBridge } from '@huxel/client';
import { describe, expect, it } from 'vite-plus/test';
import { SimulatedGateway } from '../src/preview/simulated-gateway';
import { BridgeSession } from '../src/session/bridge-session.svelte';
import {
	BRIDGE_HOST,
	BRIDGE_ORIGIN,
	deferred,
	discoveredBridge,
	FakeBridge,
	LIGHTS,
	linkedBridgeStorage
} from './fakes';

async function linkedSession(gateways: SimulatedGateway[]) {
	const bridge = new FakeBridge({
		storage: linkedBridgeStorage(),
		granted: [BRIDGE_ORIGIN],
		gateways
	});
	const session = new BridgeSession(bridge.dependencies);

	await session.restore();
	await session.app?.initialize();

	return { bridge, session };
}

describe('BridgeSession', () => {
	it('ignores connect and allow access while discovery is running', async () => {
		const discovery = deferred<DiscoveredBridge[]>();
		const bridge = new FakeBridge({
			storage: { draftHost: BRIDGE_HOST },
			granted: [BRIDGE_ORIGIN],
			discovery: () => discovery.promise
		});
		const session = new BridgeSession(bridge.dependencies);

		await session.restore();

		const discovering = session.discover();

		await session.connect();
		await session.allowAccess();

		expect(bridge.registrationOrigins).toEqual([]);
		expect(bridge.hostAccess.requests).toEqual([]);

		discovery.resolve([discoveredBridge()]);
		await discovering;

		expect(session.busy).toBe(false);
	});

	it('registers once when connect is called twice', async () => {
		const registration = deferred<string>();
		const bridge = new FakeBridge({
			storage: { draftHost: BRIDGE_HOST },
			granted: [BRIDGE_ORIGIN],
			registrations: [registration.promise]
		});
		const session = new BridgeSession(bridge.dependencies);

		await session.restore();

		const first = session.connect();
		const second = session.connect();

		registration.resolve('app-key');
		await Promise.all([first, second]);

		expect(bridge.registrationOrigins).toEqual([BRIDGE_ORIGIN]);
		expect(session.status).toBe('linked');
	});

	it('keeps an address typed while discovery was running', async () => {
		const discovery = deferred<DiscoveredBridge[]>();
		const bridge = new FakeBridge({ discovery: () => discovery.promise });
		const session = new BridgeSession(bridge.dependencies);

		await session.restore();

		const discovering = session.discover();

		session.hostInput = '10.0.0.7';
		discovery.resolve([discoveredBridge()]);
		await discovering;

		expect(session.hostInput).toBe('10.0.0.7');
	});

	it('reports a synchronous host access failure instead of throwing', async () => {
		const bridge = new FakeBridge();
		const session = new BridgeSession({
			...bridge.dependencies,
			hostAccess: {
				contains: async () => false,
				request: () => {
					throw new Error('Invalid match pattern');
				}
			}
		});

		await session.restore();
		session.hostInput = BRIDGE_HOST;
		await session.allowAccess();

		expect(session.error?.message).toBe('Invalid match pattern');
		expect(session.busy).toBe(false);
	});

	it('disposes the previous app on reconnect', async () => {
		const first = new SimulatedGateway(LIGHTS);
		const second = new SimulatedGateway(LIGHTS);
		const { session } = await linkedSession([first, second]);

		await expect.poll(() => first.watcherCount).toBe(1);

		await session.reconnect();
		await session.app?.initialize();

		expect(first.watcherCount).toBe(0);
		await expect.poll(() => second.watcherCount).toBe(1);
	});

	it('disposes the app when the bridge is forgotten', async () => {
		const gateway = new SimulatedGateway(LIGHTS);
		const { session } = await linkedSession([gateway]);

		await expect.poll(() => gateway.watcherCount).toBe(1);

		await session.forget();

		expect(gateway.watcherCount).toBe(0);
		expect(session.app).toBeNull();
		expect(session.linkHost).toBe(BRIDGE_HOST);
	});
});
