import type { Light } from './light';
import type { LightLaneRegistry } from './light-lanes';

export class ToggleLight {
	private readonly lanes: LightLaneRegistry;

	constructor(lanes: LightLaneRegistry) {
		this.lanes = lanes;
	}

	execute(light: Light): Promise<void> {
		return this.lanes.get(light).power.submit(!light.isOn.peek());
	}
}
