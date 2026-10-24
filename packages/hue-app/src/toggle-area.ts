import type { Area } from './area';
import type { AreaLaneRegistry } from './area-lanes';

export class ToggleArea {
	private readonly lanes: AreaLaneRegistry;

	constructor(lanes: AreaLaneRegistry) {
		this.lanes = lanes;
	}

	execute(area: Area): Promise<void> {
		return this.lanes.get(area).power.submit(!area.isOn.peek());
	}
}
