import type { Area } from './area';
import type { AreaLaneRegistry } from './area-lanes';
import { AreaNotDimmableError, InvalidBrightnessError } from './errors';
import type { AreaKind } from './gateway';

export class DimArea {
	private readonly lanes: AreaLaneRegistry;

	constructor(lanes: AreaLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(area: Area, brightness: number, kind: AreaKind): Promise<void> {
		if (!Number.isFinite(brightness) || brightness < 0 || brightness > 100) {
			throw new InvalidBrightnessError(brightness);
		}

		if (area.brightness.peek() === null) {
			throw new AreaNotDimmableError(kind, area.id);
		}

		return this.lanes.get(area).brightness.submit(brightness);
	}
}
