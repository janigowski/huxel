import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueClient } from '../src/index';
import type {
	ApiResponse,
	LightGet,
	LightPut,
	LightsApi,
	ResourceIdentifierResponse
} from '../src/index';

const hue = createHueClient({ baseUrl: 'https://bridge', appKey: 'key' });

describe('lights contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(hue.lights.list()).resolves.toEqualTypeOf<ApiResponse<LightGet>>();
		expectTypeOf(hue.lights.get('id')).resolves.toEqualTypeOf<ApiResponse<LightGet>>();
		expectTypeOf(hue.lights.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(hue.lights.updateMany([])).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET and PUT representations', () => {
		expectTypeOf<LightGet['on']['on']>().toEqualTypeOf<boolean>();
		expectTypeOf<LightPut['on']>().toEqualTypeOf<{ on?: boolean } | undefined>();
		expectTypeOf<LightGet['type']>().toEqualTypeOf<'light'>();
		expectTypeOf<LightPut['type']>().toEqualTypeOf<'light' | undefined>();
	});

	it('models nullable mirek on GET only', () => {
		expectTypeOf<NonNullable<LightGet['color_temperature']>['mirek']>().toEqualTypeOf<
			number | null
		>();
		expectTypeOf<NonNullable<LightPut['color_temperature']>['mirek']>().toEqualTypeOf<
			number | undefined
		>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error unknown property
		hue.lights.update('id', { brightness: 50 });
		// @ts-expect-error invalid enum value
		hue.lights.update('id', { dimming_delta: { action: 'sideways' } });
		// @ts-expect-error read-only GET property
		hue.lights.update('id', { mode: 'normal' });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(hue.lights).toEqualTypeOf<LightsApi>();
	});
});
