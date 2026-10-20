import type { Resource, ResourceIdentifier } from './common';

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

export interface RoomMetadata {
	name: string;
	archetype: RoomArchetype;
}

export interface Room extends Resource<'room'> {
	children: ResourceIdentifier[];
	services: ResourceIdentifier[];
	metadata: RoomMetadata;
}

export interface RoomCreate {
	type?: 'room';
	metadata: RoomMetadata;
	children: ResourceIdentifier[];
}

export interface RoomUpdate {
	type?: 'room';
	metadata?: Partial<RoomMetadata>;
	children?: ResourceIdentifier[];
}
