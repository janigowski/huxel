import type { Position3D, ResourceIdentifier } from './common.js';

export type RoomArchetype =
	| 'living_room'
	| 'kitchen'
	| 'dining'
	| 'bedroom'
	| 'kids_bedroom'
	| 'bathroom'
	| 'nursery'
	| 'recreation'
	| 'office'
	| 'gym'
	| 'hallway'
	| 'toilet'
	| 'front_door'
	| 'garage'
	| 'terrace'
	| 'garden'
	| 'driveway'
	| 'carport'
	| 'home'
	| 'downstairs'
	| 'upstairs'
	| 'top_floor'
	| 'attic'
	| 'guest_room'
	| 'staircase'
	| 'lounge'
	| 'man_cave'
	| 'computer'
	| 'studio'
	| 'music'
	| 'tv'
	| 'reading'
	| 'closet'
	| 'storage'
	| 'laundry_room'
	| 'balcony'
	| 'porch'
	| 'barbecue'
	| 'pool'
	| 'other';

export interface RoomQuaternion {
	/** minimum: -1, maximum: 1 */
	x: number;
	/** minimum: -1, maximum: 1 */
	y: number;
	/** minimum: -1, maximum: 1 */
	z: number;
	/** minimum: -1, maximum: 1 */
	w: number;
}

export interface RoomGeometryTransform {
	/** A 3D coordinate in space in meters. */
	position: Position3D;
	/** A quaternion representing rotation in 3D space. */
	rotation: RoomQuaternion;
}

export interface RoomGeometryObject {
	reference: ResourceIdentifier;
	transform: RoomGeometryTransform;
}

export interface RoomMetadataGet {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** possible archetypes of a room */
	archetype: RoomArchetype;
}

export interface RoomMetadataPut {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name?: string;
	/** possible archetypes of a room */
	archetype?: RoomArchetype;
}

export interface RoomMetadataPost {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** possible archetypes of a room */
	archetype: RoomArchetype;
}

export interface RoomGeometryGet {
	/** Data describing geometry information of the room. Only positioning of device services is supported. */
	objects?: RoomGeometryObject[];
}

export interface RoomGeometryPut {
	objects?: RoomGeometryObject[];
}

export interface RoomGeometryPost {
	objects: RoomGeometryObject[];
}

export interface RoomGet {
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
	type: 'room';
	/** configuration object for a room */
	metadata: RoomMetadataGet;
	/** Data describing geometry information of the room. Only positioning of device services is supported. */
	geometry?: RoomGeometryGet;
}

export interface RoomPut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	/** Child devices/services to group by the derived group */
	children?: ResourceIdentifier[];
	type?: 'room';
	/** configuration object for a room */
	metadata?: RoomMetadataPut;
	/** Data describing geometry information of the room. Only positioning of device services is supported. */
	geometry?: RoomGeometryPut;
}

export interface RoomPost {
	/** Child devices/services to group by the derived group */
	children: ResourceIdentifier[];
	type?: 'room';
	/** configuration object for a room */
	metadata: RoomMetadataPost;
	/** Data describing geometry information of the room. Only positioning of device services is supported. */
	geometry?: RoomGeometryPost;
}
