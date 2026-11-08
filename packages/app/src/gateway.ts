import type { XyColor } from './color';
import type { ColorTemperature } from './temperature';

/** Light state as reported by the bridge, in domain terms. */
export interface BridgeLight {
	id: string;
	name: string;
	isOn: boolean;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	brightness: number | null;
	color: XyColor | null;
	/** `null` when the light has no color temperature. */
	temperature: ColorTemperature | null;
}

export type HueAppConnection = 'offline' | 'connecting' | 'live' | 'reconnecting';

export type LightChange =
	| {
			kind: 'updated';
			id: string;
			isOn?: boolean;
			brightness?: number;
			color?: XyColor;
			temperature?: ColorTemperature;
			name?: string;
	  }
	| { kind: 'added'; light: BridgeLight }
	| { kind: 'removed'; id: string };

export type AreaKind = 'room' | 'zone';

/** Room or zone state joined with its grouped light, in domain terms. */
export interface BridgeArea {
	id: string;
	name: string;
	serviceId: string;
	isOn: boolean;
	/** Normalized 0–100, or `null` when the group cannot be dimmed. */
	brightness: number | null;
	color: XyColor | null;
	/** `null` when the grouped light has no color temperature. */
	temperature: ColorTemperature | null;
	/** Light ids that contribute to `colors`, in child order. */
	children: readonly string[];
}

export interface AreaFields {
	name?: string;
	isOn?: boolean;
	brightness?: number | null;
	color?: XyColor | null;
	temperature?: ColorTemperature | null;
	serviceId?: string;
	children?: readonly string[];
}

export type AreaChange =
	| ({ kind: 'updated'; resource: AreaKind; id: string } & AreaFields)
	| { kind: 'added'; resource: AreaKind; area: BridgeArea }
	| { kind: 'removed'; resource: AreaKind; id: string }
	| ({ kind: 'service-updated'; serviceId: string } & Pick<
			AreaFields,
			'isOn' | 'brightness' | 'color' | 'temperature'
	  >)
	| { kind: 'service-removed'; serviceId: string };

export interface LightChangeObserver {
	onChanges(changes: LightChange[]): void;
	onConnected(): void;
	onConnectionChange(state: HueAppConnection): void;
	onAreaChanges?(changes: AreaChange[]): void;
}

export interface AreaGateway {
	listAreas(): Promise<{ rooms: BridgeArea[]; zones: BridgeArea[] }>;
	setAreaPower(serviceId: string, isOn: boolean): Promise<void>;
	/** `brightness` is normalized 0–100. */
	setAreaBrightness(serviceId: string, brightness: number): Promise<void>;
	setAreaColor(serviceId: string, color: XyColor): Promise<void>;
	setAreaTemperature(serviceId: string, mirek: number): Promise<void>;
}

/** The bridge operations HueApp needs. Implementations reject when the bridge does not apply a command. */
export interface HueGateway {
	listLights(): Promise<BridgeLight[]>;
	setPower(lightId: string, isOn: boolean): Promise<void>;
	/** `brightness` is normalized 0–100. */
	setBrightness(lightId: string, brightness: number): Promise<void>;
	setColor(lightId: string, color: XyColor): Promise<void>;
	setTemperature(lightId: string, mirek: number): Promise<void>;
	watch?(observer: LightChangeObserver): () => void;
	listAreas?(): Promise<{ rooms: BridgeArea[]; zones: BridgeArea[] }>;
	setAreaPower?(serviceId: string, isOn: boolean): Promise<void>;
	/** `brightness` is normalized 0–100. */
	setAreaBrightness?(serviceId: string, brightness: number): Promise<void>;
	setAreaColor?(serviceId: string, color: XyColor): Promise<void>;
	setAreaTemperature?(serviceId: string, mirek: number): Promise<void>;
}
