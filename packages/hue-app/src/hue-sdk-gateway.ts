import { HueApiError } from 'hue-sdk';
import type {
	EventStreamState,
	HueClient,
	LightEventResource,
	LightGet,
	LightPut,
	ResourceIdentifierResponse
} from 'hue-sdk';
import type {
	BridgeLight,
	HueAppConnection,
	HueGateway,
	LightChange,
	LightChangeObserver
} from './gateway.js';

const PARTIAL_SUCCESS_STATUS = 207;

type LightUpdate = Extract<LightChange, { kind: 'updated' }>;

const CONNECTION_STATES: Record<EventStreamState, HueAppConnection> = {
	connecting: 'connecting',
	open: 'live',
	reconnecting: 'reconnecting',
	closed: 'offline'
};

/**
 * Expects a client created with `throttle: false`: the SDK's default write throttling can resolve
 * a command with another request's response and drop its outcome.
 */
export class HueSdkGateway implements HueGateway {
	readonly #client: HueClient;

	constructor(client: HueClient) {
		this.#client = client;
	}

	async listLights(): Promise<BridgeLight[]> {
		const response = await this.#client.lights.list();
		return response.data.map(toBridgeLight);
	}

	async setPower(lightId: string, isOn: boolean): Promise<void> {
		await this.#update(lightId, { on: { on: isOn } });
	}

	async setBrightness(lightId: string, brightness: number): Promise<void> {
		await this.#update(lightId, { dimming: { brightness } });
	}

	watch(observer: LightChangeObserver): () => void {
		let active = true;
		const additions = new Map<string, LightUpdate[]>();

		const fetchAdded = async (id: string, updates: LightUpdate[]): Promise<void> => {
			let light: LightGet | undefined;
			try {
				[light] = (await this.#client.lights.get(id)).data;
			} catch {
				light = undefined;
			}
			if (!active || additions.get(id) !== updates) {
				return;
			}
			additions.delete(id);
			if (light) {
				observer.onChanges([{ kind: 'added', light: toBridgeLight(light) }, ...updates]);
			}
		};

		const reportState = (state: EventStreamState): void => {
			observer.onConnectionChange(CONNECTION_STATES[state]);
			if (state === 'open') {
				observer.onConnected();
			}
		};

		const subscription = this.#client.events.subscribe({
			onEvents: (events) => {
				if (!active) {
					return;
				}
				const changes: LightChange[] = [];
				for (const event of events) {
					for (const resource of event.data) {
						if (resource.type !== 'light') {
							continue;
						}
						if (event.type === 'add') {
							const light = fromEventResource(resource);
							if (light) {
								additions.delete(resource.id);
								changes.push({ kind: 'added', light });
							} else {
								const updates: LightUpdate[] = [];
								additions.set(resource.id, updates);
								void fetchAdded(resource.id, updates);
							}
						} else if (event.type === 'delete') {
							additions.delete(resource.id);
							changes.push({ kind: 'removed', id: resource.id });
						} else if (event.type === 'update') {
							const update = toLightUpdate(resource);
							const pending = additions.get(resource.id);
							if (update && pending) {
								pending.push(update);
							} else if (update) {
								changes.push(update);
							}
						}
					}
				}
				if (changes.length > 0) {
					observer.onChanges(changes);
				}
			},
			onStateChange: (state) => {
				if (active) {
					reportState(state);
				}
			},
			onError: () => {}
		});

		if (active) {
			reportState(subscription.state);
		}

		return () => {
			if (!active) {
				return;
			}
			active = false;
			additions.clear();
			subscription.close();
		};
	}

	async #update(lightId: string, body: LightPut): Promise<void> {
		const response = await this.#client.lights.update(lightId, body);
		assertApplied(lightId, response);
	}
}

function fromEventResource(resource: LightEventResource): BridgeLight | undefined {
	const name = resource.metadata?.name;
	const isOn = resource.on?.on;
	if (typeof name !== 'string' || typeof isOn !== 'boolean') {
		return undefined;
	}
	const brightness = resource.dimming?.brightness;
	return {
		id: resource.id,
		name,
		isOn,
		brightness: typeof brightness === 'number' ? brightness : null
	};
}

function toLightUpdate(resource: LightEventResource): LightUpdate | undefined {
	const change: LightUpdate = { kind: 'updated', id: resource.id };
	const isOn = resource.on?.on;
	const brightness = resource.dimming?.brightness;
	const name = resource.metadata?.name;
	if (typeof isOn === 'boolean') {
		change.isOn = isOn;
	}
	if (typeof brightness === 'number') {
		change.brightness = brightness;
	}
	if (typeof name === 'string') {
		change.name = name;
	}
	return Object.keys(change).length > 2 ? change : undefined;
}

function toBridgeLight(light: LightGet): BridgeLight {
	return {
		id: light.id,
		name: light.metadata.name,
		isOn: light.on.on,
		brightness: light.dimming?.brightness ?? null
	};
}

function assertApplied(lightId: string, response: ResourceIdentifierResponse): void {
	const [first] = response.errors;
	if (first) {
		throw new HueApiError(
			`Hue bridge did not apply the update to light ${lightId}: ${first.description}`,
			PARTIAL_SUCCESS_STATUS,
			response.errors
		);
	}
}
