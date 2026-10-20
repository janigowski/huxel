import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createConfigStore, defaultConfigPath } from '../src/config/config-store';

describe('config store', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'hue-tui-'));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test('returns undefined when the file does not exist', async () => {
		expect(await createConfigStore(join(dir, 'missing.json')).load()).toBeUndefined();
	});

	test('round-trips the config and creates the directory', async () => {
		const store = createConfigStore(join(dir, 'hue-remote', 'config.json'));
		const config = { bridge: { id: '001788fffe7d45eb', ip: '192.168.1.10' }, appKey: 'secret' };

		await store.save(config);

		expect(await store.load()).toEqual(config);
	});

	test('writes the file readable only by the owner', async () => {
		const path = join(dir, 'config.json');
		await createConfigStore(path).save({ bridge: { id: 'a', ip: '10.0.0.2' }, appKey: 'secret' });

		expect((await stat(path)).mode & 0o777).toBe(0o600);
	});

	test('tightens an existing file and its directory to the owner', async () => {
		const configDir = join(dir, 'hue-remote');
		const path = join(configDir, 'config.json');
		await mkdir(configDir, { mode: 0o755 });
		await chmod(configDir, 0o755);
		await writeFile(path, '{}', { mode: 0o644 });
		await chmod(path, 0o644);

		await createConfigStore(path).save({ bridge: { id: 'a', ip: '10.0.0.2' }, appKey: 'secret' });

		expect((await stat(path)).mode & 0o777).toBe(0o600);
		expect((await stat(configDir)).mode & 0o777).toBe(0o700);
		expect(await readdir(configDir)).toEqual(['config.json']);
	});

	test('reports the path of a file with invalid JSON', async () => {
		const path = join(dir, 'config.json');
		await writeFile(path, '{ nope');

		await expect(createConfigStore(path).load()).rejects.toThrow(path);
	});

	test('resolves the path from XDG_CONFIG_HOME or the home directory', () => {
		expect(defaultConfigPath({ XDG_CONFIG_HOME: '/xdg' }, '/home/me')).toBe(
			'/xdg/hue-remote/config.json'
		);
		expect(defaultConfigPath({}, '/home/me')).toBe('/home/me/.config/hue-remote/config.json');
	});
});
