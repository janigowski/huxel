import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type BrowserContext, type Page } from 'playwright';

export const APP_ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const EXTENSION_DIR = join(APP_ROOT, '.e2e', 'extension');

interface ExtensionsPageChrome {
	developerPrivate: {
		addHostPermission(extensionId: string, host: string): Promise<void>;
	};
}

export interface LoadedExtension {
	readonly context: BrowserContext;
	readonly id: string;
	openPopup(): Promise<Page>;
	grantHostAccess(pattern: string): Promise<void>;
	acceptCertificate(origin: string): Promise<void>;
	close(): Promise<void>;
}

export function unpackedExtensionId(path: string): string {
	const hash = createHash('sha256').update(realpathSync(path)).digest('hex').slice(0, 32);

	return [...hash].map((digit) => String.fromCharCode(97 + parseInt(digit, 16))).join('');
}

export async function launchExtension(): Promise<LoadedExtension> {
	const profile = await mkdtemp(join(tmpdir(), 'hue-extension-'));
	const context = await chromium.launchPersistentContext(profile, {
		channel: 'chromium',
		headless: true,
		args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`]
	});
	const id = unpackedExtensionId(EXTENSION_DIR);

	return {
		context,
		id,
		async openPopup() {
			const popup = await context.newPage();

			await popup.goto(`chrome-extension://${id}/popup.html`);

			return popup;
		},
		async grantHostAccess(pattern) {
			const extensionsPage = await context.newPage();

			await extensionsPage.goto('chrome://extensions');
			await extensionsPage.evaluate(
				([extensionId, host]) =>
					(
						globalThis as unknown as { chrome: ExtensionsPageChrome }
					).chrome.developerPrivate.addHostPermission(extensionId, host),
				[id, pattern] as const
			);
			await extensionsPage.close();
		},
		async acceptCertificate(origin) {
			const tab = await context.newPage();

			await tab.goto(origin).catch(() => undefined);
			await tab.locator('#details-button').click();
			await tab.locator('#proceed-link').click();
			await tab.waitForURL(`${origin}/**`);
			await tab.close();
		},
		async close() {
			await context.close();
			await rm(profile, { recursive: true, force: true });
		}
	};
}
