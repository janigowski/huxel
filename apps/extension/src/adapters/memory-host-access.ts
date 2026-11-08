import type { HostAccess } from '../ports';

export class MemoryHostAccess implements HostAccess {
	readonly requests: string[] = [];
	grantOnRequest: boolean;

	private readonly granted: Set<string>;

	constructor(options: { granted?: readonly string[]; grantOnRequest?: boolean } = {}) {
		this.granted = new Set(options.granted);
		this.grantOnRequest = options.grantOnRequest ?? true;
	}

	async contains(origin: string): Promise<boolean> {
		return this.granted.has(origin);
	}

	async request(origin: string): Promise<boolean> {
		this.requests.push(origin);

		if (this.grantOnRequest) {
			this.granted.add(origin);
		}

		return this.granted.has(origin);
	}

	revoke(origin: string): void {
		this.granted.delete(origin);
	}
}
