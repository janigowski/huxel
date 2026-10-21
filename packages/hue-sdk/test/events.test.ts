import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { createHueClient } from '../src/client.js';
import {
	HueApiError,
	HueError,
	HueForbiddenError,
	HueNetworkError,
	HueRateLimitError,
	HueResponseError,
	HueUnauthorizedError
} from '../src/errors.js';
import {
	HueEventsApi,
	type EventStreamOptions,
	type EventStreamState,
	type EventStreamObserver
} from '../src/events/events-api.js';
import type { HttpClient, HttpRequest, HttpStreamResponse } from '../src/http.js';
import type { HueEvent } from '../src/types/event.js';

class FakeBody implements AsyncIterable<string> {
	finished = false;
	private chunks: string[] = [];
	private ended = false;
	private failure: { error: unknown } | undefined;
	private wake: (() => void) | undefined;

	push(...chunks: string[]): void {
		this.chunks.push(...chunks);
		this.notify();
	}

	end(): void {
		this.ended = true;
		this.notify();
	}

	fail(error: unknown): void {
		this.failure = { error };
		this.notify();
	}

	async *[Symbol.asyncIterator](): AsyncGenerator<string> {
		try {
			for (;;) {
				const chunk = this.chunks.shift();
				if (chunk !== undefined) {
					yield chunk;
					continue;
				}
				if (this.failure) {
					throw this.failure.error;
				}
				if (this.ended) {
					return;
				}
				await new Promise<void>((resolve) => {
					this.wake = resolve;
				});
			}
		} finally {
			this.finished = true;
		}
	}

	private notify(): void {
		const wake = this.wake;
		this.wake = undefined;
		wake?.();
	}
}

class Connection {
	readonly body = new FakeBody();
	readonly response: Promise<HttpStreamResponse>;
	private resolve: (response: HttpStreamResponse) => void = () => {};
	private reject: (error: unknown) => void = () => {};

	constructor(readonly request: HttpRequest) {
		this.response = new Promise<HttpStreamResponse>((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
		request.signal?.addEventListener('abort', () => {
			const error = new DOMException('The operation was aborted.', 'AbortError');
			this.reject(error);
			this.body.fail(error);
		});
	}

	open(status = 200, headers: Record<string, string> = {}): FakeBody {
		this.resolve({
			status,
			headers: new Headers({ 'content-type': 'text/event-stream', ...headers }),
			body: this.body
		});
		return this.body;
	}

	respond(status: number, body: string, headers: Record<string, string> = {}): void {
		this.open(status, headers);
		this.body.push(body);
		this.body.end();
	}

	fail(error: unknown): void {
		this.reject(error);
	}
}

function fakeStreamClient() {
	const connections: Connection[] = [];
	const client: HttpClient = {
		request: () => Promise.reject(new Error('request() must not be used by the event stream')),
		stream(request) {
			const connection = new Connection(request);
			connections.push(connection);
			return connection.response;
		}
	};
	function connection(index: number): Connection {
		const found = connections[index];
		if (!found) {
			throw new Error(`Connection ${index} was not made`);
		}
		return found;
	}
	return { client, connections, connection };
}

async function settle(): Promise<void> {
	for (let i = 0; i < 50; i++) {
		await Promise.resolve();
	}
}

function subscribe(options?: EventStreamOptions, overrides: Partial<EventStreamObserver> = {}) {
	const http = fakeStreamClient();
	const events: HueEvent[][] = [];
	const states: EventStreamState[] = [];
	const errors: unknown[] = [];
	const api = new HueEventsApi({
		baseUrl: 'https://bridge.local//',
		appKey: 'app-key',
		httpClient: http.client
	});
	const subscription = api.subscribe(
		{
			onEvents: (batch) => events.push(batch),
			onStateChange: (state) => states.push(state),
			onError: (error) => errors.push(error),
			...overrides
		},
		options
	);
	return { ...http, subscription, events, states, errors };
}

function sse(payload: unknown): string {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

function lightUpdate(id = 'evt-1', on = true) {
	return {
		id,
		creationtime: '2026-10-20T18:00:00Z',
		type: 'update',
		data: [
			{
				id: 'light-1',
				id_v1: '/lights/1',
				owner: { rid: 'device-1', rtype: 'device' },
				type: 'light',
				on: { on }
			}
		]
	};
}

async function expectReconnectAfter(
	connections: Connection[],
	delay: number
): Promise<Connection | undefined> {
	const count = connections.length;
	await vi.advanceTimersByTimeAsync(delay - 1);
	expect(connections).toHaveLength(count);
	await vi.advanceTimersByTimeAsync(1);
	expect(connections).toHaveLength(count + 1);
	return connections.at(-1);
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.spyOn(Math, 'random').mockReturnValue(1);
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('events.subscribe connection', () => {
	it('throws synchronously when the HttpClient does not implement stream()', () => {
		const api = new HueEventsApi({
			baseUrl: 'https://bridge.local',
			appKey: 'key',
			httpClient: { request: () => Promise.reject(new Error('unused')) }
		});

		expect(() => api.subscribe({ onEvents: () => {} })).toThrow(HueError);
		expect(() => api.subscribe({ onEvents: () => {} })).toThrow(
			'client.events requires an HttpClient that implements stream()'
		);
	});

	it('does not connect or call the observer synchronously', () => {
		const { connections, subscription, states, errors, events } = subscribe();

		expect(subscription.state).toBe('connecting');
		expect(connections).toHaveLength(0);
		expect([...states, ...errors, ...events]).toEqual([]);
	});

	it('requests the event stream with the expected url and headers', async () => {
		const { connection } = subscribe();
		await settle();

		const { request } = connection(0);
		expect(request.method).toBe('GET');
		expect(request.url).toBe('https://bridge.local/eventstream/clip/v2');
		expect(request.headers).toEqual({
			accept: 'text/event-stream',
			'hue-application-key': 'app-key'
		});
		expect(request.body).toBeUndefined();
		expect(request.signal).toBeInstanceOf(AbortSignal);
	});

	it('uses the raw transport stream when created through createHueClient', async () => {
		const http = fakeStreamClient();
		const hue = createHueClient({
			baseUrl: 'https://bridge.local',
			appKey: 'k',
			httpClient: http.client
		});

		hue.events.subscribe({ onEvents: () => {} });
		await settle();

		expect(http.connections).toHaveLength(1);
		expect(http.connection(0).request.url).toBe('https://bridge.local/eventstream/clip/v2');
	});

	it('supports a detached subscribe method', async () => {
		const http = fakeStreamClient();
		const { subscribe } = createHueClient({
			baseUrl: 'https://bridge.local',
			appKey: 'k',
			httpClient: http.client
		}).events;

		subscribe({ onEvents: () => {} });
		await settle();

		expect(http.connections).toHaveLength(1);
	});

	it('moves to open once a 2xx response is received', async () => {
		const { connection, subscription, states } = subscribe();
		await settle();
		expect(subscription.state).toBe('connecting');

		connection(0).open();
		await settle();

		expect(subscription.state).toBe('open');
		expect(states).toEqual(['open']);
	});
});

describe('events.subscribe messages', () => {
	it('delivers validated events from data messages', async () => {
		const { connection, events, errors } = subscribe();
		await settle();
		const body = connection(0).open();

		body.push(': hi\n\n', `id: 1:0\n${sse([lightUpdate()]).slice(0, 20)}`);
		body.push(sse([lightUpdate()]).slice(20));
		await settle();

		expect(errors).toEqual([]);
		expect(events).toEqual([[lightUpdate()]]);
	});

	it('narrows light resources by type', async () => {
		const { connection, events } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(sse([lightUpdate()]));
		await settle();

		const resource = events[0]?.[0]?.data[0];
		expect(resource?.type === 'light' ? resource.on?.on : undefined).toBe(true);
	});

	it('delivers a batch of events in a single onEvents call', async () => {
		const { connection, events } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(sse([lightUpdate('a'), lightUpdate('b', false)]));
		await settle();

		expect(events).toHaveLength(1);
		expect(events[0]?.map((event) => event.id)).toEqual(['a', 'b']);
	});

	it('passes unknown resource types and extra fields through unchanged', async () => {
		const event = {
			id: 'evt',
			creationtime: '2026-10-20T18:00:00Z',
			type: 'add',
			data: [{ id: 'x', type: 'future_resource', extra: { nested: true } }]
		};
		const { connection, events, errors } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(sse([event]));
		await settle();

		expect(errors).toEqual([]);
		expect(events).toEqual([[event]]);
	});

	it('reports malformed JSON and keeps the stream alive', async () => {
		const { connection, events, errors, subscription } = subscribe();
		await settle();
		const body = connection(0).open();

		body.push('data: {not json\n\n');
		await settle();
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBeInstanceOf(HueResponseError);
		expect(errors[0]).toMatchObject({ status: 200, body: '{not json' });
		expect(events).toEqual([]);

		body.push(sse([lightUpdate()]));
		await settle();
		expect(events).toHaveLength(1);
		expect(subscription.state).toBe('open');
	});

	it('skips messages with empty data silently', async () => {
		const { connection, events, errors } = subscribe();
		await settle();
		connection(0)
			.open()
			.push('data\n\n', 'data:\n\n', sse([lightUpdate()]));
		await settle();

		expect(errors).toEqual([]);
		expect(events).toHaveLength(1);
	});

	it('reports a message that is not an array', async () => {
		const { connection, events, errors } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(sse({ id: 'x' }));
		await settle();

		expect(errors[0]).toBeInstanceOf(HueResponseError);
		expect(events).toEqual([]);
	});

	it('drops invalid events and resources individually', async () => {
		const valid = lightUpdate('ok');
		const mixed = { ...valid, data: [...valid.data, { type: 'light' }, 'nope'] };
		const { connection, events, errors } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(
				sse([
					mixed,
					{ ...valid, creationtime: undefined },
					{ ...valid, type: 'changed' },
					{ ...valid, data: 'x' },
					null
				])
			);
		await settle();

		expect(events).toEqual([[valid]]);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBeInstanceOf(HueResponseError);
		expect((errors[0] as Error).message).toContain('4 invalid event(s) and 2 invalid resource(s)');
	});

	it('does not call onEvents when a message has no valid events', async () => {
		const { connection, events, errors } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(sse([]), sse([{ id: 1 }]));
		await settle();

		expect(events).toEqual([]);
		expect(errors).toHaveLength(1);
	});

	it('ignores events with a non-message event name', async () => {
		const { connection, events } = subscribe();
		await settle();
		connection(0)
			.open()
			.push(`event: other\n${sse([lightUpdate()])}`);
		await settle();

		expect(events).toEqual([]);
	});

	it('reports observer exceptions via onError and keeps the stream alive', async () => {
		const failure = new Error('observer failed');
		let calls = 0;
		const { connection, errors, subscription } = subscribe(undefined, {
			onEvents: () => {
				calls++;
				throw failure;
			}
		});
		await settle();
		connection(0)
			.open()
			.push(sse([lightUpdate('a')]), sse([lightUpdate('b')]));
		await settle();

		expect(calls).toBe(2);
		expect(errors).toEqual([failure, failure]);
		expect(subscription.state).toBe('open');
	});

	it('survives an onError callback that throws', async () => {
		const events: HueEvent[][] = [];
		const { connection, subscription } = subscribe(undefined, {
			onEvents: (batch) => events.push(batch),
			onError: () => {
				throw new Error('onError failed');
			}
		});
		await settle();
		const body = connection(0).open();
		body.push('data: nope\n\n', sse([lightUpdate()]));
		await settle();

		expect(events).toHaveLength(1);
		expect(subscription.state).toBe('open');
	});
});

describe('events.subscribe reconnection', () => {
	it('reconnects after a network error with exponential backoff capped at 30 s', async () => {
		const { connections, connection, errors, states, subscription } = subscribe();
		await settle();

		const failure = new TypeError('Failed to fetch');
		connection(0).fail(failure);
		await settle();
		expect(subscription.state).toBe('reconnecting');
		expect(errors[0]).toBeInstanceOf(HueNetworkError);
		expect((errors[0] as HueNetworkError).cause).toBe(failure);

		for (const delay of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
			const next = await expectReconnectAfter(connections, delay);
			next?.fail(new TypeError('Failed to fetch'));
			await settle();
		}

		expect(states).toEqual(['reconnecting']);
		expect(errors).toHaveLength(8);
	});

	it('applies equal jitter and never waits less than 500 ms', async () => {
		vi.mocked(Math.random).mockReturnValue(0);
		const { connections, connection } = subscribe();
		await settle();

		connection(0).fail(new TypeError('offline'));
		await settle();
		for (const delay of [500, 1000, 2000, 4000, 8000, 15000, 15000]) {
			const next = await expectReconnectAfter(connections, delay);
			next?.fail(new TypeError('offline'));
			await settle();
		}
	});

	it('reconnects after the stream ends cleanly without reporting an error', async () => {
		vi.mocked(Math.random).mockReturnValue(0);
		const { connections, connection, errors, states } = subscribe();
		await settle();

		connection(0).open().end();
		await settle();

		expect(errors).toEqual([]);
		expect(states).toEqual(['open', 'reconnecting']);
		await expectReconnectAfter(connections, 500);
	});

	it('reports an interrupted stream as a network error and reconnects', async () => {
		const { connections, connection, errors, subscription } = subscribe();
		await settle();
		const failure = new TypeError('terminated');

		connection(0).open().fail(failure);
		await settle();

		expect(errors[0]).toBeInstanceOf(HueNetworkError);
		expect((errors[0] as HueNetworkError).cause).toBe(failure);
		expect(subscription.state).toBe('reconnecting');
		await expectReconnectAfter(connections, 1000);
	});

	it('backs off exponentially when connections open and end immediately', async () => {
		const { connections, connection, errors } = subscribe();
		await settle();

		connection(0).open().end();
		await settle();
		for (const delay of [1000, 2000, 4000, 8000, 16000, 30000]) {
			(await expectReconnectAfter(connections, delay))?.open().end();
			await settle();
		}

		expect(errors).toEqual([]);
		await expectReconnectAfter(connections, 30000);
	});

	it('resets the backoff after a connection stays open for 30 s', async () => {
		const { connections, connection, states } = subscribe();
		await settle();

		connection(0).fail(new TypeError('offline'));
		await settle();
		(await expectReconnectAfter(connections, 1000))?.fail(new TypeError('offline'));
		await settle();
		const body = (await expectReconnectAfter(connections, 2000))?.open();
		await settle();
		await vi.advanceTimersByTimeAsync(30_000);
		body?.end();
		await settle();

		await expectReconnectAfter(connections, 1000);
		expect(states).toEqual(['reconnecting', 'open', 'reconnecting']);
	});

	it('keeps backing off when a connection ends before 30 s', async () => {
		const { connections, connection } = subscribe();
		await settle();

		connection(0).fail(new TypeError('offline'));
		await settle();
		(await expectReconnectAfter(connections, 1000))?.fail(new TypeError('offline'));
		await settle();
		const body = (await expectReconnectAfter(connections, 2000))?.open();
		await settle();
		await vi.advanceTimersByTimeAsync(29_999);
		body?.end();
		await settle();

		await expectReconnectAfter(connections, 4000);
	});

	it('transitions through open, reconnecting, open and closed', async () => {
		const { connections, connection, states, subscription } = subscribe();
		await settle();

		connection(0).open().end();
		await settle();
		(await expectReconnectAfter(connections, 1000))?.open();
		await settle();
		subscription.close();

		expect(states).toEqual(['open', 'reconnecting', 'open', 'closed']);
	});

	it.each([
		[401, HueUnauthorizedError],
		[403, HueForbiddenError]
	])('stops permanently on %i', async (status, ErrorClass) => {
		const { connections, connection, errors, states, subscription } = subscribe();
		await settle();

		connection(0).respond(status, '[{"error":{"type":1,"description":"unauthorized user"}}]');
		await settle();

		expect(errors).toHaveLength(1);
		expect(errors[0]).toBeInstanceOf(ErrorClass);
		expect(errors[0]).toMatchObject({ status });
		expect(subscription.state).toBe('closed');
		expect(states).toEqual(['closed']);
		expect(vi.getTimerCount()).toBe(0);
		await vi.advanceTimersByTimeAsync(120_000);
		expect(connections).toHaveLength(1);
	});

	it('includes CLIP v2 error descriptions from a non-2xx body', async () => {
		const { connection, errors } = subscribe();
		await settle();

		connection(0).respond(401, '{"errors":[{"description":"unauthorized user"}],"data":[]}');
		await settle();

		expect(errors[0]).toMatchObject({
			errors: [{ description: 'unauthorized user' }],
			message: expect.stringContaining('unauthorized user')
		});
	});

	it.each([
		[429, HueRateLimitError],
		[503, HueApiError],
		[404, HueApiError]
	])('retries after status %i', async (status, ErrorClass) => {
		const { connections, connection, errors, subscription } = subscribe();
		await settle();

		connection(0).respond(status, 'busy');
		await settle();

		expect(errors[0]).toBeInstanceOf(ErrorClass);
		expect(errors[0]).toMatchObject({ status, body: 'busy' });
		expect(connection(0).body.finished).toBe(true);
		expect(subscription.state).toBe('reconnecting');
		(await expectReconnectAfter(connections, 1000))?.open();
		await settle();
		expect(subscription.state).toBe('open');
	});

	it.each([429, 503])('waits for a Retry-After in seconds on status %i', async (status) => {
		const { connections, connection } = subscribe();
		await settle();

		connection(0).respond(status, '', { 'retry-after': '120' });
		await settle();

		await expectReconnectAfter(connections, 120_000);
	});

	it('waits until a Retry-After HTTP date', async () => {
		vi.setSystemTime(new Date('2026-10-20T18:00:00.000Z'));
		const { connections, connection } = subscribe();
		await settle();

		connection(0).respond(429, '', { 'retry-after': 'Tue, 20 Oct 2026 18:01:30 GMT' });
		await settle();

		await expectReconnectAfter(connections, 90_000);
	});

	it('uses the backoff when it is longer than Retry-After', async () => {
		const { connections, connection } = subscribe();
		await settle();

		connection(0).respond(429, '', { 'retry-after': '0' });
		await settle();

		await expectReconnectAfter(connections, 1000);
	});

	it('caps Retry-After at 5 minutes', async () => {
		const { connections, connection } = subscribe();
		await settle();

		connection(0).respond(503, '', { 'retry-after': '3600' });
		await settle();

		await expectReconnectAfter(connections, 300_000);
	});

	it('ignores Retry-After on other statuses and invalid values', async () => {
		const { connections, connection } = subscribe();
		await settle();

		connection(0).respond(500, '', { 'retry-after': '120' });
		await settle();
		(await expectReconnectAfter(connections, 1000))?.respond(429, '', { 'retry-after': 'soon' });
		await settle();

		await expectReconnectAfter(connections, 2000);
	});

	it('stops waiting for an error body that never ends and still reconnects', async () => {
		const { connections, connection, errors } = subscribe();
		await settle();
		const body = connection(0).open(503);
		body.push('partial');
		await settle();

		expect(errors).toEqual([]);
		await vi.advanceTimersByTimeAsync(2000);

		expect(body.finished).toBe(true);
		expect(connection(0).request.signal?.aborted).toBe(true);
		expect(errors[0]).toBeInstanceOf(HueApiError);
		expect(errors[0]).toMatchObject({ status: 503, body: 'partial' });
		await expectReconnectAfter(connections, 1000);
	});

	it('cancels reading an error body when closed', async () => {
		const { connection, errors, subscription } = subscribe();
		await settle();
		const body = connection(0).open(503);
		await settle();

		subscription.close();
		await settle();

		expect(body.finished).toBe(true);
		expect(errors).toEqual([]);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('reads only a bounded part of an error body', async () => {
		const { connection, errors } = subscribe();
		await settle();
		const body = connection(0).open(503);
		body.push('x'.repeat(600), 'y'.repeat(600));
		await settle();

		expect(body.finished).toBe(true);
		expect((errors[0] as HueApiError).body).toHaveLength(1001);
	});
});

describe('events.subscribe closing', () => {
	it('clears the backoff timer when closed while reconnecting', async () => {
		const { connections, connection, states, subscription, errors } = subscribe();
		await settle();
		connection(0).fail(new TypeError('offline'));
		await settle();
		expect(vi.getTimerCount()).toBe(1);

		subscription.close();

		expect(vi.getTimerCount()).toBe(0);
		expect(subscription.state).toBe('closed');
		expect(states).toEqual(['reconnecting', 'closed']);
		await vi.advanceTimersByTimeAsync(60_000);
		expect(connections).toHaveLength(1);
		expect(errors).toHaveLength(1);
	});

	it('aborts the open stream when closed', async () => {
		const { connection, errors, subscription } = subscribe();
		await settle();
		const body = connection(0).open();
		await settle();

		subscription.close();
		await settle();

		expect(connection(0).request.signal?.aborted).toBe(true);
		expect(body.finished).toBe(true);
		expect(errors).toEqual([]);
		expect(subscription.state).toBe('closed');
		expect(vi.getTimerCount()).toBe(0);
	});

	it('aborts a pending connection when closed', async () => {
		const { connection, errors, states, subscription } = subscribe();
		await settle();

		subscription.close();
		await settle();

		expect(connection(0).request.signal?.aborted).toBe(true);
		expect(errors).toEqual([]);
		expect(states).toEqual(['closed']);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('never connects when closed synchronously after subscribe', async () => {
		const { connections, states, subscription } = subscribe();

		subscription.close();
		await settle();

		expect(connections).toHaveLength(0);
		expect(states).toEqual(['closed']);
	});

	it.each([
		['a network error', (connection: Connection) => connection.fail(new TypeError('offline'))],
		['a retryable status', (connection: Connection) => connection.respond(503, 'busy')]
	])('stays closed when onError closes the stream after %s', async (_name, failure) => {
		const states: EventStreamState[] = [];
		const ref: { close?: () => void } = {};
		const http = subscribe(undefined, {
			onStateChange: (state) => states.push(state),
			onError: () => ref.close?.()
		});
		ref.close = () => http.subscription.close();
		await settle();

		failure(http.connection(0));
		await settle();

		expect(http.subscription.state).toBe('closed');
		expect(states).toEqual(['closed']);
		expect(vi.getTimerCount()).toBe(0);
	});

	it('is idempotent', async () => {
		const { states, subscription } = subscribe();
		await settle();

		subscription.close();
		subscription.close();

		expect(states).toEqual(['closed']);
	});

	it('emits nothing after close, even from the same chunk', async () => {
		const events: HueEvent[][] = [];
		const states: EventStreamState[] = [];
		const errors: unknown[] = [];
		const ref: { close?: () => void } = {};
		const http = subscribe(undefined, {
			onEvents: (batch) => {
				events.push(batch);
				ref.close?.();
			},
			onStateChange: (state) => states.push(state),
			onError: (error) => errors.push(error)
		});
		ref.close = () => http.subscription.close();
		await settle();
		const body = http.connection(0).open();

		body.push(`${sse([lightUpdate('a')])}${sse([lightUpdate('b')])}data: broken\n\n`);
		await settle();
		body.push(sse([lightUpdate('c')]));
		await settle();
		await vi.advanceTimersByTimeAsync(60_000);

		expect(events.map((batch) => batch[0]?.id)).toEqual(['a']);
		expect(errors).toEqual([]);
		expect(states).toEqual(['open', 'closed']);
		expect(http.connections).toHaveLength(1);
	});

	it('closes when the external signal aborts and removes its listener', async () => {
		const controller = new AbortController();
		const remove = vi.spyOn(controller.signal, 'removeEventListener');
		const { connection, errors, states, subscription } = subscribe({ signal: controller.signal });
		await settle();
		connection(0).open();
		await settle();

		controller.abort();
		await settle();

		expect(subscription.state).toBe('closed');
		expect(connection(0).request.signal?.aborted).toBe(true);
		expect(states).toEqual(['open', 'closed']);
		expect(errors).toEqual([]);
		expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
	});

	it('removes the external signal listener when closed manually', async () => {
		const controller = new AbortController();
		const add = vi.spyOn(controller.signal, 'addEventListener');
		const remove = vi.spyOn(controller.signal, 'removeEventListener');
		const { subscription } = subscribe({ signal: controller.signal });
		await settle();

		subscription.close();

		expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0]?.[1]);
	});

	it('ends closed without a request when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		const { connections, errors, states, subscription } = subscribe({ signal: controller.signal });

		expect(states).toEqual([]);
		await settle();

		expect(connections).toHaveLength(0);
		expect(subscription.state).toBe('closed');
		expect(states).toEqual(['closed']);
		expect(errors).toEqual([]);
		expect(vi.getTimerCount()).toBe(0);
	});
});
