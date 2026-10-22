import type {
	ConfigurationStatus,
	EmptyObject,
	GeometryObject,
	ResourceIdentifier
} from './common';
import type { IdentifyPut } from './light';

export type DeviceArchetype =
	| 'bridge_v2'
	| 'bridge_v3'
	| 'unknown_archetype'
	| 'classic_bulb'
	| 'sultan_bulb'
	| 'flood_bulb'
	| 'spot_bulb'
	| 'candle_bulb'
	| 'luster_bulb'
	| 'pendant_round'
	| 'pendant_long'
	| 'ceiling_round'
	| 'ceiling_square'
	| 'floor_shade'
	| 'floor_lantern'
	| 'table_shade'
	| 'recessed_ceiling'
	| 'recessed_floor'
	| 'single_spot'
	| 'double_spot'
	| 'table_wash'
	| 'wall_lantern'
	| 'wall_shade'
	| 'flexible_lamp'
	| 'ground_spot'
	| 'wall_spot'
	| 'plug'
	| 'hue_go'
	| 'hue_lightstrip'
	| 'hue_iris'
	| 'hue_bloom'
	| 'bollard'
	| 'wall_washer'
	| 'hue_play'
	| 'hue_chime'
	| 'vintage_bulb'
	| 'vintage_candle_bulb'
	| 'ellipse_bulb'
	| 'triangle_bulb'
	| 'small_globe_bulb'
	| 'large_globe_bulb'
	| 'edison_bulb'
	| 'christmas_tree'
	| 'string_light'
	| 'hue_centris'
	| 'hue_lightstrip_tv'
	| 'hue_lightstrip_pc'
	| 'hue_tube'
	| 'hue_signe'
	| 'pendant_spot'
	| 'ceiling_horizontal'
	| 'ceiling_tube'
	| 'up_and_down'
	| 'up_and_down_up'
	| 'up_and_down_down'
	| 'hue_floodlight_camera'
	| 'twilight'
	| 'twilight_front'
	| 'twilight_back'
	| 'hue_play_wallwasher'
	| 'hue_omniglow'
	| 'hue_neon'
	| 'string_globe'
	| 'string_permanent'
	| 'hue_go_xxl'
	| 'hue_switch_module'
	| 'rigid_tube'
	| 'flexible_tube'
	| 'panels'
	| 'pendant_tube'
	| 'vertical_tube'
	| 'recessed_ceiling_tube'
	| 'wall_rectangle'
	| 'string_icicle'
	| 'string_grid'
	| 'string_net'
	| 'hue_omniglow_arc'
	| 'hue_flux_arc';

export type SwitchModeType =
	| 'switch_single_rocker'
	| 'switch_single_pushbutton'
	| 'switch_dual_rocker'
	| 'switch_dual_pushbutton'
	| 'switch_none';

export interface DeviceProductDataGet {
	/** unique identification of device model */
	model_id: string;
	/** Name of device manufacturer */
	manufacturer_name: string;
	/** Name of the product. */
	product_name: string;
	/** Archetype of the product */
	product_archetype: DeviceArchetype;
	/** This device is Hue certified */
	certified: boolean;
	/** Software version of the product. Pattern: `\d+\.\d+\.\d+` */
	software_version: string;
	/** Hardware type; identified by Manufacturer code and ImageType */
	hardware_platform_type?: string;
}

export interface DeviceMetadataGet {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** By default archetype given by manufacturer. Can be changed by user. */
	archetype: DeviceArchetype;
}

export interface DeviceMetadataPut {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name?: string;
	/** By default archetype given by manufacturer. Can be changed by user. */
	archetype?: DeviceArchetype;
}

export interface DeviceUsertestGet {
	status: ConfigurationStatus;
	/**
	 * Activates or extends user usertest mode of device for 120 seconds. false deactivates usertest
	 * mode. In usertest mode, devices report changes in state faster and indicate state changes on
	 * device LED (if applicable)
	 */
	usertest: boolean;
}

export interface DeviceUsertestPut {
	/**
	 * Activates or extends user usertest mode of device for 120 seconds. false deactivates usertest
	 * mode. In usertest mode, devices report changes in state faster and indicate state changes on
	 * device LED (if applicable)
	 */
	usertest?: boolean;
}

export interface DeviceModeGet {
	status: ConfigurationStatus;
	/** Current mode (on read) or requested mode (on write) of the switch */
	mode: SwitchModeType;
	/** The modes that the switch supports */
	mode_values: SwitchModeType[];
}

export interface DeviceModePut {
	/** Current mode (on read) or requested mode (on write) of the switch */
	mode: SwitchModeType;
}

export interface DeviceGeometryGet {
	/** Data describing geometry information of the device. Only positioning of lightservices is supported. */
	objects?: GeometryObject[];
}

export interface DeviceGeometryPut {
	/** Data describing geometry information of the device. Only positioning of lightservices is supported. */
	objects?: GeometryObject[];
}

export interface DeviceGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	type: 'device';
	product_data: DeviceProductDataGet;
	/** Additional metadata including a user given name */
	metadata: DeviceMetadataGet;
	identify: EmptyObject;
	usertest?: DeviceUsertestGet;
	/** @deprecated Deprecated. Use switch_mode in SwitchInputConfiguration. */
	device_mode?: DeviceModeGet;
	/** References all services providing control and state of the device. */
	services: ResourceIdentifier[];
	geometry?: DeviceGeometryGet;
}

export interface DevicePut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	type?: 'device';
	/** Additional metadata including a user given name */
	metadata?: DeviceMetadataPut;
	identify?: IdentifyPut;
	usertest?: DeviceUsertestPut;
	/** @deprecated Deprecated. Use switch_mode in SwitchInputConfiguration. */
	device_mode?: DeviceModePut;
	geometry?: DeviceGeometryPut;
}
