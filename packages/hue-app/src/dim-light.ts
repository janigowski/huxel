import { InvalidBrightnessError, LightNotDimmableError } from './errors.js';
import type { Light } from './light.js';
import type { LightLaneRegistry } from './light-lanes.js';

export class DimLight {
	readonly #lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.#lanes = lanes;
	}

	async execute(light: Light, brightness: number): Promise<void> {
		if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
			throw new InvalidBrightnessError(brightness);
		}
		if (light.brightness.peek() === null) {
			throw new LightNotDimmableError(light.id);
		}
		return this.#lanes.get(light).brightness.submit(brightness);
	}
}
