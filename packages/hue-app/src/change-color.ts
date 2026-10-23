import type { XyColor } from './color';
import { InvalidColorError, LightNotColorCapableError } from './errors';
import type { Light } from './light';
import type { LightLaneRegistry } from './light-lanes';

export class ChangeColor {
	private readonly lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.lanes = lanes;
	}

	async execute(light: Light, color: XyColor): Promise<void> {
		if (!isValidColor(color)) {
			throw new InvalidColorError(color);
		}

		if (light.color.peek() === null) {
			throw new LightNotColorCapableError(light.id);
		}

		return this.lanes.get(light).color.submit(Object.freeze({ x: color.x, y: color.y }));
	}
}

function isValidColor(color: XyColor | null | undefined): color is XyColor {
	return typeof color === 'object' && color !== null && isUnit(color.x) && isUnit(color.y);
}

function isUnit(value: number): boolean {
	return Number.isFinite(value) && value >= 0 && value <= 1;
}
