import type {
	ApiResponse,
	EventStreamObserver,
	EventStreamState,
	HueClient,
	HueEvent,
	HueEventResource,
	LightGet
} from 'hue-sdk';
import { describe, expect, it, vi } from 'vite-plus/test';
import { HueSdkGateway } from '../src/hue-sdk-gateway';
import { createHueApp } from '../src/index';
import type { HueAppConnection, LightChange, LightChangeObserver } from '../src/index';
import { deferred, flushMicrotasks, type Deferred } from './fakes';

function fakeClient() {
	const observers: EventStreamObserver[] = [];
	const closes: number[] = [];
	const gets: Array<{ id: string; result: Deferred<ApiResponse<LightGet>> }> = [];
	const lists: Deferred<ApiResponse<LightGet>>[] = [];
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
			list() {
				const result = deferred<ApiResponse<LightGet>>();
				lists.push(result);
				return result.promise;
			},
			get(id: string) {
				const result = deferred<ApiResponse<LightGet>>();
				gets.push({ id, result });
				return result.promise;
			}
		},
		rooms: {
			async list() {
				return { errors: [], data: [] };
			}
		},
		zones: {
			async list() {
				return { errors: [], data: [] };
			}
		},
		groupedLights: {
			async list() {
				return { errors: [], data: [] };
			}
		},
		devices: {
			async list() {
				return { errors: [], data: [] };
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

	return { client, observers, closes, gets, lists, stream };
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
	it('reports connecting from the subscription state even when the stream emits no initial state', () => {
		const { observers, events } = setup();

		expect(observers).toHaveLength(1);
		expect(events).toEqual(['connection:connecting']);
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

	it('maps color updates and builds added lights with color from the event payload', () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([
			event('update', [
				{ id: 'a', type: 'light', color: { xy: { x: 0.64, y: 0.33 } } } as HueEventResource,
				{
					id: 'b',
					type: 'light',
					on: { on: true },
					color: { xy: { x: 0.15, y: 0.06 } }
				} as HueEventResource,
				{ id: 'c', type: 'light', color: { xy: { x: 0.2 } } } as HueEventResource
			]),
			event('add', [
				{
					...lightGet('d', 'Strip', true, 50),
					color: { xy: { x: 0.3, y: 0.6 }, gamut_type: 'C' }
				} as HueEventResource,
				lightGet('e', 'Plug', false) as HueEventResource
			])
		]);

		expect(gets).toHaveLength(0);
		expect(changes).toEqual([
			[
				{ kind: 'updated', id: 'a', color: { x: 0.64, y: 0.33 } },
				{ kind: 'updated', id: 'b', isOn: true, color: { x: 0.15, y: 0.06 } },
				{
					kind: 'added',
					light: { id: 'd', name: 'Strip', isOn: true, brightness: 50, color: { x: 0.3, y: 0.6 } }
				},
				{
					kind: 'added',
					light: { id: 'e', name: 'Plug', isOn: false, brightness: null, color: null }
				}
			]
		]);
	});

	it('maps the color of fetched added lights', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		gets[0]!.result.resolve({
			errors: [],
			data: [{ ...lightGet('a', 'Lamp', true, 70), color: { xy: { x: 0.5, y: 0.4 } } } as LightGet]
		});
		await flushMicrotasks();

		expect(changes).toEqual([
			[
				{
					kind: 'added',
					light: { id: 'a', name: 'Lamp', isOn: true, brightness: 70, color: { x: 0.5, y: 0.4 } }
				}
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
				{ id: 'a', type: 'light', color_temperature: { mirek: 300 } } as HueEventResource
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

	it('reports offline when the stream closes permanently on its own', () => {
		const { stream, events } = setup();

		stream().onStateChange?.('open');
		stream().onError?.(new Error('unauthorized'));
		stream().onStateChange?.('closed');

		expect(events).toEqual([
			'connection:connecting',
			'connection:live',
			'connected',
			'connection:offline'
		]);
	});

	it('builds added lights from complete add payloads in order within the batch', () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([
			event('update', [{ id: 'a', type: 'light', on: { on: false } }]),
			event('add', [
				lightGet('b', 'Lamp', true, 35) as HueEventResource,
				lightGet('c', 'Plug', false) as HueEventResource
			]),
			event('update', [{ id: 'b', type: 'light', dimming: { brightness: 50 } }])
		]);

		expect(gets).toHaveLength(0);
		expect(changes).toEqual([
			[
				{ kind: 'updated', id: 'a', isOn: false },
				{
					kind: 'added',
					light: { id: 'b', name: 'Lamp', isOn: true, brightness: 35, color: null }
				},
				{
					kind: 'added',
					light: { id: 'c', name: 'Plug', isOn: false, brightness: null, color: null }
				},
				{ kind: 'updated', id: 'b', brightness: 50 }
			]
		]);
	});

	it('buffers updates for a light whose incomplete add is still being fetched', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light', on: { on: true } }])]);
		stream().onEvents([
			event('update', [
				{ id: 'a', type: 'light', dimming: { brightness: 90 } },
				{ id: 'other', type: 'light', on: { on: true } }
			])
		]);
		stream().onEvents([event('update', [{ id: 'a', type: 'light', on: { on: false } }])]);
		expect(changes).toEqual([[{ kind: 'updated', id: 'other', isOn: true }]]);

		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Lamp', true, 10)] });
		await flushMicrotasks();

		expect(changes.at(-1)).toEqual([
			{ kind: 'added', light: { id: 'a', name: 'Lamp', isOn: true, brightness: 10, color: null } },
			{ kind: 'updated', id: 'a', brightness: 90 },
			{ kind: 'updated', id: 'a', isOn: false }
		]);

		stream().onEvents([event('update', [{ id: 'a', type: 'light', dimming: { brightness: 5 } }])]);
		expect(changes.at(-1)).toEqual([{ kind: 'updated', id: 'a', brightness: 5 }]);
	});

	it('drops a pending fetch when a complete add for the same light arrives', async () => {
		const { stream, changes, gets } = setup();

		stream().onEvents([event('add', [{ id: 'a', type: 'light' }])]);
		stream().onEvents([event('update', [{ id: 'a', type: 'light', on: { on: false } }])]);
		stream().onEvents([event('add', [lightGet('a', 'Fresh', true, 60) as HueEventResource])]);
		gets[0]!.result.resolve({ errors: [], data: [lightGet('a', 'Stale', false, 1)] });
		await flushMicrotasks();

		expect(changes).toEqual([
			[
				{
					kind: 'added',
					light: { id: 'a', name: 'Fresh', isOn: true, brightness: 60, color: null }
				}
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
			[{ kind: 'added', light: { id: 'a', name: 'Lamp', isOn: true, brightness: 70, color: null } }]
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
			[
				{
					kind: 'added',
					light: { id: 'a', name: 'Plug', isOn: false, brightness: null, color: null }
				}
			]
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
		stream().onEvents([event('update', [{ id: 'a', type: 'light', on: { on: true } }])]);
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
			[
				{
					kind: 'added',
					light: { id: 'a', name: 'Newer', isOn: true, brightness: null, color: null }
				}
			]
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
		expect(events).toEqual(['connection:connecting']);
	});

	it('closes the subscription once on unwatch and ignores later callbacks', () => {
		const { stream, closes, events, unwatch } = setup();

		unwatch();
		unwatch();
		stream().onEvents([event('update', [{ id: 'a', type: 'light', on: { on: true } }])]);
		stream().onStateChange?.('open');

		expect(closes).toEqual([1]);
		expect(events).toEqual(['connection:connecting']);
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

	describe('with HueApp', () => {
		async function setupApp() {
			const fake = fakeClient();
			const app = createHueApp({ gateway: new HueSdkGateway(fake.client), settleMs: 0 });
			const states: HueAppConnection[] = [];
			const unsubscribe = app.state.connection.subscribe((state) => states.push(state));
			const initialization = app.initialize();
			fake.lists[0]!.resolve({ errors: [], data: [lightGet('desk', 'Desk', false, 30)] });
			await initialization;
			return { ...fake, app, states, unsubscribe };
		}

		it('shows connecting, live and offline with a stream that emits no initial state', async () => {
			const { app, stream, states, unsubscribe } = await setupApp();
			expect(states).toEqual(['offline', 'connecting']);

			stream().onStateChange?.('open');
			expect(states).toEqual(['offline', 'connecting', 'live']);

			stream().onStateChange?.('closed');
			expect(states).toEqual(['offline', 'connecting', 'live', 'offline']);
			app.dispose();
			unsubscribe();
		});

		it('keeps an update that arrives while an incomplete add is being fetched', async () => {
			const { app, stream, gets, unsubscribe } = await setupApp();
			stream().onStateChange?.('open');

			stream().onEvents([event('add', [{ id: 'lamp', type: 'light' }])]);
			stream().onEvents([event('update', [{ id: 'lamp', type: 'light', on: { on: true } }])]);
			gets[0]!.result.resolve({ errors: [], data: [lightGet('lamp', 'Lamp', false, 20)] });
			await flushMicrotasks();

			const lamp = app.state.lights.get('lamp');
			expect(lamp?.name.value).toBe('Lamp');
			expect(lamp?.isOn.value).toBe(true);
			expect(lamp?.brightness.value).toBe(20);
			app.dispose();
			unsubscribe();
		});
	});
});
