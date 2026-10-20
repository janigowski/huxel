import type { HueEvent } from '../types/event.js';
import type { EventStreamObserver, EventStreamState } from './events-api.js';

export class ObserverChannel {
	private closed = false;

	constructor(private readonly observer: EventStreamObserver) {}

	events(events: HueEvent[]): void {
		if (this.closed) {
			return;
		}
		try {
			this.observer.onEvents(events);
		} catch (error) {
			this.error(error);
		}
	}

	stateChanged(state: EventStreamState): void {
		if (this.closed) {
			return;
		}
		try {
			this.observer.onStateChange?.(state);
		} catch (error) {
			this.error(error);
		}
	}

	error(error: unknown): void {
		if (this.closed) {
			return;
		}
		try {
			this.observer.onError?.(error);
		} catch {}
	}

	close(): void {
		if (this.closed) {
			return;
		}
		this.closed = true;

		try {
			this.observer.onStateChange?.('closed');
		} catch {}
	}
}
