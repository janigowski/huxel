import { CommandLane } from './command-lane.js';
import type { HueGateway } from './gateway.js';
import type { Light } from './light.js';

export interface LightLanes {
	readonly power: CommandLane<boolean>;
	readonly brightness: CommandLane<number | null>;
}

export class LightLaneRegistry {
	readonly #gateway: HueGateway;
	readonly #settleMs: number;
	readonly #lanes = new Map<Light, LightLanes>();
	#disposed = false;

	constructor(gateway: HueGateway, settleMs: number) {
		this.#gateway = gateway;
		this.#settleMs = settleMs;
	}

	get(light: Light): LightLanes {
		let lanes = this.#lanes.get(light);
		if (!lanes) {
			lanes = this.#create(light);
			if (this.#disposed) {
				disposeLanes(lanes);
				return lanes;
			}
			this.#lanes.set(light, lanes);
		}
		return lanes;
	}

	delete(light: Light): void {
		const lanes = this.#lanes.get(light);
		if (lanes) {
			this.#lanes.delete(light);
			disposeLanes(lanes);
		}
	}

	dispose(): void {
		this.#disposed = true;
		this.#lanes.forEach(disposeLanes);
		this.#lanes.clear();
	}

	#create(light: Light): LightLanes {
		return {
			power: new CommandLane<boolean>(
				() => light.isOn.peek(),
				(isOn) => light.setPower(isOn),
				(isOn) => this.#gateway.setPower(light.id, isOn),
				this.#settleMs
			),
			brightness: new CommandLane<number | null>(
				() => light.brightness.peek(),
				(brightness) => light.setBrightness(brightness),
				(brightness) => this.#gateway.setBrightness(light.id, brightness ?? 0),
				this.#settleMs
			)
		};
	}
}

function disposeLanes(lanes: LightLanes): void {
	lanes.power.dispose();
	lanes.brightness.dispose();
}
