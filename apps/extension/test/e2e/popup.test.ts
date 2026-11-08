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

describe('extension popup', () => {
	it('renders the access step', async () => {
		const popup = collectErrors(await extension.openPopup());

		await popup.getByRole('heading', { name: 'Home Lights' }).waitFor();

		expect(await popup.getByText('Bridge access').isVisible()).toBe(true);
		expect(await popup.getByRole('button', { name: 'Allow access' }).isEnabled()).toBe(true);
		expect(await popup.getByLabel('Bridge address').inputValue()).toBe('');
		expect(await popup.getByRole('button', { name: 'Connect bridge' }).count()).toBe(0);
		expect(pageErrors).toEqual([]);
	});

	it('remembers the address while the access prompt is open', async () => {
		const popup = collectErrors(await extension.openPopup());

		await popup.getByLabel('Bridge address').fill(UNREACHABLE_HOST);
		await popup.getByRole('button', { name: `Allow access to ${UNREACHABLE_HOST}` }).click();
		await popup.getByRole('button', { name: 'Waiting for access…' }).waitFor();
		await popup.reload();

		await expect.poll(() => popup.getByLabel('Bridge address').inputValue()).toBe(UNREACHABLE_HOST);
		expect(pageErrors).toEqual([]);
	});

	it('links in two steps and maps an unreachable bridge to the certificate hint', async () => {
		await extension.grantHostAccess('https://127.0.0.1/*');

		const popup = collectErrors(await extension.openPopup());

		await popup.getByLabel('Bridge address').fill(UNREACHABLE_HOST);
		await popup.getByRole('button', { name: `Allow access to ${UNREACHABLE_HOST}` }).click();
		await popup.getByRole('button', { name: 'Connect bridge' }).click();
		await popup.getByText(/accept its certificate/).waitFor();

		expect(
			await popup.getByRole('link', { name: `Open ${UNREACHABLE_HOST}` }).getAttribute('href')
		).toBe(`https://${UNREACHABLE_HOST}/`);

		await popup.reload();
		await popup.getByRole('button', { name: 'Connect bridge' }).waitFor();

		expect(await popup.getByText(`Bridge ${UNREACHABLE_HOST}`).isVisible()).toBe(true);
		expect(pageErrors).toEqual([]);
	});

	it.runIf(realBridgeHost)('reaches a real bridge and asks for the link button', async () => {
		const host = realBridgeHost ?? '';

		await extension.acceptCertificate(`https://${host}`);
		await extension.grantHostAccess(`https://${host}/*`);

		const popup = collectErrors(await extension.openPopup());

		await popup.getByLabel('Bridge address').fill(host);
		await popup.getByRole('button', { name: `Allow access to ${host}` }).click();
		await popup.getByRole('button', { name: 'Connect bridge' }).click();
		await popup.getByText('Press the link button on the bridge, then connect again.').waitFor();

		expect(await popup.getByText(/accept its certificate/).count()).toBe(0);
		expect(pageErrors).toEqual([]);
	});
});
