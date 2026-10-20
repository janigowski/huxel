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
	| 'switch_input_configuration'
	| 'power_output_configuration'
	| 'grouped_light'
	| 'grouped_motion'
	| 'grouped_light_level'
	| 'device_power'
	| 'device_software_update'
	| 'zigbee_connectivity'
	| 'zgp_connectivity'
	| 'bridge'
	| 'motion_area_candidate'
	| 'wifi_connectivity'
	| 'zigbee_device_discovery'
	| 'homekit'
	| 'matter'
	| 'matter_fabric'
	| 'scene'
	| 'entertainment_configuration'
	| 'public_image'
	| 'auth_v1'
	| 'behavior_script'
	| 'behavior_script_formula'
	| 'behavior_instance'
	| 'geofence_client'
	| 'geolocation'
	| 'smart_scene'
	| 'motion_area_configuration'
	| 'clip';

export interface ResourceIdentifier {
	/** The unique id of the referenced resource. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	rid: string;
	/** The type of the referenced resource */
	rtype: ResourceType;
}

export type ApiErrorCode =
	'communication_error' | 'attribute_may_have_no_effect' | 'client_error' | 'internal_error';

export interface ApiError {
	/** A human-readable explanation specific to this occurrence of the problem. */
	description: string;
	/** An error code associated with the problem for client handling. */
	error_code: ApiErrorCode;
}

/**
 * Response envelope of every CLIP v2 endpoint. `errors` may be non-empty even when the
 * request succeeded (HTTP 207 partial success).
 */
export interface ApiResponse<T> {
	errors: ApiError[];
	data: T[];
}

export interface ErrorResponse {
	errors: ApiError[];
}

export type ResourceIdentifierResponse = ApiResponse<ResourceIdentifier>;

/** Object documented without any properties. */
export type EmptyObject = Record<string, never>;

/** CIE XY gamut position */
export interface XYColor {
	/** X position in color gamut. minimum: 0, maximum: 1 */
	x: number;
	/** Y position in color gamut. minimum: 0, maximum: 1 */
	y: number;
}

export interface Position3D {
	x: number;
	y: number;
	z: number;
}

/** A quaternion representing rotation in 3D space. */
export interface Quaternion {
	/** minimum: -1, maximum: 1 */
	x: number;
	/** minimum: -1, maximum: 1 */
	y: number;
	/** minimum: -1, maximum: 1 */
	z: number;
	/** minimum: -1, maximum: 1 */
	w: number;
}

export interface GeometryTransform {
	/** A 3D coordinate in space in meters. */
	position: Position3D;
	/** A quaternion representing rotation in 3D space. */
	rotation: Quaternion;
}

export interface GeometryObject {
	reference: ResourceIdentifier;
	transform: GeometryTransform;
}

/** Possible archetypes of a room or zone */
export type AreaArchetype =
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

export type DeltaAction = 'up' | 'down' | 'stop';

export type ConfigurationStatus = 'set' | 'changing';
