import type {
	Brightness,
	ColorXY,
	DeltaAction,
	Mirek,
	On,
	Resource,
	ResourceIdentifier,
	XY
} from './common';

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
	| 'string_permanent';

export type LightFunction = 'functional' | 'decorative' | 'mixed' | 'unknown';

export type LightMode = 'normal' | 'streaming';

export type GamutType = 'A' | 'B' | 'C' | 'other';

export type DynamicsStatus = 'dynamic_palette' | 'none';

export type AlertAction = 'breathe';

export type Signal = 'no_signal' | 'on_off' | 'on_off_color' | 'alternating';

export type GradientMode =
	| 'interpolated_palette'
	| 'interpolated_palette_mirrored'
	| 'random_pixelated'
	| 'segmented_palette';

export type LightEffect =
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

export type TimedEffect = 'sunrise' | 'sunset' | 'no_effect';

export type PowerupPreset = 'safety' | 'powerfail' | 'last_on_state' | 'custom';

export type PowerupOnMode = 'on' | 'toggle' | 'previous';

export type PowerupDimmingMode = 'dimming' | 'previous';

export type PowerupColorMode = 'color_temperature' | 'color' | 'previous';

export interface LightMetadata {
	name: string;
	archetype: LightArchetype;
	function: LightFunction;
	fixed_mired?: number;
}

export interface LightDimming extends Brightness {
	min_dim_level?: number;
}

export interface MirekSchema {
	mirek_minimum: number;
	mirek_maximum: number;
}

export interface LightColorTemperature {
	mirek: number | null;
	mirek_valid: boolean;
	mirek_schema: MirekSchema;
}

export interface Gamut {
	red: XY;
	green: XY;
	blue: XY;
}

export interface LightColor extends ColorXY {
	gamut?: Gamut;
	gamut_type: GamutType;
}

export interface LightDynamics {
	status: DynamicsStatus;
	status_values: DynamicsStatus[];
	speed: number;
	speed_valid: boolean;
}

export interface LightAlert {
	action_values: AlertAction[];
}

export interface SignalingStatus {
	signal: Signal;
	estimated_end: string;
	colors?: ColorXY[];
}

export interface LightSignaling {
	signal_values: Signal[];
	status?: SignalingStatus;
}

export interface GradientPoint {
	color: ColorXY;
}

export interface LightGradient {
	points: GradientPoint[];
	mode: GradientMode;
	points_capable: number;
	mode_values: GradientMode[];
	pixel_count?: number;
}

export interface LightEffects {
	status: LightEffect;
	status_values: LightEffect[];
	effect_values: LightEffect[];
}

export interface EffectParameters {
	color?: ColorXY;
	color_temperature?: Mirek;
	speed?: number;
}

export interface LightEffectsV2 {
	action: {
		effect_values: LightEffect[];
	};
	status: {
		effect: LightEffect;
		effect_values: LightEffect[];
		parameters?: EffectParameters;
	};
}

export interface LightTimedEffects {
	effect: TimedEffect;
	effect_values: TimedEffect[];
	status: TimedEffect;
	status_values: TimedEffect[];
	duration?: number;
}

export interface PowerupOn {
	mode: PowerupOnMode;
	on?: On;
}

export interface PowerupDimming {
	mode: PowerupDimmingMode;
	dimming?: Brightness;
}

export interface PowerupColor {
	mode: PowerupColorMode;
	color_temperature?: Mirek;
	color?: ColorXY;
}

export interface LightPowerup {
	preset: PowerupPreset;
	configured: boolean;
	on: PowerupOn;
	dimming?: PowerupDimming;
	color?: PowerupColor;
}

export interface Light extends Resource<'light'> {
	owner: ResourceIdentifier;
	metadata: LightMetadata;
	on: On;
	mode: LightMode;
	dimming?: LightDimming;
	color_temperature?: LightColorTemperature;
	color?: LightColor;
	dynamics?: LightDynamics;
	alert?: LightAlert;
	signaling?: LightSignaling;
	gradient?: LightGradient;
	effects?: LightEffects;
	effects_v2?: LightEffectsV2;
	timed_effects?: LightTimedEffects;
	powerup?: LightPowerup;
}

export interface LightIdentify {
	action: 'identify';
	duration?: number;
}

export interface DimmingDelta {
	action: DeltaAction;
	brightness_delta?: number;
}

export interface ColorTemperatureDelta {
	action: DeltaAction;
	mirek_delta?: number;
}

export interface DynamicsUpdate {
	duration?: number;
	speed?: number;
}

export interface SignalingUpdate {
	signal: Signal;
	duration: number;
	colors?: ColorXY[];
}

export interface GradientUpdate {
	points: GradientPoint[];
	mode?: GradientMode;
}

export interface EffectsV2Update {
	action: {
		effect: LightEffect;
		parameters?: EffectParameters;
	};
}

export interface TimedEffectsUpdate {
	effect: TimedEffect;
	duration?: number;
}

export interface PowerupUpdate {
	preset: PowerupPreset;
	on?: PowerupOn;
	dimming?: PowerupDimming;
	color?: PowerupColor;
}

export interface LightUpdate {
	type?: 'light';
	metadata?: Partial<Omit<LightMetadata, 'fixed_mired'>>;
	identify?: LightIdentify;
	on?: On;
	dimming?: Brightness;
	dimming_delta?: DimmingDelta;
	color_temperature?: Mirek;
	color_temperature_delta?: ColorTemperatureDelta;
	color?: ColorXY;
	dynamics?: DynamicsUpdate;
	alert?: { action: AlertAction };
	signaling?: SignalingUpdate;
	gradient?: GradientUpdate;
	effects?: { effect: LightEffect };
	effects_v2?: EffectsV2Update;
	timed_effects?: TimedEffectsUpdate;
	powerup?: PowerupUpdate;
}
