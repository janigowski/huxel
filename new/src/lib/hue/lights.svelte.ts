import type { HueClient, LightGet } from 'hue-sdk';
import { describeError } from './bridge';

export interface Light {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
}

function toLight(light: LightGet): Light {
	return {
		id: light.id,
		name: light.metadata.name,
		on: light.on.on,
		brightness: light.dimming ? Math.round(light.dimming.brightness) : null
	};
}

export class Lights {
	items = $state<Light[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	onCount = $derived(this.items.filter((light) => light.on).length);

	#client: HueClient;

	constructor(client: HueClient) {
		this.#client = client;
	}

	async load() {
		this.loading = true;
		this.error = null;

		try {
			const response = await this.#client.lights.list();
			this.items = response.data.map(toLight).sort((a, b) => a.name.localeCompare(b.name));
		} catch (error) {
			this.error = describeError(error);
		} finally {
			this.loading = false;
		}
	}

	async toggle(light: Light) {
		light.on = !light.on;

		try {
			await this.#client.lights.update(light.id, { on: { on: light.on } });
		} catch (error) {
			light.on = !light.on;
			this.error = describeError(error);
		}
	}
}
