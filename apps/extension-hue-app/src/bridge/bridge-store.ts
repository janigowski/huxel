import type { KeyValueStorage } from '../ports';
import { parseBridgeHost } from './bridge-host';

export interface LinkedBridge {
	host: string;
	id?: string;
	appKey: string;
}

export interface BridgeStore {
	loadLinkedBridge(): Promise<LinkedBridge | null>;
	saveLinkedBridge(bridge: LinkedBridge): Promise<void>;
	forgetLinkedBridge(): Promise<void>;
	loadDraftHost(): Promise<string | null>;
	saveDraftHost(host: string): Promise<void>;
}

export const LINKED_BRIDGE_KEY = 'linkedBridge';
export const DRAFT_HOST_KEY = 'draftHost';

export function createBridgeStore(storage: KeyValueStorage): BridgeStore {
	return {
		async loadLinkedBridge() {
			return parseLinkedBridge(await storage.get(LINKED_BRIDGE_KEY));
		},
		saveLinkedBridge(bridge) {
			return storage.set(LINKED_BRIDGE_KEY, { ...bridge });
		},
		forgetLinkedBridge() {
			return storage.remove(LINKED_BRIDGE_KEY);
		},
		async loadDraftHost() {
			const value = await storage.get(DRAFT_HOST_KEY);

			return typeof value === 'string' ? parseBridgeHost(value) : null;
		},
		saveDraftHost(host) {
			return storage.set(DRAFT_HOST_KEY, host);
		}
	};
}

export function parseLinkedBridge(value: unknown): LinkedBridge | null {
	if (!isRecord(value)) {
		return null;
	}

	const { host, id, appKey } = value;

	if (typeof host !== 'string' || typeof appKey !== 'string' || appKey === '') {
		return null;
	}

	if (id !== undefined && typeof id !== 'string') {
		return null;
	}

	const normalizedHost = parseBridgeHost(host);

	if (!normalizedHost) {
		return null;
	}

	return id === undefined ? { host: normalizedHost, appKey } : { host: normalizedHost, id, appKey };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
