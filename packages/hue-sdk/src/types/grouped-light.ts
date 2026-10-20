import type { DeltaAction, EmptyObject, ResourceIdentifier } from './common.js';
import type {
	AlertPut,
	ColorFeatureBasicGet,
	ColorFeatureBasicPut,
	ColorTemperatureDeltaPut,
	ColorTemperaturePut,
	DimmingDeltaPut,
	DimmingPut,
	LightAlertGet,
	LightDynamicsPut,
	OnFeature,
	OnFeaturePut,
	SignalingPut,
	SignalType
} from './light.js';

export interface GroupedLightDimmingGet {
	/** Brightness percentage. Value 0 is the lowest possible brightness. maximum: 100 */
	brightness: number;
}

export interface GroupedLightDimmingDeltaGet {
	/** The delta action to apply */
	action?: DeltaAction;
	/** Brightness percentage of full-scale increase delta to current dimlevel. Clip at Max-level or Min-level. maximum: 100 */
	brightness_delta?: number;
}

export interface GroupedLightColorTemperatureGet {
	/** color temperature in mirek. minimum: 50, maximum: 1000 */
	mirek?: number;
}

export interface GroupedLightColorTemperatureDeltaGet {
	/** The delta action to apply */
	action?: DeltaAction;
	/** Mirek delta to current mirek. Clip at mirek_minimum and mirek_maximum of mirek_schema. maximum: 950 */
	mirek_delta?: number;
}

export interface GroupedLightSignalingGet {
	/** Signals that the light supports. */
	signal_values: SignalType[];
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
	color?: ColorFeatureBasicGet;
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
	dynamics?: LightDynamicsPut;
}
