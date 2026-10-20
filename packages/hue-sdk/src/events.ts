import { HueError } from './errors.js';
import type { HttpClient } from './http.js';
import type { HueEvent } from './types/event.js';

export type EventStreamState = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface EventStreamObserver {
	onEvents(events: HueEvent[]): void;
	onStateChange?(state: EventStreamState): void;
	onError?(error: unknown): void;
}

export interface EventStreamOptions {
	signal?: AbortSignal;
}

export interface EventStreamSubscription {
	readonly state: EventStreamState;
	close(): void;
}

export interface EventsApi {
	subscribe(observer: EventStreamObserver, options?: EventStreamOptions): EventStreamSubscription;
}

export interface EventsApiConfig {
	baseUrl: string;
	appKey: string;
	httpClient: HttpClient;
}

export function createEventsApi(config: EventsApiConfig): EventsApi {
	return {
		subscribe() {
			if (!config.httpClient.stream) {
				throw new HueError('client.events requires an HttpClient that implements stream()');
			}
			throw new HueError('client.events is not implemented yet');
		}
	};
}
