import type { Area } from './area';
import type { AreaLaneRegistry } from './area-lanes';
import { AreaNotTemperatureCapableError, InvalidMirekError } from './errors';
import type { AreaKind } from './gateway';
import { isMirek } from './temperature';

export class ChangeAreaTemperature {
	private readonly lanes: AreaLaneRegistry;

	constructor(lanes: AreaLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(area: Area, mirek: number, kind: AreaKind): Promise<void> {
		if (!isMirek(mirek)) {
			throw new InvalidMirekError(mirek);
		}

		if (area.temperature.peek() === null) {
			throw new AreaNotTemperatureCapableError(kind, area.id);
		}

		return this.lanes.get(area).temperature.submit(Object.freeze({ mirek }));
	}
}
