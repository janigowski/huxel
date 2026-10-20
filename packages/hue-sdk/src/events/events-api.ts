import type { HttpClient } from '../http.js';
import type { HueEvent } from '../types/event.js';
import { EventStreamEndpoint } from './event-stream-endpoint.js';
import { EventStream } from './event-stream.js';

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

export class HueEventsApi implements EventsApi {
	constructor(private readonly config: EventsApiConfig) {}

	readonly subscribe = (
		observer: EventStreamObserver,
		options: EventStreamOptions = {}
	): EventStreamSubscription =>
		EventStream.open(new EventStreamEndpoint(this.config), observer, options.signal);
}
