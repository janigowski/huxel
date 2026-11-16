import type { XyColor } from './color';
import { CommandLane } from './command-lane';
import type { HueGateway } from './gateway';
import type { Area } from './area';
import type { ColorTemperature } from './temperature';

export interface AreaLanes {
	readonly power: CommandLane<boolean>;
	readonly brightness: CommandLane<number | null>;
	readonly color: CommandLane<XyColor | null>;
	readonly temperature: CommandLane<ColorTemperature | null>;
}

export class AreaLaneRegistry {
	private readonly gateway: HueGateway;
	private readonly settleMs: number;
	private readonly lanes = new Map<Area, AreaLanes>();
	private disposed = false;

	constructor(gateway: HueGateway, settleMs: number) {
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
				(color) => (color ? sendColor(this.gateway, area, color) : Promise.resolve()),
				this.settleMs
			),
			temperature: new CommandLane<ColorTemperature | null>(
				() => area.temperature.peek(),
				(temperature) => area.setTemperature(temperature),
				(temperature) =>
					typeof temperature?.mirek === 'number'
						? sendTemperature(this.gateway, area, temperature.mirek)
						: Promise.resolve(),
				this.settleMs
			)
		};
	}
}

async function sendColor(gateway: HueGateway, area: Area, color: XyColor): Promise<void> {
	const lights = () => area.colorCapableChildren();

	if (area.reportsGroupedColor()) {
		try {
			await gateway.setAreaColor?.(area.serviceId, color);
			return;
		} catch (error) {
			if (lights().length === 0) {
				throw error;
			}
		}
	}

	const targets = lights();

	if (targets.length === 0) {
		await gateway.setAreaColor?.(area.serviceId, color);
		return;
	}

	await Promise.all(targets.map((light) => gateway.setColor(light.id, color)));
}

async function sendTemperature(gateway: HueGateway, area: Area, mirek: number): Promise<void> {
	const lights = () => area.temperatureCapableChildren();

	if (area.reportsGroupedTemperature()) {
		try {
			await gateway.setAreaTemperature?.(area.serviceId, mirek);
			return;
		} catch (error) {
			if (lights().length === 0) {
				throw error;
			}
		}
	}

	const targets = lights();

	if (targets.length === 0) {
		await gateway.setAreaTemperature?.(area.serviceId, mirek);
		return;
	}

	await Promise.all(targets.map((light) => gateway.setTemperature(light.id, mirek)));
}

function disposeLanes(lanes: AreaLanes): void {
	lanes.power.dispose();
	lanes.brightness.dispose();
	lanes.color.dispose();
	lanes.temperature.dispose();
}
