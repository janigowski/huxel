import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createBridgeHomesApi, type BridgeHomesApi } from '../src/resources/bridge-homes.js';
import type { ApiResponse } from '../src/types/common.js';
import type { BridgeHomeGet } from '../src/types/bridge-home.js';
import { mockHttpClient } from './mock-http.js';

const bridgeHomes = createBridgeHomesApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient() })
);

describe('bridge homes contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(bridgeHomes.list()).resolves.toEqualTypeOf<ApiResponse<BridgeHomeGet>>();
		expectTypeOf(bridgeHomes.get('id')).resolves.toEqualTypeOf<ApiResponse<BridgeHomeGet>>();
	});

	it('models read-only bridge home resources', () => {
		expectTypeOf<BridgeHomeGet['type']>().toEqualTypeOf<'bridge_home'>();
		expectTypeOf<BridgeHomeGet['children']>().toEqualTypeOf<BridgeHomeGet['services']>();
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(bridgeHomes).toEqualTypeOf<BridgeHomesApi>();
	});
});
