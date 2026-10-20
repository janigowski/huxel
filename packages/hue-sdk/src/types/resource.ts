import type { BridgeHomeGet } from './bridge-home.js';
import type { BridgeGet } from './bridge.js';
import type { ResourceType } from './common.js';
import type { DeviceGet } from './device.js';
import type { GroupedLightGet } from './grouped-light.js';
import type { LightGet } from './light.js';
import type { RoomGet } from './room.js';
import type { SceneGet } from './scene.js';
import type { SmartSceneGet } from './smart-scene.js';
import type { ZoneGet } from './zone.js';

export type CoveredResourceGet =
	| LightGet
	| GroupedLightGet
	| RoomGet
	| ZoneGet
	| SceneGet
	| SmartSceneGet
	| DeviceGet
	| BridgeGet
	| BridgeHomeGet;

/**
 * A resource whose type is not modelled by this SDK version yet. Only the identity fields are
 * typed; other properties are present but unknown.
 */
export interface UncoveredResourceGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	type: Exclude<ResourceType, CoveredResourceGet['type']>;
	[property: string]: unknown;
}

/** Item of `GET /resource`, discriminated by `type`. */
export type AnyResourceGet = CoveredResourceGet | UncoveredResourceGet;

export interface ResourceListParams {
	/** Optional filter for resource types. Multiple types are sent separated by commas. */
	type?: ResourceType | ResourceType[];
}
