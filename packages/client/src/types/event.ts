import type { ResourceIdentifier, ResourceType } from './common';
import type { LightGet } from './light';

export type HueEventType = 'add' | 'update' | 'delete' | 'error';

export type LightEventResource = Partial<LightGet> & Pick<LightGet, 'id' | 'type'>;

export interface OtherEventResource {
	id: string;
	type: Exclude<ResourceType, 'light'>;
	id_v1?: string;
	owner?: ResourceIdentifier;
	[key: string]: unknown;
}

export type HueEventResource = LightEventResource | OtherEventResource;

export interface HueEvent {
	id: string;
	creationtime: string;
	type: HueEventType;
	data: HueEventResource[];
}
