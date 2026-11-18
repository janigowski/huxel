import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const BROAD_HOSTS = new Set(['https://*/*', 'http://*/*', '*://*/*', '<all_urls>']);

interface ExtensionManifest {
	manifest_version: number;
	name: string;
	version: string;
	description?: string;
	icons?: Record<string, string>;
	action?: { default_popup?: string };
	host_permissions?: string[];
}

export function releaseFileName(dist: string): string {
	return `huxel-${readManifest(dist).version}.zip`;
}

export function packExtension(dist: string, destination: string): void {
	const manifest = readManifest(dist);
	const files = listPackageFiles(dist);

	assertManifest(manifest, files);

	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.rmSync(destination, { force: true });

	const result = spawnSync('zip', ['-X', '-q', destination, ...files], {
		cwd: dist,
		env: { ...process.env, COPYFILE_DISABLE: '1' }
	});

	if (result.error) {
		throw new Error('zip is not available');
	}

	if (result.status !== 0) {
		const detail = result.stderr?.toString().trim();

		throw new Error(
			detail ? `zip failed: ${detail}` : `zip failed with exit code ${result.status}`
		);
	}

	const entries = packageEntries(destination);

	if (!entries.includes('manifest.json')) {
		throw new Error('Packed zip is missing manifest.json at its root');
	}

	if (entries.some((entry) => !isSafeZipPath(entry))) {
		throw new Error('Packed zip contains an unsafe path');
	}
}

export function listPackageFiles(dist: string): string[] {
	const files: string[] = [];

	walk(dist, dist, files);

	return files.sort();
}

export function packageEntries(zipPath: string): string[] {
	const result = spawnSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' });

	if (result.error) {
		throw new Error('unzip is not available');
	}

	if (result.status !== 0) {
		throw new Error(`unzip failed with exit code ${result.status}`);
	}

	return result.stdout.split('\n').filter((entry) => entry !== '' && !entry.endsWith('/'));
}

function walk(root: string, dir: string, files: string[]): void {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (skipped(entry.name)) {
			continue;
		}

		const absolute = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			walk(root, absolute, files);
			continue;
		}

		if (!entry.isFile()) {
			continue;
		}

		files.push(path.relative(root, absolute).split(path.sep).join('/'));
	}
}

function skipped(name: string): boolean {
	return name.startsWith('.') || name === 'node_modules' || name.endsWith('.map');
}

function readManifest(dist: string): ExtensionManifest {
	const manifestPath = path.join(dist, 'manifest.json');

	let source: string;

	try {
		source = fs.readFileSync(manifestPath, 'utf8');
	} catch (error) {
		if (isMissingFile(error)) {
			throw new Error('dist/manifest.json is missing. Build the extension before packing.');
		}

		throw error;
	}

	return JSON.parse(source) as ExtensionManifest;
}

function assertManifest(manifest: ExtensionManifest, files: string[]): void {
	if (manifest.manifest_version !== 3) {
		throw new Error('manifest.json must be Manifest V3');
	}

	if (manifest.name !== 'huxel') {
		throw new Error('manifest.json name must be huxel');
	}

	if (!isChromeVersion(manifest.version)) {
		throw new Error(`manifest.json version is not a Chrome version: ${manifest.version}`);
	}

	if (!manifest.description || manifest.description.length > 132) {
		throw new Error('manifest.json description must be 1 to 132 characters');
	}

	if ((manifest.host_permissions ?? []).some((host) => BROAD_HOSTS.has(host))) {
		throw new Error('Broad host access must stay in optional_host_permissions');
	}

	const popup = manifest.action?.default_popup;

	if (!popup || !files.includes(toZipPath(popup))) {
		throw new Error('manifest.json action.default_popup is missing from the package');
	}

	const icon128 = manifest.icons?.['128'];

	if (!icon128 || !files.includes(toZipPath(icon128))) {
		throw new Error('manifest.json is missing icons.128');
	}

	for (const icon of Object.values(manifest.icons ?? {})) {
		if (!files.includes(toZipPath(icon))) {
			throw new Error(`manifest.json icon is missing from the package: ${icon}`);
		}
	}
}

function toZipPath(value: string): string {
	return value.split('\\').join('/');
}

function isSafeZipPath(entry: string): boolean {
	return !entry.startsWith('/') && !entry.includes('\\') && !entry.split('/').includes('..');
}

function isChromeVersion(version: string): boolean {
	const parts = version.split('.');

	if (parts.length < 1 || parts.length > 4) {
		return false;
	}

	return parts.every((part) => {
		if (!/^\d+$/.test(part) || part.length > 5) {
			return false;
		}

		const value = Number(part);

		return value <= 65535 && String(value) === part;
	});
}

function isMissingFile(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
