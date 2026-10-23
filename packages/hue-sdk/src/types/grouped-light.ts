import type { DeltaAction, EmptyObject, ResourceIdentifier, XYColor } from './common';
import type {
	AlertPut,
	ColorFeatureBasicPut,
	ColorTemperatureDeltaPut,
	ColorTemperaturePut,
	DimmingDeltaPut,
	DimmingPut,
	LightAlertGet,
	OnFeature,
	OnFeaturePut,
	SignalingPut,
	SignalType
} from './light';

export interface GroupedLightDimmingGet {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	brightness: number;
}

/** The schema declares no properties; fields are taken from the documented example. */
export interface GroupedLightDimmingDeltaGet {
	action?: DeltaAction;
	brightness_delta?: number;
}

/** The schema declares no properties; fields are taken from the documented example. */
export interface GroupedLightColorTemperatureGet {
	mirek?: number;
}

/** The schema declares no properties; fields are taken from the documented example. */
export interface GroupedLightColorTemperatureDeltaGet {
	action?: DeltaAction;
	mirek_delta?: number;
}

/** The schema declares no properties; fields are taken from the documented example. */
export interface GroupedLightColorGet {
	xy?: XYColor;
}

export interface GroupedLightSignalingGet {
	/** Signals that the light supports. */
	signal_values: SignalType[];
}

export interface GroupedLightDynamicsPut {
	/** Duration of a light transition in ms. */
	duration?: number;
}

export interface GroupedLightGet {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id: string;
	/** Clip v1 resource identifier. Pattern: `^(\/[a-z]{4,32}\/[0-9a-zA-Z-]{1,32})?$` */
	id_v1?: string;
	/** Owner of the service, in case the owner service is deleted, the service also gets deleted */
	owner: ResourceIdentifier;
	type: 'grouped_light';
	/** Joined on control & aggregated on state.| – “on” is true if any light in the group is on */
	on?: OnFeature;
	/** Joined dimming control – “dimming.brightness” contains average brightness of group containing turned-on lights only. */
	dimming?: GroupedLightDimmingGet;
	dimming_delta?: GroupedLightDimmingDeltaGet;
	/** Joined color temperature control */
	color_temperature?: GroupedLightColorTemperatureGet;
	color_temperature_delta?: GroupedLightColorTemperatureDeltaGet;
	/** Joined color control */
	color?: GroupedLightColorGet;
	/** Joined alert control */
	alert?: LightAlertGet;
	/** Feature containing basic signaling properties. */
	signaling?: GroupedLightSignalingGet;
	dynamics?: EmptyObject;
}

export interface GroupedLightPut {
	/** Unique identifier representing a specific resource instance. Pattern: `^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$` */
	id?: string;
	type?: 'grouped_light';
	/** Joined on control & aggregated on state.| – “on” is true if any light in the group is on */
	on?: OnFeaturePut;
	/** Joined dimming control – “dimming.brightness” contains average brightness of group containing turned-on lights only. */
	dimming?: DimmingPut;
	dimming_delta?: DimmingDeltaPut;
	/** Joined color temperature control */
	color_temperature?: ColorTemperaturePut;
	color_temperature_delta?: ColorTemperatureDeltaPut;
	/** Joined color control */
	color?: ColorFeatureBasicPut;
	/** Joined alert control */
	alert?: AlertPut;
	/** Feature containing basic signaling properties. */
	signaling?: SignalingPut;
	dynamics?: GroupedLightDynamicsPut;
}
