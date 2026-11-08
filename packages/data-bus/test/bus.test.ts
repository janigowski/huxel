import { describe, expect, test } from 'vite-plus/test';
import { DataBus, DuplicateDataError, UnknownDataError } from '../src/index';

describe('DataBus', () => {
	test('reads and writes a primitive through a const or an object property', () => {
		const bus = new DataBus();
		const status = bus.data('status', 'idle');
		const app = { status };

		expect(status.name).toBe('status');
		expect(status.value).toBe('idle');
		expect(bus.read('status')).toBe('idle');

		app.status.value = 'ready';

		expect(status.value).toBe('ready');
		expect(bus.read('status')).toBe('ready');
	});

	test('keeps falsy initials', () => {
		const bus = new DataBus();

		expect(bus.data('flag', false).value).toBe(false);
		expect(bus.data('empty', '').value).toBe('');
		expect(bus.data('zero', 0).value).toBe(0);
		expect(bus.data('nothing', undefined).value).toBeUndefined();
		expect(bus.data('missing', null).value).toBeNull();
	});

	test('publishes writes to subscribers and skips equal values', () => {
		const bus = new DataBus();
		const status = bus.data('status', 'idle');
		const seen: string[] = [];
		const stop = bus.on('status', (value: string) => {
			seen.push(value);
		});

		status.value = 'idle';
		status.value = 'loading';
		bus.write('status', 'ready');
		stop();
		status.value = 'error';

		expect(seen).toEqual(['loading', 'ready']);
	});

	test('does not publish when the slot is created', () => {
		const bus = new DataBus();
		const seen: string[] = [];

		bus.data('status', 'idle');
		bus.on('status', (value: string) => {
			seen.push(value);
		});

		expect(seen).toEqual([]);
	});

	test('returns the same handle for an existing name', () => {
		const bus = new DataBus();
		const status = bus.data('status', 'idle');

		expect(bus.data('status')).toBe(status);
		expect(bus.data('status').value).toBe('idle');
	});

	test('rejects a second definition and an unknown name', () => {
		const bus = new DataBus();

		bus.data('status', 'idle');

		expect(() => bus.data('status', 'ready')).toThrow(DuplicateDataError);
		expect(() => bus.read('missing')).toThrow(UnknownDataError);
		expect(() => bus.on('missing', () => {})).toThrow(UnknownDataError);
		expect(() => bus.data('missing')).toThrow(UnknownDataError);
	});

	test('keeps later subscribers running when one unsubscribes during publish', () => {
		const bus = new DataBus();
		const status = bus.data('status', 'idle');
		const seen: string[] = [];
		let stopFirst = () => {};

		stopFirst = bus.on('status', () => {
			stopFirst();
			seen.push('first');
		});
		bus.on('status', () => {
			seen.push('second');
		});

		status.value = 'ready';
		status.value = 'error';

		expect(seen).toEqual(['first', 'second', 'second']);
	});

	test('isolates buses and clears slots on reset', () => {
		const first = new DataBus();
		const second = new DataBus();
		const status = first.data('status', 'idle');

		second.data('status', 'ready');
		expect(first.read('status')).toBe('idle');
		expect(second.read('status')).toBe('ready');

		const color = first.data('color', { x: 0 });
		const view = color.value;
		let writes = 0;

		first.on('color', () => {
			writes += 1;
		});
		first.reset();
		view.x = 1;

		expect(writes).toBe(0);
		expect(() => status.value).toThrow(UnknownDataError);
		expect(() => first.read('status')).toThrow(UnknownDataError);
		expect(second.read('status')).toBe('ready');
	});

	test('publishes nested object writes and ignores unchanged properties', () => {
		const bus = new DataBus();
		const color = bus.data('color', { xy: { x: 0.1, y: 0.2 }, on: true });
		const seen: number[] = [];

		bus.on('color', (value: { xy: { x: number }; on: boolean }) => {
			seen.push(value.xy.x);
		});

		color.value.xy.x = 0.1;
		color.value.xy.x = 0.4;
		color.value.on = false;
		color.value = color.value;

		expect(color.value).toEqual({ xy: { x: 0.4, y: 0.2 }, on: false });
		expect(seen).toEqual([0.4, 0.4]);
		expect(bus.read('color')).toBe(color.value);
	});

	test('publishes when a property is deleted or replaced', () => {
		const bus = new DataBus();
		const initial: { a?: number; b: { n: number } } = { a: 1, b: { n: 2 } };
		const state = bus.data('state', initial);
		let calls = 0;

		bus.on('state', () => {
			calls += 1;
		});

		delete state.value.a;
		state.value.b = { n: 3 };
		state.value = { a: 4, b: { n: 5 } };

		expect(calls).toBe(3);
		expect(state.value).toEqual({ a: 4, b: { n: 5 } });
	});

	test('stores arrays and class instances without deep tracking', () => {
		const bus = new DataBus();
		const tags = bus.data('tags', ['warm']);
		const model = bus.data('model', new Model('desk'));
		let tagCalls = 0;
		let modelCalls = 0;

		bus.on('tags', () => {
			tagCalls += 1;
		});
		bus.on('model', () => {
			modelCalls += 1;
		});

		tags.value.push('cool');
		model.value.name = 'lamp';
		expect(tagCalls).toBe(0);
		expect(modelCalls).toBe(0);

		tags.value = ['warm', 'cool'];
		model.value = new Model('lamp');

		expect(tagCalls).toBe(1);
		expect(modelCalls).toBe(1);
		expect(tags.value).toEqual(['warm', 'cool']);
	});

	test('follows a cycle and ignores writes through a replaced object', () => {
		const bus = new DataBus();
		const root: { self?: object; n: number } = { n: 0 };
		root.self = root;
		const state = bus.data('state', root);
		let calls = 0;

		bus.on('state', () => {
			calls += 1;
		});

		const first = state.value;
		(first.self as { n: number }).n = 1;
		state.value = { n: 2 };
		first.n = 3;

		expect(calls).toBe(2);
		expect(state.value.n).toBe(2);
		expect(first.n).toBe(3);
	});

	test('tracks plain objects created with a null prototype', () => {
		const bus = new DataBus();
		const state = bus.data('state', Object.create(null) as { n?: number });
		let calls = 0;

		bus.on('state', () => {
			calls += 1;
		});
		state.value.n = 1;

		expect(calls).toBe(1);
		expect(state.value.n).toBe(1);
	});

	test('serializes proxied objects', () => {
		const bus = new DataBus();
		const color = bus.data('color', { xy: { x: 0.2, y: 0.3 } });

		expect(JSON.parse(JSON.stringify(color.value))).toEqual({ xy: { x: 0.2, y: 0.3 } });
	});
});

class Model {
	constructor(public name: string) {}
}
