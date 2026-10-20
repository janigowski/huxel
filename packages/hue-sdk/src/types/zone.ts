import type { AreaArchetype, ResourceIdentifier } from './common.js';

export type ZoneArchetype = AreaArchetype;

export interface ZoneMetadataGet {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** possible archetypes of a room */
	archetype: ZoneArchetype;
}

export interface ZoneMetadataPut {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name?: string;
	/** possible archetypes of a room */
	archetype?: ZoneArchetype;
}

export interface ZoneMetadataPost {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** possible archetypes of a room */
	archetype: ZoneArchetype;
}

export interface ZoneGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	/** Child devices/services to group by the derived group */
	children: ResourceIdentifier[];
	/**
	 * References all services aggregating control and state of children in the group. This includes all
	 * services grouped in the group hierarchy given by child relation This includes all services of a
	 * device grouped in the group hierarchy given by child relation Aggregation is per service type, ie
	 * every service type which can be grouped has a corresponding definition of grouped type Supported
	 * types: – grouped_light – grouped_motion – grouped_light_level
	 */
	services: ResourceIdentifier[];
	type: 'zone';
	/** configuration object for a room */
	metadata: ZoneMetadataGet;
}

export interface ZonePut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	/** Child devices/services to group by the derived group */
	children?: ResourceIdentifier[];
	type?: 'zone';
	/** configuration object for a room */
	metadata?: ZoneMetadataPut;
}

export interface ZonePost {
	/** Child devices/services to group by the derived group */
	children: ResourceIdentifier[];
	type?: 'zone';
	/** configuration object for a room */
	metadata: ZoneMetadataPost;
}
