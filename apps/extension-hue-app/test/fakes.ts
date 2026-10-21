import { createHueApp, type BridgeLight, type HueGateway } from 'hue-app';
import { HueLinkButtonNotPressedError, HueNetworkError, type DiscoveredBridge } from 'hue-sdk';
import { MemoryHostAccess } from '../src/adapters/memory-host-access';
import { MemoryStorage } from '../src/adapters/memory-storage';
import type { BridgeCredentials, Dependencies, KeyValueStorage } from '../src/ports';
import { SimulatedGateway } from '../src/preview/simulated-gateway';

export const BRIDGE_HOST = '192.168.1.10';
export const BRIDGE_ORIGIN = `https://${BRIDGE_HOST}`;
export const BRIDGE_ID = '001788fffe7d45eb';

export const LIGHTS: readonly BridgeLight[] = [
	{ id: 'desk', name: 'Desk', isOn: false, brightness: 40, color: null },
	{ id: 'lamp', name: 'Lamp', isOn: true, brightness: 80, color: null }
];

export interface Deferred<T> {
	readonly promise: Promise<T>;
	resolve(value: T): void;
	reject(error: unknown): void;
}

export function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;

	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});

	return { promise, resolve, reject };
}

export function linkButtonNotPressed(): HueLinkButtonNotPressedError {
	return new HueLinkButtonNotPressedError('Hue bridge link button has not been pressed', {
		type: 101,
		address: '',
		description: 'link button not pressed'
	});
}

export function networkError(): HueNetworkError {
	return new HueNetworkError(
		`Network request failed: GET ${BRIDGE_ORIGIN}/clip/v2/resource/light`,
		{
			cause: new TypeError('Failed to fetch')
		}
	);
}

export class UnreachableGateway implements HueGateway {
	listLights(): Promise<BridgeLight[]> {
		return Promise.reject(networkError());
	}

	setPower(): Promise<void> {
		return Promise.reject(networkError());
	}

	setBrightness(): Promise<void> {
		return Promise.reject(networkError());
	}

	setColor(): Promise<void> {
		return Promise.reject(networkError());
	}
}

export class FailingStorage implements KeyValueStorage {
	get(): Promise<unknown> {
		return Promise.reject(new Error('Storage is unavailable'));
	}

	set(): Promise<void> {
		return Promise.reject(new Error('Storage is unavailable'));
	}

	remove(): Promise<void> {
		return Promise.reject(new Error('Storage is unavailable'));
	}
}

export interface FakeBridgeOptions {
	storage?: Record<string, unknown> | KeyValueStorage;
	granted?: readonly string[];
	grantOnRequest?: boolean;
	discovery?: () => Promise<DiscoveredBridge[]>;
	registrations?: Array<string | Error | Promise<string>>;
	gateways?: HueGateway[];
}

export class FakeBridge {
	readonly storage: KeyValueStorage;
	readonly hostAccess: MemoryHostAccess;
	readonly gateway = new SimulatedGateway(LIGHTS);
	readonly registrationOrigins: string[] = [];
	readonly openedWith: BridgeCredentials[] = [];

	private readonly discovery: () => Promise<DiscoveredBridge[]>;
	private readonly registrations: Array<string | Error | Promise<string>>;
	private readonly gateways: HueGateway[];

	constructor(options: FakeBridgeOptions = {}) {
		this.storage = isStorage(options.storage)
			? options.storage
			: new MemoryStorage(options.storage);
		this.hostAccess = new MemoryHostAccess({
			granted: options.granted,
			grantOnRequest: options.grantOnRequest
		});
		this.discovery = options.discovery ?? (async () => [discoveredBridge()]);
		this.registrations = [...(options.registrations ?? ['app-key'])];
		this.gateways = [...(options.gateways ?? [])];
	}

	get dependencies(): Dependencies {
		return {
			storage: this.storage,
			hostAccess: this.hostAccess,
			discoverBridges: () => this.discovery(),
			registerApplication: async (origin) => {
				this.registrationOrigins.push(origin);

				const next = this.registrations.shift() ?? 'app-key';

				if (next instanceof Error) {
					throw next;
				}

				return next;
			},
			openHueApp: (credentials) => {
				this.openedWith.push(credentials);

				return createHueApp({ gateway: this.gateways.shift() ?? this.gateway });
			}
		};
	}

	get stored(): Record<string, unknown> {
		return this.storage instanceof MemoryStorage ? this.storage.snapshot() : {};
	}
}

export function discoveredBridge(): DiscoveredBridge {
	return { id: BRIDGE_ID.toUpperCase(), internalipaddress: BRIDGE_HOST, port: 443 };
}

export function linkedBridgeStorage(): Record<string, unknown> {
	return { linkedBridge: { host: BRIDGE_HOST, id: BRIDGE_ID, appKey: 'stored-key' } };
}

function isStorage(value: FakeBridgeOptions['storage']): value is KeyValueStorage {
	return value instanceof MemoryStorage || value instanceof FailingStorage;
}
