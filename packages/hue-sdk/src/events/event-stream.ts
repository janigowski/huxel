import { HueNetworkError } from '../errors.js';
import type { HttpStreamResponse } from '../http.js';
import { isSuccessStatus } from '../protocol.js';
import { SseParser } from '../sse.js';
import type { EventStreamEndpoint } from './event-stream-endpoint.js';
import type {
	EventStreamObserver,
	EventStreamState,
	EventStreamSubscription
} from './events-api.js';
import { HueEventDecoder } from './hue-event-decoder.js';
import { ObserverChannel } from './observer-channel.js';
import { ReconnectPolicy } from './reconnect-policy.js';
import { StreamRejection } from './stream-rejection.js';

export class EventStream implements EventStreamSubscription {
	private currentState: EventStreamState = 'connecting';
	private closed = false;
	private connection: AbortController | undefined;
	private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
	private readonly observer: ObserverChannel;
	private readonly reconnectPolicy = new ReconnectPolicy();

	private constructor(
		private readonly endpoint: EventStreamEndpoint,
		observer: EventStreamObserver,
		private readonly signal: AbortSignal | undefined
	) {
		this.observer = new ObserverChannel(observer);
	}

	static open(
		endpoint: EventStreamEndpoint,
		observer: EventStreamObserver,
		signal?: AbortSignal
	): EventStream {
		const stream = new EventStream(endpoint, observer, signal);
		stream.start();

		return stream;
	}

	get state(): EventStreamState {
		return this.currentState;
	}

	readonly close = (): void => {
		if (this.closed) {
			return;
		}

		this.closed = true;

		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = undefined;

		this.connection?.abort();
		this.connection = undefined;

		this.signal?.removeEventListener('abort', this.close);

		this.currentState = 'closed';
		this.observer.close();
	};

	private start(): void {
		this.signal?.addEventListener('abort', this.close, { once: true });

		queueMicrotask(() => {
			if (this.signal?.aborted) {
				this.close();
				return;
			}

			void this.connect();
		});
	}

	private async connect(): Promise<void> {
		if (this.closed) {
			return;
		}

		const connection = new AbortController();
		this.connection = connection;

		let response: HttpStreamResponse;
		try {
			response = await this.endpoint.open(connection.signal);
		} catch (error) {
			if (!this.closed) {
				this.observer.error(error);
				this.scheduleReconnect();
			}

			return;
		}

		if (this.closed) {
			return;
		}

		if (isSuccessStatus(response.status)) {
			await this.consume(response);
		} else {
			await this.reject(response, connection);
		}
	}

	private async consume(response: HttpStreamResponse): Promise<void> {
		this.reconnectPolicy.connectionOpened();
		this.transition('open');

		const decoder = new HueEventDecoder(response.status);
		const parser = new SseParser((message) => {
			if (message.event === 'message' && !this.closed) {
				this.deliver(decoder, message.data);
			}
		});

		try {
			for await (const chunk of response.body) {
				if (this.closed) {
					break;
				}

				parser.push(chunk);
			}
		} catch (error) {
			if (!this.closed) {
				this.observer.error(
					new HueNetworkError('Event stream connection was interrupted', { cause: error })
				);
			}
		}

		parser.end();
		this.reconnectPolicy.connectionEnded();

		if (!this.closed) {
			this.scheduleReconnect();
		}
	}

	private async reject(response: HttpStreamResponse, connection: AbortController): Promise<void> {
		const rejection = await StreamRejection.read(this.endpoint.label, response);
		connection.abort();

		if (this.closed) {
			return;
		}

		this.observer.error(rejection.toError());

		if (rejection.isPermanent) {
			this.close();
		} else {
			this.scheduleReconnect(rejection.retryDelay);
		}
	}

	private deliver(decoder: HueEventDecoder, data: string): void {
		const { events, error } = decoder.decode(data);

		if (error) {
			this.observer.error(error);
		}

		if (events.length > 0) {
			this.observer.events(events);
		}
	}

	private scheduleReconnect(minimumDelay = 0): void {
		this.transition('reconnecting');

		if (this.closed) {
			return;
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined;
			void this.connect();
		}, this.reconnectPolicy.nextDelay(minimumDelay));
	}

	private transition(next: EventStreamState): void {
		if (this.closed || this.currentState === next) {
			return;
		}

		this.currentState = next;
		this.observer.stateChanged(next);
	}
}
