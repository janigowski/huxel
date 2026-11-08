import { describe, expectTypeOf, it } from 'vite-plus/test';
import { data, on, read, type Data } from 'data-bus';

declare module 'data-bus' {
	interface DataMap {
		'app.status': 'idle' | 'ready';
		'light.color': { xy: { x: number; y: number } };
	}
}

describe('DataMap', () => {
	it('types a registered name from the map', () => {
		const status = data('app.status', 'idle');

		expectTypeOf(status).toEqualTypeOf<Data<'idle' | 'ready'>>();
		expectTypeOf(status.value).toEqualTypeOf<'idle' | 'ready'>();
		expectTypeOf(read('app.status')).toEqualTypeOf<'idle' | 'ready'>();
		expectTypeOf(data('app.status')).toEqualTypeOf<Data<'idle' | 'ready'>>();

		on('app.status', (value) => {
			expectTypeOf(value).toEqualTypeOf<'idle' | 'ready'>();
		});

		status.value = 'ready';
		// @ts-expect-error status only accepts the registered union
		status.value = 'missing';
		// @ts-expect-error a second argument still has to match the registered type
		data('app.status', 1);
	});

	it('infers an unregistered name from the initial value', () => {
		const brightness = data('light.brightness', 40);

		expectTypeOf(brightness.value).toEqualTypeOf<number>();
		expectTypeOf(data('light.brightness')).toEqualTypeOf<Data<unknown>>();
	});

	it('types a registered object', () => {
		const color = data('light.color', { xy: { x: 0.1, y: 0.2 } });

		expectTypeOf(color.value.xy.x).toEqualTypeOf<number>();
	});
});
