import type { BridgeLight } from '@huxel/app';
import {
	HueApiError,
	HueNetworkError,
	HueRateLimitError,
	type DiscoveredBridge
} from '@huxel/client';
import { describe, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import App from '../src/App.svelte';
import { SimulatedGateway } from '../src/preview/simulated-gateway';
import { BridgeSession } from '../src/session/bridge-session.svelte';
import {
	BRIDGE_HOST,
	BRIDGE_ID,
	BRIDGE_ORIGIN,
	deferred,
	discoveredBridge,
	FailingStorage,
	FakeBridge,
	linkButtonNotPressed,
	linkedBridgeStorage,
	networkError,
	UnreachableGateway
} from './fakes';

async function renderApp(bridge: FakeBridge): Promise<BridgeSession> {
	const session = new BridgeSession(bridge.dependencies);

	await session.restore();
	await render(App, { session });

	return session;
}

const allowButton = () => page.getByRole('button', { name: /^Allow access/ });
const connectButton = () => page.getByRole('button', { name: 'Connect bridge' });
const hostInput = () => page.getByLabelText('Bridge address');
const roomsHeading = () => page.getByRole('heading', { name: 'Rooms' });

describe('App', () => {
	it('looks up a bridge on its own when nothing is saved', async () => {
		let calls = 0;
		const bridge = new FakeBridge({
			discovery: async () => {
				calls += 1;
				return [];
			}
		});

		await renderApp(bridge);

		await expect.element(page.getByRole('button', { name: 'Find' })).not.toBeInTheDocument();
		expect(calls).toBe(1);
	});

	it('shows a loading state until the session is restored', async () => {
		const session = new BridgeSession(new FakeBridge().dependencies);

		await render(App, { session });

		await expect.element(page.getByText('Loading…')).toBeVisible();

		await session.restore();

		await expect.element(page.getByText('Loading…')).not.toBeInTheDocument();
		await expect.element(page.getByText('Obtaining the bridge address')).toBeVisible();
	});

	it('restores a linked bridge and shows its lights', async () => {
		let calls = 0;
		const bridge = new FakeBridge({
			storage: linkedBridgeStorage(),
			granted: [BRIDGE_ORIGIN],
			discovery: async () => {
				calls += 1;
				return [];
			}
		});

		await renderApp(bridge);

		await expect.element(page.getByRole('heading', { name: 'Home' })).toBeVisible();
		await expect.element(page.getByText(`Bridge ${BRIDGE_ID}`)).toBeVisible();
		await expect.element(roomsHeading()).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Zones' })).toBeVisible();
		await expect.element(page.getByText('All lights')).not.toBeInTheDocument();
		expect(bridge.openedWith).toEqual([{ origin: BRIDGE_ORIGIN, appKey: 'stored-key' }]);
		expect(calls).toBe(0);
	});

	it('shows obtaining the bridge address in progress, then done from discovery', async () => {
		const discovery = deferred<DiscoveredBridge[]>();
		const bridge = new FakeBridge({ discovery: () => discovery.promise });
		const session = new BridgeSession(bridge.dependencies);

		await render(App, { session });
		await session.restore();

		await expect.element(page.getByText('In progress')).toBeVisible();
		await expect.element(hostInput()).not.toBeInTheDocument();
		await expect
			.poll(() => {
				const status = document.querySelector('.status');

				return status ? getComputedStyle(status).animationName : 'none';
			})
			.not.toBe('none');

		discovery.resolve([discoveredBridge()]);

		await expect.element(page.getByText('Done')).toBeVisible();
		await expect.element(page.getByText('The address came from discovery.')).toBeVisible();
		await expect.element(hostInput()).not.toBeInTheDocument();
		await expect.element(page.getByText(`Bridge ${BRIDGE_HOST}`)).toBeVisible();
	});

	it('allows host access first, then links after the link button is pressed', async () => {
		const bridge = new FakeBridge({
			discovery: async () => [],
			registrations: [linkButtonNotPressed(), 'new-key']
		});

		await renderApp(bridge);

		await expect.element(page.getByText(/saved in this browser/)).toBeVisible();
		await expect.element(connectButton()).not.toBeInTheDocument();

		await hostInput().fill('https://192.168.1.10/');
		await expect.element(allowButton()).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Use this address' }).click();

		await expect.element(page.getByText(/connection is not private/)).toBeVisible();
		await expect.element(page.getByText(/close the tab/)).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([]);

		await allowButton().click();

		await expect.element(page.getByText('Authorizing the bridge')).toBeVisible();
		await expect.element(page.getByText(`Bridge ${BRIDGE_HOST}`)).toBeVisible();
		await expect
			.element(
				page.getByText('Press the link button on your Hue bridge, then connect within 30 seconds.')
			)
			.toBeVisible();
		await expect
			.element(page.getByText(/application key from the bridge is saved in this browser/))
			.toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([BRIDGE_ORIGIN]);
		expect(bridge.registrationOrigins).toEqual([]);

		await connectButton().click();

		await expect
			.element(page.getByText('Press the link button on the bridge, then connect again.'))
			.toBeVisible();
		await expect.element(connectButton()).toBeVisible();

		await connectButton().click();

		await expect.element(roomsHeading()).toBeVisible();
		await expect.element(page.getByText('Obtaining the bridge address')).not.toBeInTheDocument();
		await expect.element(page.getByText(BRIDGE_HOST)).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Forget bridge' })).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([BRIDGE_ORIGIN]);
		expect(bridge.registrationOrigins).toEqual([BRIDGE_ORIGIN, BRIDGE_ORIGIN]);
		expect(bridge.stored).toEqual({
			draftHost: BRIDGE_HOST,
			linkedBridge: { host: BRIDGE_HOST, appKey: 'new-key' }
		});
	});

	it('resumes at the link step when access was granted before the popup closed', async () => {
		const bridge = new FakeBridge({
			storage: { draftHost: BRIDGE_HOST },
			granted: [BRIDGE_ORIGIN]
		});

		await renderApp(bridge);

		await expect.element(connectButton()).toBeEnabled();
		await expect.element(page.getByText(`Bridge ${BRIDGE_HOST}`)).toBeVisible();
	});

	it('goes back to the access step to change the bridge address', async () => {
		const bridge = new FakeBridge({
			storage: { draftHost: BRIDGE_HOST },
			granted: [BRIDGE_ORIGIN]
		});

		await renderApp(bridge);
		await page.getByRole('button', { name: 'Change' }).click();

		await expect.element(hostInput()).toHaveValue(BRIDGE_HOST);
		await expect.element(connectButton()).not.toBeInTheDocument();
	});

	it('stays at the access step when access is denied', async () => {
		const bridge = new FakeBridge({ grantOnRequest: false });

		await renderApp(bridge);
		await allowButton().click();

		await expect.element(page.getByText(/Access to 192.168.1.10 was not allowed/)).toBeVisible();
		await expect.element(connectButton()).not.toBeInTheDocument();
		expect(bridge.registrationOrigins).toEqual([]);
	});

	it('keeps the discovered bridge id when the popup closes before linking', async () => {
		let calls = 0;
		const bridge = new FakeBridge({
			discovery: async () => {
				calls += 1;

				return [discoveredBridge()];
			}
		});

		await renderApp(bridge);

		await expect.element(page.getByText('The address came from discovery.')).toBeVisible();
		expect(bridge.stored.draftHost).toBe(BRIDGE_HOST);
		expect(bridge.stored.draftBridgeId).toBe(BRIDGE_ID);
		expect(calls).toBe(1);

		const resumed = new BridgeSession(bridge.dependencies);

		await resumed.restore();

		expect(calls).toBe(1);

		await resumed.allowAccess();
		await resumed.connect();

		expect(bridge.stored.linkedBridge).toEqual({
			host: BRIDGE_HOST,
			id: BRIDGE_ID,
			appKey: 'app-key'
		});
	});

	it('keeps the discovered bridge id when one bridge is found', async () => {
		const bridge = new FakeBridge();

		await renderApp(bridge);
		await allowButton().click();
		await connectButton().click();

		await expect.element(page.getByText(`Bridge ${BRIDGE_ID}`)).toBeVisible();
		expect(bridge.stored.linkedBridge).toEqual({
			host: BRIDGE_HOST,
			id: BRIDGE_ID,
			appKey: 'app-key'
		});
	});

	it('marks allow access done when the browser already granted it', async () => {
		const bridge = new FakeBridge({ granted: [BRIDGE_ORIGIN] });

		await renderApp(bridge);

		await expect.element(connectButton()).toBeEnabled();
	});

	it('asks for an address when no bridge is discovered', async () => {
		const bridge = new FakeBridge({ discovery: async () => [] });

		await renderApp(bridge);

		await expect.element(page.getByText(/No bridge found on this network/)).toBeVisible();
		await expect.element(page.getByText('Needs you').first()).toBeVisible();
		await expect.element(hostInput()).toHaveValue('');
	});

	it('asks for an address when discovery is rate limited', async () => {
		const bridge = new FakeBridge({
			discovery: () => Promise.reject(new HueRateLimitError('Too many requests', 429, []))
		});

		await renderApp(bridge);

		await expect.element(page.getByText(/Enter the bridge address instead/)).toBeVisible();
		await expect.element(hostInput()).toBeEnabled();
	});

	it('asks for an address when discovery fails', async () => {
		const bridge = new FakeBridge({
			discovery: () =>
				Promise.reject(
					new HueApiError('Hue API request GET discovery failed with status 500', 500, [])
				)
		});

		await renderApp(bridge);

		await expect.element(page.getByText(/Enter the bridge address instead/)).toBeVisible();
		await expect.element(hostInput()).toBeVisible();
	});

	it('asks for an address when the discovery service cannot be reached', async () => {
		const bridge = new FakeBridge({
			discovery: () => Promise.reject(new HueNetworkError('offline'))
		});

		await renderApp(bridge);

		await expect.element(page.getByText(/Could not reach the Hue discovery service/)).toBeVisible();
		await expect.element(hostInput()).toBeVisible();
	});

	it('lists every bridge and waits for an address when several are found', async () => {
		const bridge = new FakeBridge({
			discovery: async () => [
				discoveredBridge(),
				{ id: '001788fffe000002', internalipaddress: '192.168.1.20' }
			]
		});

		await renderApp(bridge);

		await expect.element(hostInput()).toBeVisible();
		await expect.element(page.getByText(BRIDGE_HOST)).toBeVisible();
		await expect.element(page.getByText('192.168.1.20')).toBeVisible();
		await expect.element(connectButton()).not.toBeInTheDocument();
		await expect
			.element(page.getByText('The address came from discovery.'))
			.not.toBeInTheDocument();

		await hostInput().fill('192.168.1.20');
		await page.getByRole('button', { name: 'Use this address' }).click();
		await allowButton().click();
		await connectButton().click();

		expect(bridge.stored.linkedBridge).toEqual({
			host: '192.168.1.20',
			id: '001788fffe000002',
			appKey: 'app-key'
		});
	});

	it('keeps a saved draft address and does not look up another bridge', async () => {
		let calls = 0;
		const bridge = new FakeBridge({
			storage: { draftHost: BRIDGE_HOST },
			discovery: async () => {
				calls += 1;
				return [];
			}
		});

		await renderApp(bridge);

		await expect.element(page.getByText(`Bridge ${BRIDGE_HOST}`)).toBeVisible();
		await expect.element(hostInput()).not.toBeInTheDocument();
		expect(calls).toBe(0);
	});

	it('explains how to trust the bridge and opens its address', async () => {
		const bridge = new FakeBridge();

		await renderApp(bridge);

		await expect.element(page.getByText(/connection is not private/)).toBeVisible();
		await expect
			.element(page.getByText(/choose Advanced, then Proceed, close the tab/))
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: `Open ${BRIDGE_HOST}` }))
			.toHaveAttribute('href', `${BRIDGE_ORIGIN}/`);
		await expect.element(connectButton()).not.toBeInTheDocument();
	});

	it('leaves trust open and hides the link button when the bridge does not answer', async () => {
		const bridge = new FakeBridge({
			granted: [BRIDGE_ORIGIN],
			reach: () => Promise.reject(networkError())
		});

		await renderApp(bridge);

		await expect.element(page.getByText('Trust the bridge')).toBeVisible();
		await expect.element(page.getByText(/connection is not private/)).toBeVisible();
		await expect.element(connectButton()).not.toBeInTheDocument();
	});

	it('rejects invalid and IPv6 addresses without requesting access', async () => {
		const bridge = new FakeBridge({ discovery: async () => [] });

		await renderApp(bridge);
		await hostInput().fill('192.168.1.10/api');
		await page.getByRole('button', { name: 'Use this address' }).click();

		await expect.element(page.getByText(/Enter the bridge address, for example/)).toBeVisible();

		await hostInput().fill('fe80::1');
		await page.getByRole('button', { name: 'Use this address' }).click();

		await expect.element(page.getByText(/IPv6 addresses are not supported/)).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([]);
	});

	it('shows the storage error when restoring fails', async () => {
		const bridge = new FakeBridge({ storage: new FailingStorage() });

		await renderApp(bridge);

		await expect.element(page.getByText('Storage is unavailable')).toBeVisible();
		await expect.element(hostInput()).toBeVisible();
	});

	it('forgets the linked bridge and stops its live updates', async () => {
		const bridge = new FakeBridge({ storage: linkedBridgeStorage(), granted: [BRIDGE_ORIGIN] });

		await renderApp(bridge);
		await expect.element(roomsHeading()).toBeVisible();
		await expect.poll(() => bridge.gateway.watcherCount).toBe(1);

		await page.getByRole('button', { name: 'Forget bridge' }).click();

		await expect.element(connectButton()).toBeVisible();
		await expect.element(page.getByText(`Bridge ${BRIDGE_HOST}`)).toBeVisible();
		await expect.element(page.getByText('No bridge linked')).toBeVisible();
		expect(bridge.gateway.watcherCount).toBe(0);
		expect(bridge.stored).toEqual({});
	});

	it('shows a helpful message and a retry when a linked bridge becomes unreachable', async () => {
		const bridge = new FakeBridge({
			storage: linkedBridgeStorage(),
			granted: [BRIDGE_ORIGIN],
			gateways: [new UnreachableGateway()]
		});

		await renderApp(bridge);

		await expect
			.element(page.getByText(`Could not reach the bridge at ${BRIDGE_HOST}.`, { exact: false }))
			.toBeVisible();
		await expect
			.element(page.getByRole('link', { name: `Open ${BRIDGE_HOST}` }))
			.toHaveAttribute('href', `${BRIDGE_ORIGIN}/`);
		await expect.element(page.getByText(/Network request failed/)).not.toBeInTheDocument();
		await expect.element(page.getByText('All lights')).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Retry' }).click();

		await expect.element(roomsHeading()).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
		await expect.element(page.getByText(/Could not reach the bridge/)).not.toBeInTheDocument();
	});

	it('opens one color and temperature picker for a room', async () => {
		const desk: BridgeLight = {
			id: 'desk',
			name: 'Desk',
			isOn: true,
			brightness: 40,
			color: { x: 0.4, y: 0.5 },
			temperature: { mirek: 370 },
			supportsColor: true
		};
		const gateway = new SimulatedGateway([desk], {
			rooms: [
				{
					id: 'living',
					name: 'Living room',
					serviceId: 'living-service',
					isOn: true,
					brightness: 40,
					color: null,
					temperature: { mirek: 370 },
					children: ['desk']
				}
			]
		});
		const bridge = new FakeBridge({
			storage: linkedBridgeStorage(),
			granted: [BRIDGE_ORIGIN],
			gateways: [gateway]
		});

		await renderApp(bridge);

		const button = page.getByRole('button', { name: 'Living room color, White' });

		await expect.element(button).toBeVisible();
		await button.click();
		await expect.element(page.getByRole('radio', { name: 'Color' })).toBeVisible();
		await expect.element(page.getByRole('radio', { name: 'Temperature' })).toBeVisible();
		await expect.element(page.getByRole('slider', { name: 'Color temperature' })).toBeVisible();

		await page.getByRole('radio', { name: 'Color' }).click();

		await expect.element(page.getByRole('slider', { name: 'Hue and saturation' })).toBeVisible();
	});

	it('asks to allow access again when site access was revoked', async () => {
		let calls = 0;
		const bridge = new FakeBridge({
			storage: linkedBridgeStorage(),
			discovery: async () => {
				calls += 1;
				return [];
			}
		});

		await renderApp(bridge);

		await expect.element(page.getByText(/Site access to 192.168.1.10 was removed/)).toBeVisible();
		await expect.element(page.getByRole('link', { name: /Open/ })).not.toBeInTheDocument();
		expect(bridge.openedWith).toEqual([]);

		await page.getByRole('button', { name: `Allow access to ${BRIDGE_HOST}` }).click();

		await expect.element(roomsHeading()).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([BRIDGE_ORIGIN]);
		expect(calls).toBe(0);
	});
});
