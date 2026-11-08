import type { LightLaneRegistry } from './light-lanes';
import { InvalidPresetError } from './errors';
import type { Light } from './light';
import { areaPreset, type PresetId } from './preset';

export class ApplyLightPreset {
	private readonly lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(light: Light, preset: PresetId): Promise<void> {
		const definition = areaPreset(preset);

		if (!definition) {
			throw new InvalidPresetError(preset);
		}

		const lanes = this.lanes.get(light);
		const temperatureOnly = light.color.peek() === null && light.temperature.peek() !== null;
		const commands = [
			temperatureOnly
				? lanes.temperature.submit(Object.freeze({ mirek: definition.mirek }))
				: lanes.color.submit(definition.color)
		];

		if (light.brightness.peek() !== null) {
			commands.push(lanes.brightness.submit(definition.brightness));
		}

		await Promise.all(commands);
	}
}
