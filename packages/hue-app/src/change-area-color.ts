import type { Area } from './area';
import type { AreaLaneRegistry } from './area-lanes';
import { isXyColor, type XyColor } from './color';
import { AreaNotColorCapableError, InvalidColorError } from './errors';
import type { AreaKind } from './gateway';

export class ChangeAreaColor {
	private readonly lanes: AreaLaneRegistry;

	constructor(lanes: AreaLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(area: Area, color: XyColor, kind: AreaKind): Promise<void> {
		if (!isXyColor(color)) {
			throw new InvalidColorError(color);
		}

		if (area.color.peek() === null) {
			throw new AreaNotColorCapableError(kind, area.id);
		}

		return this.lanes.get(area).color.submit(Object.freeze({ x: color.x, y: color.y }));
	}
}
