import { InvalidBrightnessError, LightNotDimmableError } from './errors';
import type { Light } from './light';
import type { LightLaneRegistry } from './light-lanes';

export class DimLight {
	private readonly lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(light: Light, brightness: number): Promise<void> {
		if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
			throw new InvalidBrightnessError(brightness);
		}
		if (light.brightness.peek() === null) {
			throw new LightNotDimmableError(light.id);
		}
		return this.lanes.get(light).brightness.submit(brightness);
	}
}
