import { randomUUID } from 'node:crypto';
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { BridgeAddress } from '../bridge/address';

export interface Config {
	bridge: BridgeAddress;
	appKey?: string;
}

export function defaultConfigPath(
	env: Record<string, string | undefined> = process.env,
	home: string = homedir()
): string {
	const configHome = env.XDG_CONFIG_HOME || join(home, '.config');

	return join(configHome, 'hue-mcp', 'config.json');
}

export class ConfigStore {
	private pending: Promise<unknown> = Promise.resolve();

	constructor(private readonly path: string) {}

	load(): Promise<Config | undefined> {
		return this.run(() => this.read());
	}

	save(config: Config): Promise<void> {
		return this.run(() => this.write(config));
	}

	async modify(update: (config: Config | undefined) => Config | undefined): Promise<void> {
		await this.run(async () => {
			const next = update(await this.read());

			if (next) {
				await this.write(next);
			}
		});
	}

	private run<T>(fn: () => Promise<T>): Promise<T> {
		const result = this.pending.then(fn, fn);

		this.pending = result.then(
			() => undefined,
			() => undefined
		);

		return result;
	}

	private async read(): Promise<Config | undefined> {
		let text: string;

		try {
			text = await readFile(this.path, 'utf8');
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return undefined;
			}

			throw error;
		}

		return parseConfig(parseJson(text, this.path), this.path);
	}

	private async write(config: Config): Promise<void> {
		const dir = dirname(this.path);
		const tmp = `${this.path}.${process.pid}.${randomUUID()}.tmp`;

		await mkdir(dir, { recursive: true, mode: 0o700 });
		await chmod(dir, 0o700);
		await writeFile(tmp, `${JSON.stringify(config, null, '\t')}\n`, { mode: 0o600 });
		await chmod(tmp, 0o600);
		await rename(tmp, this.path);
	}
}

function parseJson(text: string, path: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`Invalid JSON in config file at ${path}`);
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
