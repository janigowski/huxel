import type {
	ConfigurationStatus,
	DeltaAction,
	EmptyObject,
	Position3D,
	ResourceIdentifier,
	XYColor
} from './common.js';

export type LightArchetype =
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

export type LightFunction = 'functional' | 'decorative' | 'mixed' | 'unknown';

/**
 * - A: Gamut of early Philips color-only products
 * - B: Limited gamut of first Hue color products
 * - C: Richer color gamut of Hue white and color ambiance products
 * - other: Color gamut of non-hue products with non-hue gamuts resp w/o gamut
 */
export type GamutType = 'A' | 'B' | 'C' | 'other';

export type DynamicsStatus = 'dynamic_palette' | 'none';

export type AlertEffectType = 'breathe';

export type SignalType = 'no_signal' | 'on_off' | 'on_off_color' | 'alternating';

export type GradientMode =
	| 'interpolated_palette'
	| 'interpolated_palette_mirrored'
	| 'random_pixelated'
	| 'segmented_palette';

export type EffectType =
	| 'prism'
	| 'opal'
	| 'glisten'
	| 'sparkle'
	| 'fire'
	| 'candle'
	| 'underwater'
	| 'cosmos'
	| 'sunbeam'
	| 'enchant'
	| 'no_effect';

export type TimedEffectType = 'sunrise' | 'sunset' | 'no_effect';

export type LightMode = 'normal' | 'streaming';

export type PowerupPreset = 'safety' | 'powerfail' | 'last_on_state' | 'custom';

export type PowerupOnMode = 'on' | 'toggle' | 'previous';

export type PowerupDimmingMode = 'dimming' | 'previous';

export type PowerupColorMode = 'color_temperature' | 'color' | 'previous';

export type ContentOrientation = 'horizontal' | 'vertical';

export type ContentOrder = 'forward' | 'reversed';

/**
 * - not_associated: Not associated
 * - screen: Associated with a screen by placing it behind or around the screen following an arc
 */
export type ContentAssociation = 'not_associated' | 'screen';

export interface OnFeature {
	/** On/Off state of the light on=true, off=false */
	on: boolean;
}

export interface OnFeaturePut {
	/** On/Off state of the light on=true, off=false */
	on?: boolean;
}

export interface ColorGamut {
	red: XYColor;
	green: XYColor;
	blue: XYColor;
}

export interface ColorFeatureBasicGet {
	xy: XYColor;
}

export interface ColorFeatureBasicPut {
	xy?: XYColor;
}

export interface MirekSchema {
	/** minimum color temperature this light supports. minimum: 50, maximum: 1000 */
	mirek_minimum: number;
	/** maximum color temperature this light supports. minimum: 50, maximum: 1000 */
	mirek_maximum: number;
}

export interface PixelPosition {
	/** Index of the pixel to which the position belongs, use 0 for non-gradient lights. minimum: 0 */
	index: number;
	/** Position of the pixel in 3D space. Range of coordinates is -100 to 100 meters. */
	position: Position3D;
}

export interface LightGeometry {
	/** maxItems: 5 */
	pixel_positions?: PixelPosition[];
}

export interface LightMetadataGet {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** @deprecated use metadata on device level */
	archetype: LightArchetype;
	/** A fixed mired value of the white lamp. minimum: 50, maximum: 1000 */
	fixed_mired?: number;
	/** Function of the lightservice */
	function: LightFunction;
}

export interface LightMetadataPut {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name?: string;
	/** @deprecated use metadata on device level */
	archetype?: LightArchetype;
	/** Function of the lightservice */
	function?: LightFunction;
}

/** Factory defaults of the product data */
export interface LightProductData {
	/** Name of the lightservice, only available for devices with multiple lightservices. minLength: 1, maxLength: 32 */
	name?: string;
	/** Archetype of the lightservice, only available for devices with multiple lightservices */
	archetype?: LightArchetype;
	/** Function of the lightservice */
	function: LightFunction;
}

export interface LightDimmingGet {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	brightness: number;
	/** Percentage of the maximum lumen the device outputs on minimum brightness. minimum: 0, maximum: 100 */
	min_dim_level?: number;
}

export interface DimmingPut {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	brightness?: number;
}

export interface DimmingDeltaPut {
	/** The delta action to apply */
	action: DeltaAction;
	/** Brightness percentage of full-scale increase delta to current dimlevel. Clip at Max-level or Min-level. maximum: 100 */
	brightness_delta?: number;
}

export interface DimmingConfigurationGet {
	status: ConfigurationStatus;
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	min_level: number;
}

export interface DimmingConfigurationPut {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	min_level: number;
}

export interface LightColorTemperatureGet {
	/** color temperature in mirek or null when the light color is not in the ct spectrum. minimum: 50, maximum: 1000 */
	mirek: number | null;
	/** Indication whether the value presented in mirek is valid */
	mirek_valid: boolean;
	mirek_schema: MirekSchema;
}

export interface ColorTemperaturePut {
	/** color temperature in mirek. minimum: 50, maximum: 1000 */
	mirek?: number;
}

export interface ColorTemperatureDeltaPut {
	/** The delta action to apply */
	action: DeltaAction;
	/** Mirek delta to current mirek. Clip at mirek_minimum and mirek_maximum of mirek_schema. maximum: 950 */
	mirek_delta?: number;
}

export interface LightColorGet {
	xy: XYColor;
	/** Color gamut of color bulb. Some bulbs do not properly return the Gamut information. In this case this is not present. */
	gamut?: ColorGamut;
	/** The gammut types supported by hue */
	gamut_type: GamutType;
}

export interface LightDynamicsGet {
	/** Current status of the lamp with dynamics. */
	status: DynamicsStatus;
	/** Statuses in which a lamp could be when playing dynamics. */
	status_values: DynamicsStatus[];
	/** speed of dynamic palette. The speed is only valid if the status is dynamic_palette. minimum: 0, maximum: 1 */
	speed: number;
	/** Indicates whether the value presented in speed is valid */
	speed_valid: boolean;
}

export interface LightDynamicsPut {
	/** Duration of a light transition in ms. */
	duration?: number;
	/** speed of dynamic palette. The speed is only valid if the status is dynamic_palette. minimum: 0, maximum: 1 */
	speed?: number;
}

export interface LightAlertGet {
	/** Alert effects that the light supports. */
	action_values: AlertEffectType[];
}

export interface AlertPut {
	/** Alert to set the light to */
	action: AlertEffectType;
}

export interface LightSignalingStatus {
	/** Indicates which signal is currently active. */
	signal: SignalType;
	/** Timestamp (datetime) indicating when the active signal is expected to end. Value is not set if there is no_signal */
	estimated_end: string;
	/** Colors that were provided for the active effect. */
	colors: ColorFeatureBasicGet[];
}

/** Feature containing signaling properties. */
export interface LightSignalingGet {
	/** Signals that the light supports. */
	signal_values: SignalType[];
	/** Indicates status of active signal. Not available when inactive. */
	status?: LightSignalingStatus;
}

/** Feature containing signaling properties. */
export interface SignalingPut {
	/** Signal to set the light to */
	signal: SignalType;
	/**
	 * Duration in milliseconds. Maximum value is 65534000 ms and a stepsize of 1 second.
	 * Values inbetween steps will be rounded. Duration is ignored for no_signal.
	 */
	duration: number;
	/** List of colors to apply to the signal (not supported by all signals). minItems: 1, maxItems: 2 */
	colors?: ColorFeatureBasicPut[];
}

export interface GradientPointGet {
	color: ColorFeatureBasicGet;
}

export interface GradientPointPut {
	color: ColorFeatureBasicPut;
}

/** Basic feature containing gradient properties. */
export interface LightGradientGet {
	/**
	 * Collection of gradients points. For control of the gradient points through a PUT a minimum
	 * of 2 points need to be provided. maxItems: 5
	 */
	points: GradientPointGet[];
	/** Mode in which the points are currently being deployed. */
	mode: GradientMode;
	/** Number of color points that gradient lamp is capable of showing with gradience. */
	points_capable: number;
	/** Modes a gradient device can deploy the gradient palette of colors */
	mode_values: GradientMode[];
	/** Number of pixels in the device */
	pixel_count?: number;
}

/** Basic feature containing gradient properties. */
export interface GradientPut {
	/**
	 * Collection of gradients points. For control of the gradient points through a PUT a minimum
	 * of 2 points need to be provided. maxItems: 5
	 */
	points: GradientPointPut[];
	/** Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette */
	mode?: GradientMode;
}

/** @deprecated use effects_v2 */
export interface LightEffectsGet {
	/** Possible status values in which a light could be when playing an effect. */
	status_values: EffectType[];
	/** Current status values the light is in regarding effects */
	status: EffectType;
	/** Possible effect values you can set in a light. */
	effect_values: EffectType[];
}

/** @deprecated use effects_v2 */
export interface EffectsPut {
	/** Effect to set the light to. */
	effect?: EffectType;
}

export interface LightEffectParametersGet {
	color?: ColorFeatureBasicGet;
	color_temperature?: {
		/** color temperature in mirek or null when the light color is not in the ct spectrum. minimum: 50, maximum: 1000 */
		mirek: number | null;
		/** Indication whether the value presented in mirek is valid */
		mirek_valid: boolean;
	};
	/** minimum: 0, maximum: 1 */
	speed: number;
}

export interface LightEffectsV2Get {
	action: {
		/** Possible effect values you can set in a light. */
		effect_values: EffectType[];
	};
	status: {
		effect: EffectType;
		effect_values: EffectType[];
		parameters?: LightEffectParametersGet;
	};
}

export interface EffectParametersPut {
	color?: ColorFeatureBasicPut;
	color_temperature?: ColorTemperaturePut;
	/** minimum: 0, maximum: 1 */
	speed?: number;
}

export interface EffectsV2Put {
	action?: {
		/** Effect to set the light to. */
		effect: EffectType;
		parameters?: EffectParametersPut;
	};
}

export interface LightTimedEffectsGet {
	/** Possible status values in which a light could be when playing a timed effect. */
	status_values: TimedEffectType[];
	/** Current status values the light is in regarding timed effects */
	status: TimedEffectType;
	/** Possible timed effect values you can set in a light. */
	effect_values: TimedEffectType[];
}

export interface TimedEffectsPut {
	/** Timed effect to set to the light. */
	effect?: TimedEffectType;
	/**
	 * Duration in milliseconds. Duration is mandatory when timed effect is set except for no_effect.
	 * Resolution decreases for a larger duration. e.g Effects with duration smaller than a minute will
	 * be rounded to a resolution of 1s, while effects with duration larger than an hour will be
	 * arounded up to a resolution of 300s. Duration has a max of 21600000 ms.
	 */
	duration?: number;
}

/** Feature containing properties to configure powerup behaviour of a lightsource. */
export interface LightPowerupGet {
	/** When setting the custom preset the additional properties can be set. For all other presets, no other properties can be included. */
	preset: PowerupPreset;
	/** Indicates if the shown values have been configured in the lightsource. */
	configured: boolean;
	on: {
		/**
		 * State to activate after powerup. On will use the value specified in the "on" property.
		 * Toggle will alternate between on and off on each subsequent power toggle. Previous will
		 * return to the state it was in before powering off.
		 */
		mode: PowerupOnMode;
		on?: OnFeature;
	};
	dimming?: {
		/**
		 * Dimming will set the brightness to the specified value after power up. Previous will set
		 * brightness to the state it was in before powering off.
		 */
		mode: PowerupDimmingMode;
		dimming?: {
			/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
			brightness: number;
		};
	};
	color?: {
		/**
		 * State to activate after powerup. Availability of "color_temperature" and "color" modes
		 * depend on the capabilities of the lamp. Previous will set color to the state it was in
		 * before powering off.
		 */
		mode: PowerupColorMode;
		color_temperature?: {
			/** color temperature in mirek or null when the light color is not in the ct spectrum. minimum: 50, maximum: 1000 */
			mirek: number | null;
		};
		color?: ColorFeatureBasicGet;
	};
}

/** Feature containing properties to configure powerup behaviour of a lightsource. */
export interface PowerupPut {
	/** When setting the custom preset the additional properties can be set. For all other presets, no other properties can be included. */
	preset: PowerupPreset;
	on?: {
		/** When setting mode "on", the on property must be included. */
		mode: PowerupOnMode;
		on?: OnFeaturePut;
	};
	dimming?: {
		/** When setting mode "dimming", the dimming property must be included. */
		mode: PowerupDimmingMode;
		dimming?: DimmingPut;
	};
	color?: {
		/**
		 * When setting color_temperature, the color_temperature property must be included.
		 * When setting color mode, the color property must be included.
		 */
		mode: PowerupColorMode;
		color_temperature?: ColorTemperaturePut;
		color?: ColorFeatureBasicPut;
	};
}

/** Configuration parameters that affect how content is deployed on a product */
export interface LightContentConfigurationGet {
	/** Orientation for content deployed on pixelated products when applicable (e.g. sunrise, candle) */
	orientation?: {
		status: ConfigurationStatus;
		/** Indicates if the product allows modifying the configuration attribute */
		configurable: boolean;
		orientation: ContentOrientation;
	};
	/** Order in which the content is represented on the pixels */
	order?: {
		status: ConfigurationStatus;
		/** Indicates if the product allows modifying the configuration attribute */
		configurable: boolean;
		order: ContentOrder;
	};
	/** Indicates if the service is associated with something, e.g. a screen */
	association?: {
		/** Defines what object the service is associated with */
		association: ContentAssociation;
	};
}

/** Configuration parameters that affect how content is deployed on a product */
export interface ContentConfigurationPut {
	/** Orientation for content deployed on pixelated products when applicable (e.g. sunrise, candle) */
	orientation?: {
		orientation?: ContentOrientation;
	};
	/** Order in which the content is represented on the pixels */
	order?: {
		order?: ContentOrder;
	};
	/** Indicates if the service is associated with something, e.g. a screen */
	association?: {
		/** Defines what object the service is associated with */
		association?: ContentAssociation;
	};
}

export interface LightGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	/** Owner of the service, in case the owner service is deleted, the service also gets deleted */
	owner: ResourceIdentifier;
	type: 'light';
	/** Additional metadata including a user given name */
	metadata: LightMetadataGet;
	/** Factory defaults of the product data */
	product_data?: LightProductData;
	identify: EmptyObject;
	/** Service identification number. 0 indicates service of a single instance. minimum: 0 */
	service_id: number;
	on: OnFeature;
	dimming?: LightDimmingGet;
	dimming_delta?: EmptyObject;
	dimming_configuration?: DimmingConfigurationGet;
	color_temperature?: LightColorTemperatureGet;
	color_temperature_delta?: EmptyObject;
	color?: LightColorGet;
	dynamics?: LightDynamicsGet;
	alert?: LightAlertGet;
	signaling?: LightSignalingGet;
	/** Mode the light is currently in */
	mode: LightMode;
	gradient?: LightGradientGet;
	/** @deprecated use effects_v2 */
	effects?: LightEffectsGet;
	effects_v2?: LightEffectsV2Get;
	timed_effects?: LightTimedEffectsGet;
	powerup?: LightPowerupGet;
	content_configuration?: LightContentConfigurationGet;
	/** Feature describing the geometry a light service. */
	geometry?: LightGeometry;
}

export interface IdentifyPut {
	/**
	 * identify: Triggers a visual identification sequence, current implemented as (which can change
	 * in the future): Bridge performs Zigbee LED identification cycles for 5 seconds Lights perform
	 * one breathe cycle Sensors perform LED identification cycles for 15 seconds
	 */
	action: 'identify';
	/** Duration in milliseconds to perform the identify cycle. */
	duration?: number;
}

export interface LightPut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	type?: 'light';
	/** Additional metadata including a user given name */
	metadata?: LightMetadataPut;
	identify?: IdentifyPut;
	on?: OnFeaturePut;
	dimming?: DimmingPut;
	dimming_delta?: DimmingDeltaPut;
	dimming_configuration?: DimmingConfigurationPut;
	color_temperature?: ColorTemperaturePut;
	color_temperature_delta?: ColorTemperatureDeltaPut;
	color?: ColorFeatureBasicPut;
	dynamics?: LightDynamicsPut;
	alert?: AlertPut;
	signaling?: SignalingPut;
	gradient?: GradientPut;
	/** @deprecated use effects_v2 */
	effects?: EffectsPut;
	effects_v2?: EffectsV2Put;
	timed_effects?: TimedEffectsPut;
	powerup?: PowerupPut;
	content_configuration?: ContentConfigurationPut;
	/** Feature describing the geometry a light service. */
	geometry?: LightGeometry;
}
