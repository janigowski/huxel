import type { EmptyObject, ResourceIdentifier, XYColor } from './common';
import type {
	ColorFeatureBasicGet,
	ColorFeatureBasicPut,
	ColorTemperaturePut,
	DimmingPut,
	EffectType,
	EffectsPut,
	EffectsV2Put,
	GradientMode,
	GradientPointGet,
	GradientPut,
	OnFeature,
	OnFeaturePut
} from './light';

export type SceneActiveStatus = 'inactive' | 'static' | 'dynamic_palette';

export type SceneRecallAction = 'active' | 'dynamic_palette' | 'static';

export type SceneMappingAlgorithm = 'classic' | 'spatial';

export type SceneActionsUpdateSource = 'clip' | 'autogrow';

export interface SceneDimmingGet {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	brightness: number;
}

export interface SceneDimmingPost {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	brightness: number;
}

export interface SceneColorPost {
	/** CIE XY gamut position */
	xy: XYColor;
}

export interface SceneColorTemperatureGet {
	/** color temperature in mirek or null when the light color is not in the ct spectrum. minimum: 50, maximum: 1000 */
	mirek: number | null;
}

export interface SceneColorTemperaturePost {
	/** color temperature in mirek or null when the light color is not in the ct spectrum. minimum: 50, maximum: 1000 */
	mirek: number;
}

export interface SceneGradientPointPost {
	color: SceneColorPost;
}

/** Basic feature containing gradient properties and rotation_2d. */
export interface SceneGradientGet {
	/**
	 * Collection of gradients points. For control of the gradient points through a PUT a minimum
	 * of 2 points need to be provided. maxItems: 5
	 */
	points: GradientPointGet[];
	/** Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette */
	mode: GradientMode;
}

/** Basic feature containing gradient properties and rotation_2d. */
export interface SceneGradientPost {
	/**
	 * Collection of gradients points. For control of the gradient points through a PUT a minimum
	 * of 2 points need to be provided. maxItems: 5
	 */
	points: SceneGradientPointPost[];
	/** Mode in which the points are currently being deployed. If not provided during PUT/POST it will be defaulted to interpolated_palette */
	mode?: GradientMode;
}

export interface SceneEffectsGet {
	effect: EffectType;
}

export interface SceneEffectParametersGet {
	color?: ColorFeatureBasicGet;
	color_temperature?: SceneColorTemperatureGet;
	/** minimum: 0, maximum: 1 */
	speed?: number;
}

export interface SceneEffectParametersPost {
	color?: SceneColorPost;
	color_temperature?: SceneColorTemperaturePost;
	/** minimum: 0, maximum: 1 */
	speed?: number;
}

export interface SceneEffectsV2ActionGet {
	effect: EffectType;
	parameters?: SceneEffectParametersGet;
}

export interface SceneEffectsV2ActionPost {
	effect: EffectType;
	parameters?: SceneEffectParametersPost;
}

/** Basic feature containing effects v2 properties */
export interface SceneEffectsV2Get {
	action: SceneEffectsV2ActionGet;
}

/** Basic feature containing effects v2 properties */
export interface SceneEffectsV2Post {
	action: SceneEffectsV2ActionPost;
}

export interface SceneDynamics {
	/** Duration of a light transition in ms. */
	duration?: number;
}

/** the action to be executed on recall */
export interface SceneActionContentGet {
	on?: OnFeature;
	dimming?: SceneDimmingGet;
	color?: ColorFeatureBasicGet;
	color_temperature?: SceneColorTemperatureGet;
	/** Basic feature containing gradient properties and rotation_2d. */
	gradient?: SceneGradientGet;
	/** @deprecated Deprecated: use effects_v2 */
	effects?: SceneEffectsGet;
	/** Basic feature containing effects v2 properties */
	effects_v2?: SceneEffectsV2Get;
	dynamics?: SceneDynamics;
}

/** the action to be executed on recall */
export interface SceneActionContentPost {
	on?: OnFeature;
	dimming?: SceneDimmingPost;
	color?: SceneColorPost;
	color_temperature?: SceneColorTemperaturePost;
	/** Basic feature containing gradient properties and rotation_2d. */
	gradient?: SceneGradientPost;
	/** @deprecated Deprecated: use effects_v2 */
	effects?: EffectsPut;
	/** Basic feature containing effects v2 properties */
	effects_v2?: SceneEffectsV2Post;
	dynamics?: SceneDynamics;
}

/** the action to be executed on recall */
export interface SceneActionContentPut {
	on?: OnFeaturePut;
	dimming?: DimmingPut;
	color?: ColorFeatureBasicPut;
	color_temperature?: ColorTemperaturePut;
	/** Basic feature containing gradient properties and rotation_2d. */
	gradient?: GradientPut;
	/** @deprecated Deprecated: use effects_v2 */
	effects?: EffectsPut;
	/** Basic feature containing effects v2 properties */
	effects_v2?: EffectsV2Put;
	dynamics?: SceneDynamics;
}

export interface SceneActionGet {
	/** The identifier of the light to execute the action on */
	target: ResourceIdentifier;
	/** the action to be executed on recall */
	action: SceneActionContentGet;
}

export interface SceneActionPost {
	/** The identifier of the light to execute the action on */
	target: ResourceIdentifier;
	/** the action to be executed on recall */
	action: SceneActionContentPost;
}

export interface SceneActionPut {
	/** The identifier of the light to execute the action on */
	target: ResourceIdentifier;
	/** the action to be executed on recall */
	action: SceneActionContentPut;
}

export interface ScenePaletteColorGet {
	color: ColorFeatureBasicGet;
	dimming: SceneDimmingGet;
}

export interface ScenePaletteColorPost {
	color: SceneColorPost;
	dimming: SceneDimmingPost;
}

export interface ScenePaletteColorPut {
	color: ColorFeatureBasicPut;
	dimming: DimmingPut;
}

export interface ScenePaletteColorTemperatureGet {
	color_temperature: SceneColorTemperatureGet;
	dimming: SceneDimmingGet;
}

export interface ScenePaletteColorTemperaturePost {
	color_temperature: SceneColorTemperaturePost;
	dimming: SceneDimmingPost;
}

export interface ScenePaletteColorTemperaturePut {
	color_temperature: ColorTemperaturePut;
	dimming: DimmingPut;
}

/** Group of colors that describe the palette of colors to be used when playing dynamics */
export interface ScenePaletteGet {
	/** minItems: 0, maxItems: 9 */
	color: ScenePaletteColorGet[];
	/** minItems: 0, maxItems: 1 */
	dimming: SceneDimmingGet[];
	/** minItems: 0, maxItems: 1 */
	color_temperature: ScenePaletteColorTemperatureGet[];
	/**
	 * Deprecated. use effects_v2. minItems: 0, maxItems: 3
	 * @deprecated Deprecated. use effects_v2
	 */
	effects: SceneEffectsGet[];
	/** minItems: 0, maxItems: 3 */
	effects_v2: SceneEffectsV2Get[];
}

/** Group of colors that describe the palette of colors to be used when playing dynamics */
export interface ScenePalettePost {
	/** minItems: 0, maxItems: 9 */
	color: ScenePaletteColorPost[];
	/** minItems: 0, maxItems: 1 */
	dimming: SceneDimmingPost[];
	/** minItems: 0, maxItems: 1 */
	color_temperature: ScenePaletteColorTemperaturePost[];
	/**
	 * Deprecated. use effects_v2. minItems: 0, maxItems: 3
	 * @deprecated Deprecated. use effects_v2
	 */
	effects?: EffectsPut[];
	/** minItems: 0, maxItems: 3 */
	effects_v2?: SceneEffectsV2Post[];
}

/** Group of colors that describe the palette of colors to be used when playing dynamics */
export interface ScenePalettePut {
	/** minItems: 0, maxItems: 9 */
	color: ScenePaletteColorPut[];
	/** minItems: 0, maxItems: 1 */
	dimming: DimmingPut[];
	/** minItems: 0, maxItems: 1 */
	color_temperature: ScenePaletteColorTemperaturePut[];
	/**
	 * Deprecated. use effects_v2. minItems: 0, maxItems: 3
	 * @deprecated Deprecated. use effects_v2
	 */
	effects?: EffectsPut[];
	/** minItems: 0, maxItems: 3 */
	effects_v2?: EffectsV2Put[];
}

export interface SceneMetadataGet {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation */
	image?: ResourceIdentifier;
	/** Application specific data. Free format string. minLength: 1, maxLength: 16 */
	appdata?: string;
}

export interface SceneMetadataPost {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name: string;
	/** Reference with unique identifier for the image representing the scene only accepting “rtype”: “public_image” on creation */
	image?: ResourceIdentifier;
	/** Application specific data. Free format string. minLength: 1, maxLength: 16 */
	appdata?: string;
}

export interface SceneMetadataPut {
	/** Human readable name of a resource. minLength: 1, maxLength: 32 */
	name?: string;
	/** Application specific data. Free format string. minLength: 1, maxLength: 16 */
	appdata?: string;
}

/** Details about the used scene mapping. Only available with SpatialAware. */
export interface SceneMapping {
	/** Algorithm used for the mapping */
	algorithm?: SceneMappingAlgorithm;
}

/** Consists the information about the current status and last time it is recalled */
export interface SceneStatus {
	active?: SceneActiveStatus;
	/** Datetime of the last recall of the scene */
	last_recall?: string;
}

export interface SceneLastActionsUpdate {
	/** Source of most recent actions list update. Autogrow means the system updated the scene because lights were added or removed. */
	source: SceneActionsUpdateSource;
}

export interface SceneRecallPut {
	/** When writing active, the actions in the scene are executed on the target. dynamic_palette starts dynamic scene with colors in the Palette object. */
	action?: SceneRecallAction;
	/** transition to the scene within the timeframe given by duration */
	duration?: number;
	/** override the scene dimming/brightness */
	dimming?: DimmingPut;
}

export interface SceneGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	/** List of actions to be executed synchronously on recall */
	actions: SceneActionGet[];
	/** Group of colors that describe the palette of colors to be used when playing dynamics */
	palette?: ScenePaletteGet;
	recall: EmptyObject;
	/** Type of the supported resources */
	type: 'scene';
	metadata: SceneMetadataGet;
	/** Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is updated (e.g. light added/removed) */
	group: ResourceIdentifier;
	/** Speed of dynamic palette for this scene. minimum: 0, maximum: 1 */
	speed: number;
	/** Indicates whether to automatically start the scene dynamically on active recall */
	auto_dynamic: boolean;
	/** Consists the information about the current status and last time it is recalled */
	status: SceneStatus;
	/** Details about the used scene mapping. Only available with SpatialAware. */
	mapping?: SceneMapping;
	last_actions_update?: SceneLastActionsUpdate;
}

export interface ScenePost {
	/** List of actions to be executed synchronously on recall */
	actions: SceneActionPost[];
	/** Group of colors that describe the palette of colors to be used when playing dynamics */
	palette?: ScenePalettePost;
	/** Type of the supported resources */
	type?: 'scene';
	metadata: SceneMetadataPost;
	/** Group associated with this Scene. All services in the group are part of this scene. If the group is changed the scene is updated (e.g. light added/removed) */
	group: ResourceIdentifier;
	/** Speed of dynamic palette for this scene. minimum: 0, maximum: 1 */
	speed?: number;
	/** Indicates whether to automatically start the scene dynamically on active recall */
	auto_dynamic?: boolean;
	/** Details about the used scene mapping. Only available with SpatialAware. */
	mapping?: SceneMapping;
}

export interface ScenePut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	/** List of actions to be executed synchronously on recall */
	actions?: SceneActionPut[];
	/** Group of colors that describe the palette of colors to be used when playing dynamics */
	palette?: ScenePalettePut;
	recall?: SceneRecallPut;
	/** Type of the supported resources */
	type?: 'scene';
	metadata?: SceneMetadataPut;
	/** Speed of dynamic palette for this scene. minimum: 0, maximum: 1 */
	speed?: number;
	/** Indicates whether to automatically start the scene dynamically on active recall */
	auto_dynamic?: boolean;
	/** Details about the used scene mapping. Only available with SpatialAware. */
	mapping?: SceneMapping;
}
