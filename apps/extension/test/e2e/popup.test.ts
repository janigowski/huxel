import type { Page } from 'playwright';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { launchExtension, type LoadedExtension } from './extension';

const UNREACHABLE_HOST = '127.0.0.1:9';
const realBridgeHost = process.env.HUE_BRIDGE_HOST;

let extension: LoadedExtension;
let pageErrors: string[];

function collectErrors(page: Page): Page {
	page.on('pageerror', (error) => pageErrors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
			pageErrors.push(message.text());
		}
	});

	return page;
}

beforeEach(async () => {
	pageErrors = [];
	extension = await launchExtension();
});

afterEach(async () => {
	await extension.close();
});

async function finishDiscovery(popup: Page): Promise<void> {
	await popup.getByText('Obtaining the bridge address').waitFor();
	await popup.getByText('In progress').waitFor({ state: 'hidden' });
}

async function showAddressField(popup: Page): Promise<void> {
	const field = popup.getByLabel('Bridge address');

	if ((await field.count()) === 0) {
		await popup.getByRole('button', { name: 'Change' }).click();
	}

	await field.waitFor();
}

describe('extension popup', () => {
	it('renders the setup checklist', async () => {
		const popup = collectErrors(await extension.openPopup());

		await popup.getByRole('heading', { name: 'Home' }).waitFor();
		await finishDiscovery(popup);

		expect(await popup.getByRole('button', { name: 'Find' }).count()).toBe(0);
		expect(await popup.getByRole('button', { name: 'Connect bridge' }).count()).toBe(0);
		expect(pageErrors).toEqual([]);
	});

	it('remembers the address while the access prompt is open', async () => {
		const popup = collectErrors(await extension.openPopup());

		await finishDiscovery(popup);
		await showAddressField(popup);
		await popup.getByLabel('Bridge address').fill(UNREACHABLE_HOST);
		await popup.getByRole('button', { name: `Allow access to ${UNREACHABLE_HOST}` }).click();
		await popup.getByRole('button', { name: 'Waiting for access…' }).waitFor();
		await popup.reload();

		await expect.poll(() => popup.getByText(`Bridge ${UNREACHABLE_HOST}`).isVisible()).toBe(true);
		expect(pageErrors).toEqual([]);
	});

	it('explains how to trust an unreachable bridge before linking', async () => {
		await extension.grantHostAccess('https://127.0.0.1/*');

		const popup = collectErrors(await extension.openPopup());

		await finishDiscovery(popup);
		await showAddressField(popup);
		await popup.getByLabel('Bridge address').fill(UNREACHABLE_HOST);
		await popup.getByRole('button', { name: `Allow access to ${UNREACHABLE_HOST}` }).click();
		await popup.getByText(/connection is not private/).waitFor();

		expect(
			await popup.getByRole('link', { name: `Open ${UNREACHABLE_HOST}` }).getAttribute('href')
		).toBe(`https://${UNREACHABLE_HOST}/`);
		expect(await popup.getByRole('button', { name: 'Connect bridge' }).count()).toBe(0);

		await popup.reload();
		await popup.getByText(`Bridge ${UNREACHABLE_HOST}`).waitFor();

		expect(await popup.getByRole('button', { name: 'Connect bridge' }).count()).toBe(0);
		expect(pageErrors).toEqual([]);
	});

	it.runIf(realBridgeHost)('reaches a real bridge and asks for the link button', async () => {
		const host = realBridgeHost ?? '';

		await extension.acceptCertificate(`https://${host}`);
		await extension.grantHostAccess(`https://${host}/*`);

		const popup = collectErrors(await extension.openPopup());
		const connect = popup.getByRole('button', { name: 'Connect bridge' });

		await finishDiscovery(popup);

		if ((await connect.count()) === 0) {
			await showAddressField(popup);
			await popup.getByLabel('Bridge address').fill(host);
			await popup.getByRole('button', { name: /Allow access/ }).click();
		}

		await connect.click();
		await popup.getByText('Press the link button on the bridge, then connect again.').waitFor();

		expect(await popup.getByText(/accept its certificate/).count()).toBe(0);
		expect(pageErrors).toEqual([]);
	});
});
