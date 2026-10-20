import { HueApiError } from 'hue-sdk';
import type { HueClient, LightGet, LightPut, ResourceIdentifierResponse } from 'hue-sdk';
import type { BridgeLight, HueGateway } from './gateway.js';

const PARTIAL_SUCCESS_STATUS = 207;

/**
 * Expects a client created with `throttle: false`: the SDK's default write throttling can resolve
 * a command with another request's response and drop its outcome.
 */
export class HueSdkGateway implements HueGateway {
	readonly #client: HueClient;

	constructor(client: HueClient) {
		this.#client = client;
	}

	async listLights(): Promise<BridgeLight[]> {
		const response = await this.#client.lights.list();
		return response.data.map(toBridgeLight);
	}

	async setPower(lightId: string, isOn: boolean): Promise<void> {
		await this.#update(lightId, { on: { on: isOn } });
	}

	async setBrightness(lightId: string, brightness: number): Promise<void> {
		await this.#update(lightId, { dimming: { brightness } });
	}

	async #update(lightId: string, body: LightPut): Promise<void> {
		const response = await this.#client.lights.update(lightId, body);
		assertApplied(lightId, response);
	}
}

function toBridgeLight(light: LightGet): BridgeLight {
	return {
		id: light.id,
		name: light.metadata.name,
		isOn: light.on.on,
		brightness: light.dimming?.brightness ?? null
	};
}

function assertApplied(lightId: string, response: ResourceIdentifierResponse): void {
	const [first] = response.errors;
	if (first) {
		throw new HueApiError(
			`Hue bridge did not apply the update to light ${lightId}: ${first.description}`,
			PARTIAL_SUCCESS_STATUS,
			response.errors
		);
	}
}
