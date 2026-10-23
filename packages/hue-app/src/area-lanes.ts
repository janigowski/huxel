import type { XyColor } from './color';
import { CommandLane } from './command-lane';
import type { AreaGateway } from './gateway';
import type { Area } from './area';

export interface AreaLanes {
	readonly power: CommandLane<boolean>;
	readonly brightness: CommandLane<number | null>;
	readonly color: CommandLane<XyColor | null>;
}

export class AreaLaneRegistry {
	private readonly gateway: AreaGateway;
	private readonly settleMs: number;
	private readonly lanes = new Map<Area, AreaLanes>();
	private disposed = false;

	constructor(gateway: AreaGateway, settleMs: number) {
		this.gateway = gateway;
		this.settleMs = settleMs;
	}

	get(area: Area): AreaLanes {
		let lanes = this.lanes.get(area);
		if (!lanes) {
			lanes = this.create(area);
			if (this.disposed) {
				disposeLanes(lanes);
				return lanes;
			}
			this.lanes.set(area, lanes);
		}
		return lanes;
	}

	delete(area: Area): void {
		const lanes = this.lanes.get(area);
		if (lanes) {
			this.lanes.delete(area);
			disposeLanes(lanes);
		}
	}

	dispose(): void {
		this.disposed = true;
		this.lanes.forEach(disposeLanes);
		this.lanes.clear();
	}

	private create(area: Area): AreaLanes {
		return {
			power: new CommandLane<boolean>(
				() => area.isOn.peek(),
				(isOn) => area.setPower(isOn),
				(isOn) => this.gateway.setAreaPower(area.serviceId, isOn),
				this.settleMs
			),
			brightness: new CommandLane<number | null>(
				() => area.brightness.peek(),
				(brightness) => area.setBrightness(brightness),
				(brightness) => this.gateway.setAreaBrightness(area.serviceId, brightness ?? 0),
				this.settleMs
			),
			color: new CommandLane<XyColor | null>(
				() => area.color.peek(),
				(color) => area.setColor(color),
				(color) => (color ? this.gateway.setAreaColor(area.serviceId, color) : Promise.resolve()),
				this.settleMs
			)
		};
	}
}

function disposeLanes(lanes: AreaLanes): void {
	lanes.power.dispose();
	lanes.brightness.dispose();
	lanes.color.dispose();
}
