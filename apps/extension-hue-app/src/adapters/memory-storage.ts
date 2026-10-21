import type { KeyValueStorage } from '../ports';

export class MemoryStorage implements KeyValueStorage {
	private readonly items = new Map<string, unknown>();

	constructor(initial: Record<string, unknown> = {}) {
		for (const [key, value] of Object.entries(initial)) {
			this.items.set(key, structuredClone(value));
		}
	}

	async get(key: string): Promise<unknown> {
		return structuredClone(this.items.get(key));
	}

	async set(key: string, value: unknown): Promise<void> {
		this.items.set(key, structuredClone(value));
	}

	async remove(key: string): Promise<void> {
		this.items.delete(key);
	}

	snapshot(): Record<string, unknown> {
		return Object.fromEntries(this.items);
	}
}
