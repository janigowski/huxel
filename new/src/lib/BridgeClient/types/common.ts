export type ResourceId = string;

export type ResourceType =
	| 'device'
	| 'bridge_home'
	| 'room'
	| 'zone'
	| 'service_group'
	| 'light'
	| 'button'
	| 'bell_button'
	| 'relative_rotary'
	| 'temperature'
	| 'light_level'
	| 'motion'
	| 'camera_motion'
	| 'entertainment'
	| 'contact'
	| 'tamper'
	| 'convenience_area_motion'
	| 'security_area_motion'
	| 'speaker'
	| 'grouped_light'
	| 'grouped_motion'
	| 'grouped_light_level'
	| 'device_power'
	| 'device_software_update'
	| 'zigbee_bridge_connectivity'
	| 'zigbee_connectivity'
	| 'zgp_connectivity'
	| 'wifi_connectivity'
	| 'remote_access'
	| 'bridge'
	| 'zigbee_device_discovery'
	| 'system_update'
	| 'homekit'
	| 'matter'
	| 'matter_fabric'
	| 'scene'
	| 'smart_scene'
	| 'entertainment_configuration'
	| 'public_image'
	| 'auth_v1'
	| 'behavior_script'
	| 'behavior_instance'
	| 'geofence'
	| 'geofence_client'
	| 'geolocation'
	| 'motion_area_configuration'
	| 'motion_area_candidate'
	| 'switch_input_configuration'
	| 'power_output_configuration'
	| 'clip';

export interface ResourceIdentifier<T extends ResourceType = ResourceType> {
	rid: ResourceId;
	rtype: T;
}

export interface Resource<T extends ResourceType> {
	type: T;
	id: ResourceId;
	id_v1?: string;
}

export interface HueError {
	description: string;
}

export interface HueResponse<T> {
	data: T[];
	errors: HueError[];
}

export interface XY {
	x: number;
	y: number;
}

export interface ColorXY {
	xy: XY;
}

export interface Mirek {
	mirek: number;
}

export interface On {
	on: boolean;
}

export interface Brightness {
	brightness: number;
}

export type DeltaAction = 'up' | 'down' | 'stop';
