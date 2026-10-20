import { HueError, HueNetworkError, HueResponseError } from './errors.js';
import type { HttpClient, HttpRequest, HttpStreamResponse } from './http.js';
import {
	createApiError,
	excerpt,
	isRecord,
	isSuccessStatus,
	parseJsonBody,
	readErrors,
	trimTrailingSlashes
} from './protocol.js';
import { createSseParser } from './sse.js';
import type { HueEvent, HueEventResource, HueEventType } from './types/event.js';

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

const EVENT_STREAM_PATH = '/eventstream/clip/v2';
const EVENT_STREAM_LABEL = `GET ${EVENT_STREAM_PATH}`;
const MIN_RECONNECT_DELAY = 500;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;
const MAX_ERROR_BODY = 1000;
const EVENT_TYPES: readonly string[] = [
	'add',
	'update',
	'delete',
	'error'
] satisfies HueEventType[];

export function reconnectDelay(attempt: number): number {
	const ceiling = Math.min(MAX_RECONNECT_DELAY, BASE_RECONNECT_DELAY * 2 ** attempt);
	const delay = ceiling / 2 + (Math.random() * ceiling) / 2;
	return Math.min(MAX_RECONNECT_DELAY, Math.max(MIN_RECONNECT_DELAY, delay));
}

export function createEventsApi(config: EventsApiConfig): EventsApi {
	const url = `${trimTrailingSlashes(config.baseUrl)}${EVENT_STREAM_PATH}`;

	return {
		subscribe(observer, options = {}) {
			const httpClient = config.httpClient;
			const stream = httpClient.stream;
			if (!stream) {
				throw new HueError('client.events requires an HttpClient that implements stream()');
			}
			const openStream = (request: HttpRequest) => stream.call(httpClient, request);

			const external = options.signal;
			let state: EventStreamState = 'connecting';
			let closed = false;
			let attempt = 0;
			let controller: AbortController | undefined;
			let timer: ReturnType<typeof setTimeout> | undefined;

			function report(error: unknown): void {
				if (closed) {
					return;
				}
				try {
					observer.onError?.(error);
				} catch {}
			}

			function setState(next: EventStreamState): void {
				if (state === next) {
					return;
				}
				state = next;
				try {
					observer.onStateChange?.(next);
				} catch (error) {
					report(error);
				}
			}

			function close(): void {
				if (closed) {
					return;
				}
				closed = true;
				if (timer !== undefined) {
					clearTimeout(timer);
					timer = undefined;
				}
				controller?.abort();
				controller = undefined;
				external?.removeEventListener('abort', close);
				state = 'closed';
				try {
					observer.onStateChange?.('closed');
				} catch {}
			}

			function scheduleReconnect(): void {
				setState('reconnecting');
				if (closed) {
					return;
				}
				const delay = reconnectDelay(attempt);
				attempt++;
				timer = setTimeout(() => {
					timer = undefined;
					void connect();
				}, delay);
			}

			function deliver(data: string, status: number): void {
				const events = readMessage(data, status, report);
				if (events.length === 0 || closed) {
					return;
				}
				try {
					observer.onEvents(events);
				} catch (error) {
					report(error);
				}
			}

			async function connect(): Promise<void> {
				if (closed) {
					return;
				}
				const current = new AbortController();
				controller = current;
				let response: HttpStreamResponse;
				try {
					response = await openStream({
						method: 'GET',
						url,
						headers: { accept: 'text/event-stream', 'hue-application-key': config.appKey },
						signal: current.signal
					});
				} catch (error) {
					if (!closed) {
						report(
							new HueNetworkError(`Network request failed: ${EVENT_STREAM_LABEL}`, {
								cause: error
							})
						);
						scheduleReconnect();
					}
					return;
				}
				if (closed) {
					return;
				}

				if (!isSuccessStatus(response.status)) {
					const body = await readBoundedBody(response.body);
					if (closed) {
						return;
					}
					const parsed = parseJsonBody(body);
					const errors = parsed.ok ? (readErrors(parsed.value) ?? []) : [];
					report(createApiError(EVENT_STREAM_LABEL, response.status, errors, body));
					if (response.status === 401 || response.status === 403) {
						close();
					} else {
						scheduleReconnect();
					}
					return;
				}

				attempt = 0;
				setState('open');
				const status = response.status;
				const parser = createSseParser((message) => {
					if (message.event === 'message' && !closed) {
						deliver(message.data, status);
					}
				});
				try {
					for await (const chunk of response.body) {
						if (closed) {
							break;
						}
						parser.push(chunk);
					}
				} catch (error) {
					if (!closed) {
						report(
							new HueNetworkError('Event stream connection was interrupted', { cause: error })
						);
					}
				}
				parser.end();
				if (!closed) {
					scheduleReconnect();
				}
			}

			if (external) {
				external.addEventListener('abort', close, { once: true });
			}
			queueMicrotask(() => {
				if (external?.aborted) {
					close();
					return;
				}
				void connect();
			});

			return {
				get state() {
					return state;
				},
				close
			};
		}
	};
}

async function readBoundedBody(body: AsyncIterable<string>): Promise<string> {
	let text = '';
	try {
		for await (const chunk of body) {
			text += chunk;
			if (text.length >= MAX_ERROR_BODY) {
				break;
			}
		}
	} catch {
		return text;
	}
	return text;
}

function readMessage(data: string, status: number, report: (error: unknown) => void): HueEvent[] {
	const parsed = parseJsonBody(data);
	if (!parsed.ok) {
		report(
			new HueResponseError('Hue event stream sent a non-JSON message', status, excerpt(data), {
				cause: parsed.error
			})
		);
		return [];
	}
	if (!Array.isArray(parsed.value)) {
		report(
			new HueResponseError(
				'Hue event stream sent a message that is not an array of events',
				status,
				excerpt(data)
			)
		);
		return [];
	}

	const events: HueEvent[] = [];
	let invalidEvents = 0;
	let invalidResources = 0;
	for (const item of parsed.value as unknown[]) {
		if (!isEventEnvelope(item)) {
			invalidEvents++;
			continue;
		}
		const resources = item.data.filter(isEventResource);
		invalidResources += item.data.length - resources.length;
		events.push({ ...item, data: resources });
	}

	if (invalidEvents > 0 || invalidResources > 0) {
		report(
			new HueResponseError(
				`Hue event stream message contained ${invalidEvents} invalid event(s) and ${invalidResources} invalid resource(s); they were dropped`,
				status,
				excerpt(data)
			)
		);
	}
	return events;
}

function isEventEnvelope(
	value: unknown
): value is Omit<HueEvent, 'data'> & { data: unknown[] } & Record<string, unknown> {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.creationtime === 'string' &&
		typeof value.type === 'string' &&
		EVENT_TYPES.includes(value.type) &&
		Array.isArray(value.data)
	);
}

function isEventResource(value: unknown): value is HueEventResource {
	return isRecord(value) && typeof value.id === 'string' && typeof value.type === 'string';
}
