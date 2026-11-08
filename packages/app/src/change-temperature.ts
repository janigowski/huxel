import { LightNotTemperatureCapableError, InvalidMirekError } from './errors';
import type { LightLaneRegistry } from './light-lanes';
import type { Light } from './light';
import { isMirek } from './temperature';

export class ChangeTemperature {
	private readonly lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(light: Light, mirek: number): Promise<void> {
		if (!isMirek(mirek)) {
			throw new InvalidMirekError(mirek);
		}

		if (light.temperature.peek() === null) {
			throw new LightNotTemperatureCapableError(light.id);
		}

		return this.lanes.get(light).temperature.submit(Object.freeze({ mirek }));
	}
}
