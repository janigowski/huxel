import type { XyColor } from './color.js';

/** Light state as reported by the bridge, in domain terms. */
export interface BridgeLight {
	id: string;
	name: string;
	isOn: boolean;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	brightness: number | null;
	color: XyColor | null;
}

export type HueAppConnection = 'offline' | 'connecting' | 'live' | 'reconnecting';

export type LightChange =
	| {
			kind: 'updated';
			id: string;
			isOn?: boolean;
			brightness?: number;
			color?: XyColor;
			name?: string;
	  }
	| { kind: 'added'; light: BridgeLight }
	| { kind: 'removed'; id: string };

export interface LightChangeObserver {
	onChanges(changes: LightChange[]): void;
	onConnected(): void;
	onConnectionChange(state: HueAppConnection): void;
}

/** The bridge operations HueApp needs. Implementations reject when the bridge does not apply a command. */
export interface HueGateway {
	listLights(): Promise<BridgeLight[]>;
	setPower(lightId: string, isOn: boolean): Promise<void>;
	/** `brightness` is normalized 0–100. */
	setBrightness(lightId: string, brightness: number): Promise<void>;
	setColor(lightId: string, color: XyColor): Promise<void>;
	watch?(observer: LightChangeObserver): () => void;
}
