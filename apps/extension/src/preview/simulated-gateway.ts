import {
	hexToXy,
	mirekToHex,
	type BridgeArea,
	type BridgeLight,
	type HueGateway,
	type LightChangeObserver,
	type XyColor
} from '@huxel/app';

export interface SimulatedGatewayOptions {
	latencyMs?: number;
	rooms?: readonly BridgeArea[];
	zones?: readonly BridgeArea[];
}

export class SimulatedGateway implements HueGateway {
	private readonly lights = new Map<string, BridgeLight>();
	private readonly rooms: BridgeArea[];
	private readonly zones: BridgeArea[];
	private readonly observers = new Set<LightChangeObserver>();
	private readonly latencyMs: number;

	constructor(lights: readonly BridgeLight[], options: SimulatedGatewayOptions = {}) {
		for (const light of lights) {
			this.lights.set(light.id, { ...light });
		}

		this.rooms = (options.rooms ?? []).map(copyArea);
		this.zones = (options.zones ?? []).map(copyArea);
		this.latencyMs = options.latencyMs ?? 0;
	}

	get watcherCount(): number {
		return this.observers.size;
	}

	get snapshot(): BridgeLight[] {
		return [...this.lights.values()].map((light) => ({ ...light }));
	}

	async listLights(): Promise<BridgeLight[]> {
		await this.delay();

		return this.snapshot;
	}

	async listAreas(): Promise<{ rooms: BridgeArea[]; zones: BridgeArea[] }> {
		await this.delay();

		return {
			rooms: this.rooms.map(copyArea),
			zones: this.zones.map(copyArea)
		};
	}

	async setAreaPower(serviceId: string, isOn: boolean): Promise<void> {
		await this.delay();
		this.findArea(serviceId).isOn = isOn;
	}

	async setAreaBrightness(serviceId: string, brightness: number): Promise<void> {
		await this.delay();
		this.findArea(serviceId).brightness = brightness;
	}

	async setAreaColor(serviceId: string, color: XyColor): Promise<void> {
		await this.delay();
		this.findArea(serviceId).color = color;
	}

	async setAreaTemperature(serviceId: string, mirek: number): Promise<void> {
		await this.delay();
		this.findArea(serviceId).temperature = { mirek };
	}

	async setPower(lightId: string, isOn: boolean): Promise<void> {
		await this.update(lightId, { isOn });
	}

	async setBrightness(lightId: string, brightness: number): Promise<void> {
		await this.update(lightId, { brightness });
	}

	async setColor(lightId: string, color: XyColor): Promise<void> {
		const light = this.lights.get(lightId);
		const temperature = light?.temperature ? { mirek: null } : undefined;

		await this.update(lightId, { color, ...(temperature ? { temperature } : {}) });
	}

	async setTemperature(lightId: string, mirek: number): Promise<void> {
		const light = this.lights.get(lightId);
		const color = light?.color ? hexToXy(mirekToHex(mirek)) : undefined;

		await this.update(lightId, { temperature: { mirek }, ...(color ? { color } : {}) });
	}

	watch(observer: LightChangeObserver): () => void {
		this.observers.add(observer);

		queueMicrotask(() => {
			if (this.observers.has(observer)) {
				observer.onConnectionChange('live');
				observer.onConnected();
			}
		});

		return () => {
			this.observers.delete(observer);
		};
	}

	private async update(
		lightId: string,
		change: Partial<Pick<BridgeLight, 'isOn' | 'brightness' | 'color' | 'temperature'>>
	): Promise<void> {
		await this.delay();

		const light = this.lights.get(lightId);

		if (!light) {
			throw new Error(`Light ${lightId} not found`);
		}

		Object.assign(light, change);

		for (const observer of this.observers) {
			observer.onChanges([
				{
					kind: 'updated',
					id: lightId,
					isOn: change.isOn,
					brightness: change.brightness ?? undefined,
					color: change.color ?? undefined,
					temperature: change.temperature ?? undefined
				}
			]);
		}
	}

	private findArea(serviceId: string): BridgeArea {
		const area = [...this.rooms, ...this.zones].find((item) => item.serviceId === serviceId);

		if (!area) {
			throw new Error(`Area ${serviceId} not found`);
		}

		return area;
	}

	private delay(): Promise<void> {
		if (this.latencyMs === 0) {
			return Promise.resolve();
		}

		return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
	}
}

function copyArea(area: BridgeArea): BridgeArea {
	return {
		...area,
		temperature: area.temperature ? { ...area.temperature } : null,
		color: area.color ? { ...area.color } : null,
		children: [...area.children]
	};
}
