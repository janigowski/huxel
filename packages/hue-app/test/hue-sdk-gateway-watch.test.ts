import type {
	ApiResponse,
	EventStreamObserver,
	EventStreamState,
	HueClient,
	HueEvent,
	HueEventResource,
	LightGet
} from 'hue-sdk';
import { describe, expect, it, vi } from 'vitest';
import { HueSdkGateway } from '../src/hue-sdk-gateway.js';
import type { HueAppConnection, LightChange, LightChangeObserver } from '../src/index.js';
import { deferred, flushMicrotasks, type Deferred } from './fakes.js';

function fakeClient() {
	const observers: EventStreamObserver[] = [];
	const closes: number[] = [];
	const gets: Array<{ id: string; result: Deferred<ApiResponse<LightGet>> }> = [];
	let state: EventStreamState = 'connecting';
	const client = {
		events: {
			subscribe(observer: EventStreamObserver) {
				const index = observers.push(observer) - 1;
				closes[index] = 0;
				return {
					get state() {
						return state;
					},
					close() {
						closes[index] = (closes[index] ?? 0) + 1;
						state = 'closed';
					}
				};
			}
		},
		lights: {
			get(id: string) {
				const result = deferred<ApiResponse<LightGet>>();
				gets.push({ id, result });
				return result.promise;
			}
		}
	} as unknown as HueClient;

	const stream = () => {
		const observer = observers.at(-1);
		if (!observer) {
			throw new Error('subscribe() was not called');
		}
		return observer;
	};

	return { client, observers, closes, gets, stream };
}

function recorder() {
	const changes: LightChange[][] = [];
	const events: Array<string> = [];
	const observer: LightChangeObserver = {
		onChanges: (batch) => {
			changes.push(batch);
			events.push('changes');
		},
		onConnected: () => events.push('connected'),
		onConnectionChange: (state: HueAppConnection) => events.push(`connection:${state}`)
	};
	return { observer, changes, events };
}

function setup() {
	const fake = fakeClient();
	const gateway = new HueSdkGateway(fake.client);
	const recorded = recorder();
	const unwatch = gateway.watch(recorded.observer);
	return { ...fake, ...recorded, gateway, unwatch };
}

function event(type: HueEvent['type'], data: HueEventResource[]): HueEvent {
	return { id: `event-${type}`, creationtime: '2026-10-20T00:00:00Z', type, data };
}

function lightGet(id: string, name: string, isOn: boolean, brightness?: number): LightGet {
	return {
		id,
		type: 'light',
		metadata: { name, archetype: 'classic_bulb' },
		on: { on: isOn },
		...(brightness === undefined ? {} : { dimming: { brightness } })
	} as unknown as LightGet;
}

describe('HueSdkGateway.watch', () => {
	it('subscribes to the event stream without invoking the observer', () => {
		const { observers, events } = setup();

		expect(observers).toHaveLength(1);
		expect(events).toEqual([]);
	});

	it('maps light updates to only the fields present', () => {
		const { stream, changes } = setup();

		stream().onEvents([
			event('update', [
				{ id: 'a', type: 'light', on: { on: true } },
				{ id: 'b', type: 'light', dimming: { brightness: 42.5 } },
				{ id: 'c', type: 'light', metadata: { name: 'Desk' } } as HueEventResource,
				{
					id: 'd',
					type: 'light',
					on: { on: false },
					dimming: { brightness: 0 },
					metadata: { name: 'Floor' }
				} as HueEventResource
			])
		]);

		expect(changes).toEqual([
			[
				{ kind: 'updated', id: 'a', isOn: true },
				{ kind: 'updated', id: 'b', brightness: 42.5 },
				{ kind: 'updated', id: 'c', name: 'Desk' },
				{ kind: 'updated', id: 'd', isOn: false, brightness: 0, name: 'Floor' }
			]
		]);
	});

	it('emits one onChanges per SDK batch and skips batches without light changes', () => {
		const { stream, changes } = setup();

		stream().onEvents([
			event('update', [{ id: 'a', type: 'light', on: { on: true } }]),
			event('delete', [{ id: 'b', type: 'light' }])
		]);
		stream().onEvents([
			event('update', [
				{ id: 'room', type: 'room', on: { on: true } },
				{ id: 'a', type: 'light', color: { xy: { x: 0.1, y: 0.2 } } } as HueEventResource
			]),
			event('error', [{ id: 'a', type: 'light', on: { on: false } }])
		]);
		stream().onEvents([]);

		expect(changes).toEqual([
			[
				{ kind: 'updated', id: 'a', isOn: true },
				{ kind: 'removed', id: 'b' }
			]
		]);
	});

	it('fetches added lights and emits them once loaded', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		expect(changes).toEqual([]);
		expect(gets.map((call) => call.id)).toEqual(['a']);

		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Lamp', true, 70)] });
		await flushMicrotasks();

		expect(changes).toEqual([
			[{ kind: 'added', light: { id: 'a', name: 'Lamp', isOn: true, brightness: 70 } }]
		]);
	});

	it('maps added lights without dimming to null brightness and ignores empty responses', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		stream().onEvents([event('add', [{ id: 'b', type: 'light' }])]);
		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Plug', false)] });
		gets[1]!.result.resolve({ errors: [], data: [] });
		await flushMicrotasks();

		expect(changes).toEqual([
			[{ kind: 'added', light: { id: 'a', name: 'Plug', isOn: false, brightness: null } }]
		]);
	});

	it('ignores failed fetches of added lights', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		gets[0]!.result.reject(new Error('not found'));
		await flushMicrotasks();

		expect(changes).toEqual([]);
	});

	it('drops an added light that is deleted before its fetch completes', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		stream().onEvents([event('delete', [{ id: 'a', type: 'light' }])]);
		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Lamp', true)] });
		await flushMicrotasks();

		expect(changes).toEqual([[{ kind: 'removed', id: 'a' }]]);
	});

	it('emits only the latest fetch when a light is added twice', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		gets[1]!.result.resolve({ errors: [], data: [lightGet('a', 'Newer', true)] });
		await flushMicrotasks();
		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Older', true)] });
		await flushMicrotasks();

		expect(changes).toEqual([
			[{ kind: 'added', light: { id: 'a', name: 'Newer', isOn: true, brightness: null } }]
		]);
	});

	it('ignores fetches that complete after unwatch', async () => {
		const { stream, changes, gets, unwatch } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		unwatch();
		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Lamp', true)] });
		await flushMicrotasks();

		expect(changes).toEqual([]);
	});

	it('maps stream states and reports the connection before onConnected', () => {
		const { stream, events } = setup();

		stream().onStateChange?.('connecting');
		stream().onStateChange?.('open');
		stream().onStateChange?.('reconnecting');
		stream().onStateChange?.('open');
		stream().onStateChange?.('closed');

		expect(events).toEqual([
			'connection:connecting',
			'connection:live',
			'connected',
			'connection:reconnecting',
			'connection:live',
			'connected',
			'connection:offline'
		]);
	});

	it('swallows stream errors', () => {
		const { stream, events } = setup();

		expect(() => stream().onError?.(new Error('boom'))).not.toThrow();
		expect(events).toEqual([]);
	});

	it('closes the subscription once on unwatch and ignores later callbacks', () => {
		const { stream, closes, events, unwatch } = setup();

		unwatch();
		unwatch();
		stream().onEvents([event('update', [{ id: 'a', type: 'light', on: { on: true } }])]);
		stream().onStateChange?.('open');

		expect(closes).toEqual([1]);
		expect(events).toEqual([]);
	});

	it('propagates a synchronous subscribe failure', () => {
		const fake = fakeClient();
		const error = new Error('stream unsupported');
		vi.spyOn(fake.client.events, 'subscribe').mockImplementation(() => {
			throw error;
		});
		const gateway = new HueSdkGateway(fake.client);

		expect(() => gateway.watch(recorder().observer)).toThrow(error);
	});
});
