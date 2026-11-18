import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vite-plus/test';
import { packageEntries, packExtension } from '../scripts/pack-extension';

describe('packExtension', () => {
	const roots: string[] = [];

	afterEach(() => {
		for (const root of roots.splice(0)) {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});

	it('zips the extension with manifest.json at the root', () => {
		const root = makeExtension();
		const destination = path.join(root, 'release', 'huxel-0.1.0.zip');

		packExtension(path.join(root, 'dist'), destination);

		expect(packageEntries(destination).sort()).toEqual([
			'assets/popup.js',
			'icons/icon-128.png',
			'manifest.json',
			'popup.html'
		]);
	});

	it('rejects a required broad host permission', () => {
		const root = makeExtension({ host_permissions: ['https://*/*'] });

		expect(() => packExtension(path.join(root, 'dist'), path.join(root, 'out.zip'))).toThrow(
			/optional_host_permissions/
		);
	});

	function makeExtension(manifest: Record<string, unknown> = {}): string {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'huxel-pack-'));
		const dist = path.join(root, 'dist');

		roots.push(root);
		fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
		fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
		fs.writeFileSync(path.join(dist, 'popup.html'), '<!doctype html>');
		fs.writeFileSync(path.join(dist, 'icons', 'icon-128.png'), '');
		fs.writeFileSync(path.join(dist, 'assets', 'popup.js'), '');
		fs.writeFileSync(path.join(dist, 'assets', 'popup.js.map'), '{}');
		fs.writeFileSync(path.join(dist, '.DS_Store'), '');
		fs.writeFileSync(
			path.join(dist, 'manifest.json'),
			JSON.stringify({
				manifest_version: 3,
				name: 'huxel',
				description: 'Control Philips Hue lights on your local network.',
				version: '0.1.0',
				icons: { '128': 'icons/icon-128.png' },
				action: { default_popup: 'popup.html' },
				...manifest
			})
		);

		return root;
	}
});
