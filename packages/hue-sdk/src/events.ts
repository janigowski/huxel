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
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;
const STABLE_CONNECTION_DURATION = 30_000;
const MAX_RETRY_AFTER_DELAY = 300_000;
const MAX_ERROR_BODY = 1000;
const ERROR_BODY_TIMEOUT = 2000;
const EVENT_TYPES: readonly string[] = [
	'add',
	'update',
	'delete',
	'error'
] satisfies HueEventType[];

export function reconnectDelay(attempt: number): number {
	const ceiling = Math.min(MAX_RECONNECT_DELAY, BASE_RECONNECT_DELAY * 2 ** attempt);
	return ceiling / 2 + (Math.random() * ceiling) / 2;
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

			function scheduleReconnect(minimumDelay = 0): void {
				setState('reconnecting');
				if (closed) {
					return;
				}
				const delay = Math.min(
					MAX_RETRY_AFTER_DELAY,
					Math.max(reconnectDelay(attempt), minimumDelay)
				);
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
					const body = await readErrorBody(response.body);
					current.abort();
					if (closed) {
						return;
					}
					const parsed = parseJsonBody(body);
					const errors = parsed.ok ? (readErrors(parsed.value) ?? []) : [];
					report(createApiError(EVENT_STREAM_LABEL, response.status, errors, body));
					if (response.status === 401 || response.status === 403) {
						close();
					} else if (response.status === 429 || response.status === 503) {
						scheduleReconnect(retryAfterDelay(response.headers));
					} else {
						scheduleReconnect();
					}
					return;
				}

				const openedAt = Date.now();
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
				if (Date.now() - openedAt >= STABLE_CONNECTION_DURATION) {
					attempt = 0;
				}
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

async function readErrorBody(body: AsyncIterable<string>): Promise<string> {
	const iterator = body[Symbol.asyncIterator]();
	let timeout: ReturnType<typeof setTimeout> | undefined;
	const expired = new Promise<undefined>((resolve) => {
		timeout = setTimeout(resolve, ERROR_BODY_TIMEOUT, undefined);
	});
	let text = '';
	try {
		while (text.length < MAX_ERROR_BODY) {
			const result = await Promise.race([iterator.next(), expired]);
			if (!result || result.done) {
				break;
			}
			text += result.value;
		}
	} catch {
		return text;
	} finally {
		clearTimeout(timeout);
		void Promise.resolve(iterator.return?.()).catch(() => undefined);
	}
	return text;
}

function retryAfterDelay(headers: Headers): number {
	const value = headers.get('retry-after')?.trim();
	if (!value) {
		return 0;
	}
	if (/^\d+$/.test(value)) {
		return Number.parseInt(value, 10) * 1000;
	}
	const date = Date.parse(value);
	return Number.isNaN(date) ? 0 : Math.max(0, date - Date.now());
}

function readMessage(data: string, status: number, report: (error: unknown) => void): HueEvent[] {
	if (data === '') {
		return [];
	}
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
