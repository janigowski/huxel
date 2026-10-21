import { HueRateLimitError } from 'hue-sdk';
import { describe, expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import App from '../src/App.svelte';
import { BridgeSession } from '../src/session/bridge-session.svelte';
import {
	BRIDGE_HOST,
	BRIDGE_ID,
	BRIDGE_ORIGIN,
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
const lightToggle = (name: string) => page.getByRole('button', { name: new RegExp(`% ${name}$`) });

describe('App', () => {
	it('shows a loading state until the session is restored', async () => {
		const session = new BridgeSession(new FakeBridge().dependencies);

		await render(App, { session });

		await expect.element(page.getByText('Loading…')).toBeVisible();

		await session.restore();

		await expect.element(page.getByText('Loading…')).not.toBeInTheDocument();
		await expect.element(hostInput()).toBeVisible();
	});

	it('restores a linked bridge and shows its lights', async () => {
		const bridge = new FakeBridge({ storage: linkedBridgeStorage(), granted: [BRIDGE_ORIGIN] });

		await renderApp(bridge);

		await expect.element(page.getByRole('heading', { name: 'Home Lights' })).toBeVisible();
		await expect.element(page.getByText(`Bridge ${BRIDGE_ID}`)).toBeVisible();
		await expect.element(lightToggle('Desk')).toBeVisible();
		await expect.element(lightToggle('Lamp')).toBeVisible();
		expect(bridge.openedWith).toEqual([{ origin: BRIDGE_ORIGIN, appKey: 'stored-key' }]);
	});

	it('allows host access first, then links after the link button is pressed', async () => {
		const bridge = new FakeBridge({ registrations: [linkButtonNotPressed(), 'new-key'] });

		await renderApp(bridge);

		await expect.element(connectButton()).not.toBeInTheDocument();

		await hostInput().fill('https://192.168.1.10/');
		await allowButton().click();

		await expect.element(page.getByText(`Bridge ${BRIDGE_HOST}`)).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([BRIDGE_ORIGIN]);
		expect(bridge.registrationOrigins).toEqual([]);

		await connectButton().click();

		await expect
			.element(page.getByText('Press the link button on the bridge, then connect again.'))
			.toBeVisible();

		await connectButton().click();

		await expect.element(lightToggle('Desk')).toBeVisible();
		await expect.element(page.getByText(`Linked to ${BRIDGE_HOST}`)).toBeVisible();
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
		await hostInput().fill(BRIDGE_HOST);
		await allowButton().click();

		await expect.element(page.getByText(/Access to 192.168.1.10 was not allowed/)).toBeVisible();
		await expect.element(connectButton()).not.toBeInTheDocument();
		expect(bridge.registrationOrigins).toEqual([]);
	});

	it('fills the host from discovery and keeps the discovered bridge id', async () => {
		const bridge = new FakeBridge();

		await renderApp(bridge);
		await page.getByRole('button', { name: 'Find' }).click();

		await expect.element(hostInput()).toHaveValue(BRIDGE_HOST);

		await allowButton().click();
		await connectButton().click();

		await expect.element(page.getByText(`Bridge ${BRIDGE_ID}`)).toBeVisible();
		expect(bridge.stored.linkedBridge).toEqual({
			host: BRIDGE_HOST,
			id: BRIDGE_ID,
			appKey: 'app-key'
		});
	});

	it('skips the access step for a discovered bridge that already has access', async () => {
		const bridge = new FakeBridge({ granted: [BRIDGE_ORIGIN] });

		await renderApp(bridge);
		await page.getByRole('button', { name: 'Find' }).click();

		await expect.element(connectButton()).toBeEnabled();
	});

	it('suggests manual entry when no bridge is discovered', async () => {
		const bridge = new FakeBridge({ discovery: async () => [] });

		await renderApp(bridge);
		await page.getByRole('button', { name: 'Find' }).click();

		await expect.element(page.getByText(/No bridge found on this network/)).toBeVisible();
		await expect.element(hostInput()).toHaveValue('');
	});

	it('suggests manual entry when discovery is rate limited', async () => {
		const bridge = new FakeBridge({
			discovery: () => Promise.reject(new HueRateLimitError('Too many requests', 429, []))
		});

		await renderApp(bridge);
		await page.getByRole('button', { name: 'Find' }).click();

		await expect.element(page.getByText(/Enter the bridge address instead/)).toBeVisible();
		await expect.element(hostInput()).toBeEnabled();
	});

	it('explains how to trust the certificate when the bridge is unreachable', async () => {
		const bridge = new FakeBridge({ registrations: [networkError()] });

		await renderApp(bridge);
		await hostInput().fill(BRIDGE_HOST);
		await allowButton().click();
		await connectButton().click();

		await expect.element(page.getByText(/accept its certificate/)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: `Open ${BRIDGE_HOST}` }))
			.toHaveAttribute('href', `${BRIDGE_ORIGIN}/`);
	});

	it('rejects invalid and IPv6 addresses without requesting access', async () => {
		const bridge = new FakeBridge();

		await renderApp(bridge);
		await hostInput().fill('192.168.1.10/api');
		await allowButton().click();

		await expect.element(page.getByText(/Enter the bridge address, for example/)).toBeVisible();

		await hostInput().fill('fe80::1');
		await allowButton().click();

		await expect.element(page.getByText(/IPv6 addresses are not supported/)).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([]);
	});

	it('shows the storage error when restoring fails', async () => {
		const bridge = new FakeBridge({ storage: new FailingStorage() });

		await renderApp(bridge);

		await expect.element(page.getByText('Storage is unavailable')).toBeVisible();
		await expect.element(hostInput()).toBeVisible();
	});

	it('toggles a light', async () => {
		const bridge = new FakeBridge({ storage: linkedBridgeStorage(), granted: [BRIDGE_ORIGIN] });

		await renderApp(bridge);
		await expect.element(lightToggle('Desk')).toHaveAttribute('aria-pressed', 'false');
		await lightToggle('Desk').click();

		await expect.element(lightToggle('Desk')).toHaveAttribute('aria-pressed', 'true');
		await expect
			.poll(() => bridge.gateway.snapshot.find((light) => light.id === 'desk')?.isOn)
			.toBe(true);
	});

	it('forgets the linked bridge and stops its live updates', async () => {
		const bridge = new FakeBridge({ storage: linkedBridgeStorage(), granted: [BRIDGE_ORIGIN] });

		await renderApp(bridge);
		await expect.element(lightToggle('Desk')).toBeVisible();
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

		await expect.element(lightToggle('Desk')).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
		await expect.element(page.getByText(/Could not reach the bridge/)).not.toBeInTheDocument();
	});

	it('asks to allow access again when site access was revoked', async () => {
		const bridge = new FakeBridge({ storage: linkedBridgeStorage() });

		await renderApp(bridge);

		await expect.element(page.getByText(/Site access to 192.168.1.10 was removed/)).toBeVisible();
		await expect.element(page.getByRole('link', { name: /Open/ })).not.toBeInTheDocument();
		expect(bridge.openedWith).toEqual([]);

		await page.getByRole('button', { name: `Allow access to ${BRIDGE_HOST}` }).click();

		await expect.element(lightToggle('Desk')).toBeVisible();
		expect(bridge.hostAccess.requests).toEqual([BRIDGE_ORIGIN]);
	});
});
