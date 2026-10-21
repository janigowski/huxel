import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueClient } from '../src/index.js';
import type { AnyResourceGet, ApiResponse, LightGet, UncoveredResourceGet } from '../src/index.js';

const hue = createHueClient({ baseUrl: 'https://bridge', appKey: 'key' });

describe('client contract', () => {
	it('types GET /resource as a discriminated union', () => {
		expectTypeOf(hue.resources.list()).resolves.toEqualTypeOf<ApiResponse<AnyResourceGet>>();

		function narrow(item: AnyResourceGet) {
			if (item.type === 'light') {
				expectTypeOf(item).toEqualTypeOf<LightGet>();
			}
			if (item.type === 'motion') {
				expectTypeOf(item).toEqualTypeOf<UncoveredResourceGet>();
				expectTypeOf(item['enabled']).toEqualTypeOf<unknown>();
			}
		}
		expectTypeOf(narrow).toBeFunction();
	});

	it('rejects unknown resource type filters', () => {
		// @ts-expect-error invalid resource type
		hue.resources.list({ type: 'lamp' });
	});
});
