import type { HueApp } from '@huxel/app';
import type { DiscoveredBridge } from '@huxel/client';

export interface KeyValueStorage {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
	remove(key: string): Promise<void>;
}

export interface HostAccess {
	contains(origin: string): Promise<boolean>;
	request(origin: string): Promise<boolean>;
}

export interface BridgeCredentials {
	origin: string;
	appKey: string;
}

export interface Dependencies {
	storage: KeyValueStorage;
	hostAccess: HostAccess;
	discoverBridges(): Promise<DiscoveredBridge[]>;
	registerApplication(origin: string): Promise<string>;
	openHueApp(credentials: BridgeCredentials): HueApp;
}
