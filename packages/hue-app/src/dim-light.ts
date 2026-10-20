import { CommandLane } from './command-lane.js';
import { InvalidBrightnessError, LightNotDimmableError } from './errors.js';
import type { HueGateway } from './gateway.js';
import type { Light } from './light.js';

export class DimLight {
	readonly #gateway: HueGateway;
	readonly #lanes = new WeakMap<Light, CommandLane<number | null>>();

	constructor(gateway: HueGateway) {
		this.#gateway = gateway;
	}

	async execute(light: Light, brightness: number): Promise<void> {
		if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
			throw new InvalidBrightnessError(brightness);
		}
		if (light.brightness.peek() === null) {
			throw new LightNotDimmableError(light.id);
		}
		return this.#lane(light).submit(brightness);
	}

	#lane(light: Light): CommandLane<number | null> {
		let lane = this.#lanes.get(light);
		if (!lane) {
			lane = new CommandLane<number | null>(
				() => light.brightness.peek(),
				(brightness) => light.setBrightness(brightness),
				(brightness) => this.#gateway.setBrightness(light.id, brightness ?? 0)
			);
			this.#lanes.set(light, lane);
		}
		return lane;
	}
}
