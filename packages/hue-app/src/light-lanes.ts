import type { XyColor } from './color';
import { CommandLane } from './command-lane';
import type { HueGateway } from './gateway';
import type { Light } from './light';
import type { ColorTemperature } from './temperature';

export interface LightLanes {
	readonly power: CommandLane<boolean>;
	readonly brightness: CommandLane<number | null>;
	readonly color: CommandLane<XyColor | null>;
	readonly temperature: CommandLane<ColorTemperature | null>;
}

export class LightLaneRegistry {
	private readonly gateway: HueGateway;
	private readonly settleMs: number;
	private readonly lanes = new Map<Light, LightLanes>();
	private disposed = false;

	constructor(gateway: HueGateway, settleMs: number) {
		this.gateway = gateway;
		this.settleMs = settleMs;
	}

	get(light: Light): LightLanes {
		let lanes = this.lanes.get(light);
		if (!lanes) {
			lanes = this.create(light);
			if (this.disposed) {
				disposeLanes(lanes);
				return lanes;
			}
			this.lanes.set(light, lanes);
		}
		return lanes;
	}

	delete(light: Light): void {
		const lanes = this.lanes.get(light);
		if (lanes) {
			this.lanes.delete(light);
			disposeLanes(lanes);
		}
	}

	dispose(): void {
		this.disposed = true;
		this.lanes.forEach(disposeLanes);
		this.lanes.clear();
	}

	private create(light: Light): LightLanes {
		return {
			power: new CommandLane<boolean>(
				() => light.isOn.peek(),
				(isOn) => light.setPower(isOn),
				(isOn) => this.gateway.setPower(light.id, isOn),
				this.settleMs
			),
			brightness: new CommandLane<number | null>(
				() => light.brightness.peek(),
				(brightness) => light.setBrightness(brightness),
				(brightness) => this.gateway.setBrightness(light.id, brightness ?? 0),
				this.settleMs
			),
			color: new CommandLane<XyColor | null>(
				() => light.color.peek(),
				(color) => light.setColor(color),
				(color) => (color ? this.gateway.setColor(light.id, color) : Promise.resolve()),
				this.settleMs
			),
			temperature: new CommandLane<ColorTemperature | null>(
				() => light.temperature.peek(),
				(temperature) => light.setTemperature(temperature),
				(temperature) =>
					typeof temperature?.mirek === 'number'
						? this.gateway.setTemperature(light.id, temperature.mirek)
						: Promise.resolve(),
				this.settleMs
			)
		};
	}
}

function disposeLanes(lanes: LightLanes): void {
	lanes.power.dispose();
	lanes.brightness.dispose();
	lanes.color.dispose();
	lanes.temperature.dispose();
}
