import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const partials = ['ramps.css', 'semantic.css', 'type.css', 'scale.css', 'motion.css', 'base.css'];

class TokenCatalog {
	private readonly tokens = new Map<string, string>();

	constructor(directory: string) {
		for (const partial of partials) {
			this.collect(readFileSync(join(directory, partial), 'utf8'));
		}
	}

	names(): string[] {
		return [...this.tokens.keys()];
	}

	value(name: string): string {
		return this.resolve(name, new Set());
	}

	private collect(css: string): void {
		const property = /(--[A-Za-z0-9-]+)\s*:\s*([^;]+)/g;

		for (const match of css.matchAll(property)) {
			const name = match[1];
			const value = match[2]?.trim().replace(/\s+/g, ' ');

			if (name === undefined || value === undefined || value.length === 0) {
				continue;
			}

			this.tokens.set(name, value);
		}
	}

	private resolve(name: string, seen: Set<string>): string {
		if (seen.has(name)) {
			throw new Error(`Token cycle at ${name}.`);
		}

		const value = this.tokens.get(name);

		if (value === undefined) {
			throw new Error(`Missing token ${name}.`);
		}

		const reference = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/.exec(value)?.[1];

		if (reference === undefined) {
			return value;
		}

		seen.add(name);

		return this.resolve(reference, seen);
	}
}

const catalog = new TokenCatalog(dirname(fileURLToPath(import.meta.url)));

export function tokenNames(): string[] {
	return catalog.names();
}

export function tokenValue(name: string): string {
	return catalog.value(name);
}
