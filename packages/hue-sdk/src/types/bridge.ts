import type { ResourceIdentifier } from './common.js';

export interface BridgeTimeZoneGet {
	/** Time zone where the user's home is located (as Olson ID). */
	time_zone: string;
}

export interface BridgeImportGet {
	/** Bridge ID (in lower case) where the imported data originates from. */
	origin: string;
	/** UTC date and time when the import took place. */
	time: string;
}

export interface BridgeGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	/** Owner of the service, in case the owner service is deleted, the service also gets deleted */
	owner: ResourceIdentifier;
	type: 'bridge';
	/** Unique identifier of the bridge as printed on the device. Lower case. */
	bridge_id: string;
	time_zone: BridgeTimeZoneGet;
	import?: BridgeImportGet;
}

export interface BridgePut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	type?: 'bridge';
}
