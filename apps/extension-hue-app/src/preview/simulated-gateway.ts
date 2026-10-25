import type { BridgeLight, HueGateway, LightChangeObserver, XyColor } from 'hue-app';

export interface SimulatedGatewayOptions {
	latencyMs?: number;
}

export class SimulatedGateway implements HueGateway {
	private readonly lights = new Map<string, BridgeLight>();
	private readonly observers = new Set<LightChangeObserver>();
	private readonly latencyMs: number;

	constructor(lights: readonly BridgeLight[], options: SimulatedGatewayOptions = {}) {
		for (const light of lights) {
			this.lights.set(light.id, { ...light });
		}

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

	async setPower(lightId: string, isOn: boolean): Promise<void> {
		await this.update(lightId, { isOn });
	}

	async setBrightness(lightId: string, brightness: number): Promise<void> {
		await this.update(lightId, { brightness });
	}

	async setColor(lightId: string, color: XyColor): Promise<void> {
		await this.update(lightId, { color });
	}

	async setTemperature(lightId: string, mirek: number): Promise<void> {
		await this.update(lightId, { temperature: { mirek } });
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

	private delay(): Promise<void> {
		if (this.latencyMs === 0) {
			return Promise.resolve();
		}

		return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
	}
}
