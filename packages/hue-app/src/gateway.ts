/** Light state as reported by the bridge, in domain terms. */
export interface BridgeLight {
	id: string;
	name: string;
	isOn: boolean;
	/** Normalized 0–100, or `null` when the light cannot be dimmed. */
	brightness: number | null;
}

/** The bridge operations HueApp needs. Implementations reject when the bridge does not apply a command. */
export interface HueGateway {
	listLights(): Promise<BridgeLight[]>;
	setPower(lightId: string, isOn: boolean): Promise<void>;
	/** `brightness` is normalized 0–100. */
	setBrightness(lightId: string, brightness: number): Promise<void>;
}
