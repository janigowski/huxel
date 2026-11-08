import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigStore, defaultConfigPath } from '../src/config/config-store';

describe('config store', () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), 'hue-mcp-'));
	});

	afterEach(async () => {
		await rm(dir, { recursive: true, force: true });
	});

	test('returns undefined when the file does not exist', async () => {
		expect(await new ConfigStore(join(dir, 'missing.json')).load()).toBeUndefined();
	});

	test('round-trips the config and creates the directory', async () => {
		const store = new ConfigStore(join(dir, 'hue-mcp', 'config.json'));
		const config = { bridge: { id: '001788fffe7d45eb', ip: '192.168.1.10' }, appKey: 'secret' };

		await store.save(config);

		expect(await store.load()).toEqual(config);
	});

	test('writes the file readable only by the owner', async () => {
		const path = join(dir, 'config.json');
		await new ConfigStore(path).save({ bridge: { id: 'a', ip: '10.0.0.2' }, appKey: 'secret' });

		expect((await stat(path)).mode & 0o777).toBe(0o600);
	});

	test('tightens an existing file and its directory to the owner', async () => {
		const configDir = join(dir, 'hue-mcp');
		const path = join(configDir, 'config.json');
		await mkdir(configDir, { mode: 0o755 });
		await chmod(configDir, 0o755);
		await writeFile(path, '{}', { mode: 0o644 });
		await chmod(path, 0o644);

		await new ConfigStore(path).save({ bridge: { id: 'a', ip: '10.0.0.2' }, appKey: 'secret' });

		expect((await stat(path)).mode & 0o777).toBe(0o600);
		expect((await stat(configDir)).mode & 0o777).toBe(0o700);
		expect(await readdir(configDir)).toEqual(['config.json']);
	});

	test('parallel saves both finish', async () => {
		const path = join(dir, 'config.json');
		const store = new ConfigStore(path);

		await Promise.all([
			store.save({ bridge: { id: 'a', ip: '10.0.0.1' }, appKey: 'one' }),
			store.save({ bridge: { id: 'a', ip: '10.0.0.2' }, appKey: 'two' })
		]);

		const loaded = await store.load();

		expect(loaded?.appKey === 'one' || loaded?.appKey === 'two').toBe(true);
		expect(await readdir(dir)).toEqual(['config.json']);
	});

	test('reports the path of a file with invalid JSON', async () => {
		const path = join(dir, 'config.json');
		await writeFile(path, '{ nope');

		await expect(new ConfigStore(path).load()).rejects.toThrow(path);
	});

	test('resolves the path from XDG_CONFIG_HOME or the home directory', () => {
		expect(defaultConfigPath({ XDG_CONFIG_HOME: '/xdg' }, '/home/me')).toBe(
			'/xdg/hue-mcp/config.json'
		);
		expect(defaultConfigPath({}, '/home/me')).toBe('/home/me/.config/hue-mcp/config.json');
	});
});
