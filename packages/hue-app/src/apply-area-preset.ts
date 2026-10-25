import type { Area } from './area';
import type { AreaLaneRegistry } from './area-lanes';
import { InvalidPresetError } from './errors';
import { areaPreset, type PresetId } from './preset';

export class ApplyAreaPreset {
	private readonly lanes: AreaLaneRegistry;

	constructor(lanes: AreaLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(area: Area, preset: PresetId): Promise<void> {
		const definition = areaPreset(preset);

		if (!definition) {
			throw new InvalidPresetError(preset);
		}

		const lanes = this.lanes.get(area);
		const temperatureOnly = area.color.peek() === null && area.temperature.peek() !== null;
		const commands = [
			temperatureOnly
				? lanes.temperature.submit(Object.freeze({ mirek: definition.mirek }))
				: lanes.color.submit(definition.color)
		];

		if (area.brightness.peek() !== null) {
			commands.push(lanes.brightness.submit(definition.brightness));
		}

		await Promise.all(commands);
	}
}
