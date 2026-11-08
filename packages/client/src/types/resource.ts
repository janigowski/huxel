import type { BridgeHomeGet } from './bridge-home';
import type { BridgeGet } from './bridge';
import type { ResourceType } from './common';
import type { DeviceGet } from './device';
import type { GroupedLightGet } from './grouped-light';
import type { LightGet } from './light';
import type { RoomGet } from './room';
import type { SceneGet } from './scene';
import type { SmartSceneGet } from './smart-scene';
import type { ZoneGet } from './zone';

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
 * A resource whose type is not modelled by this client version yet. Only the identity fields are
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
