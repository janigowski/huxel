import type { ResourceId, ResourceIdentifier } from './common';
import type { Light, LightUpdate } from './light';
import type { Room, RoomCreate, RoomUpdate } from './room';

export interface ReadableResource<T> {
	list(): Promise<T[]>;
	get(id: ResourceId): Promise<T>;
}

export interface UpdatableResource<TUpdate, TType extends ResourceIdentifier['rtype']> {
	update(id: ResourceId, update: TUpdate): Promise<ResourceIdentifier<TType>[]>;
}

export interface CreatableResource<TCreate, TType extends ResourceIdentifier['rtype']> {
	create(resource: TCreate): Promise<ResourceIdentifier<TType>[]>;
}

export interface DeletableResource<TType extends ResourceIdentifier['rtype']> {
	delete(id: ResourceId): Promise<ResourceIdentifier<TType>[]>;
}

export interface LightsClient
	extends ReadableResource<Light>, UpdatableResource<LightUpdate, 'light'> {}

export interface RoomsClient
	extends
		ReadableResource<Room>,
		CreatableResource<RoomCreate, 'room'>,
		UpdatableResource<RoomUpdate, 'room'>,
		DeletableResource<'room'> {}

export interface BridgeClient {
	readonly lights: LightsClient;
	readonly rooms: RoomsClient;
}
