import type { Light } from './light.js';
import type { LightLaneRegistry } from './light-lanes.js';

export class ToggleLight {
	readonly #lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.#lanes = lanes;
	}

	execute(light: Light): Promise<void> {
		return this.#lanes.get(light).power.submit(!light.isOn.peek());
	}
}
