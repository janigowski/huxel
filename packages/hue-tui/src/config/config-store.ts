import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface BridgeAddress {
	id: string;
	ip: string;
	port?: number;
}

export interface Config {
	bridge: BridgeAddress;
	appKey?: string;
}

export interface ConfigStore {
	load(): Promise<Config | undefined>;
	save(config: Config): Promise<void>;
}

export function defaultConfigPath(
	env: Record<string, string | undefined> = process.env,
	home: string = homedir()
): string {
	const configHome = env.XDG_CONFIG_HOME || join(home, '.config');
	return join(configHome, 'hue-remote', 'config.json');
}

export function createConfigStore(path: string): ConfigStore {
	return {
		async load() {
			let text: string;
			try {
				text = await readFile(path, 'utf8');
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					return undefined;
				}
				throw error;
			}
			return parseConfig(parseJson(text, path), path);
		},
		async save(config) {
			const dir = dirname(path);
			const tmp = `${path}.${process.pid}.tmp`;
			await mkdir(dir, { recursive: true, mode: 0o700 });
			await chmod(dir, 0o700);
			await writeFile(tmp, `${JSON.stringify(config, null, '\t')}\n`, { mode: 0o600 });
			await chmod(tmp, 0o600);
			await rename(tmp, path);
		}
	};
}

function parseJson(text: string, path: string): unknown {
	try {
		return JSON.parse(text);
	} catch (error) {
		throw new Error(`Invalid JSON in config file at ${path}`, { cause: error });
	}
}

function parseConfig(value: unknown, path: string): Config {
	if (isRecord(value) && isRecord(value.bridge)) {
		const { id, ip, port } = value.bridge;
		if (
			typeof id === 'string' &&
			typeof ip === 'string' &&
			(port === undefined || typeof port === 'number') &&
			(value.appKey === undefined || typeof value.appKey === 'string')
		) {
			return {
				bridge: port === undefined ? { id, ip } : { id, ip, port },
				...(value.appKey === undefined ? {} : { appKey: value.appKey })
			};
		}
	}
	throw new Error(`Invalid config file at ${path}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
