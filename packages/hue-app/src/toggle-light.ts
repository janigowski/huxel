import { CommandLane } from './command-lane.js';
import type { HueGateway } from './gateway.js';
import type { Light } from './light.js';

export class ToggleLight {
	readonly #gateway: HueGateway;
	readonly #lanes = new WeakMap<Light, CommandLane<boolean>>();

	constructor(gateway: HueGateway) {
		this.#gateway = gateway;
	}

	execute(light: Light): Promise<void> {
		return this.#lane(light).submit(!light.isOn.peek());
	}

	#lane(light: Light): CommandLane<boolean> {
		let lane = this.#lanes.get(light);
		if (!lane) {
			lane = new CommandLane(
				() => light.isOn.peek(),
				(isOn) => light.setPower(isOn),
				(isOn) => this.#gateway.setPower(light.id, isOn)
			);
			this.#lanes.set(light, lane);
		}
		return lane;
	}
}
