import { HueApiError } from 'hue-sdk';
import type {
	EventStreamState,
	HueClient,
	HueEvent,
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
		const additions = new Map<string, object>();

		const fetchAdded = async (id: string): Promise<void> => {
			const token = {};
			additions.set(id, token);
			try {
				const response = await this.#client.lights.get(id);
				const [light] = response.data;
				if (active && additions.get(id) === token && light) {
					observer.onChanges([{ kind: 'added', light: toBridgeLight(light) }]);
				}
			} catch {
				return;
			} finally {
				if (additions.get(id) === token) {
					additions.delete(id);
				}
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
						const change = toLightChange(event.type, resource);
						if (change) {
							changes.push(change);
						}
						if (event.type === 'add') {
							void fetchAdded(resource.id);
						} else if (event.type === 'delete') {
							additions.delete(resource.id);
						}
					}
				}
				if (changes.length > 0) {
					observer.onChanges(changes);
				}
			},
			onStateChange: (state) => {
				if (!active) {
					return;
				}
				observer.onConnectionChange(CONNECTION_STATES[state]);
				if (state === 'open') {
					observer.onConnected();
				}
			},
			onError: () => {}
		});

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

function toLightChange(
	type: HueEvent['type'],
	resource: LightEventResource
): LightChange | undefined {
	if (type === 'delete') {
		return { kind: 'removed', id: resource.id };
	}
	if (type !== 'update') {
		return undefined;
	}
	const change: Extract<LightChange, { kind: 'updated' }> = { kind: 'updated', id: resource.id };
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
