import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol';
import { createBridgeHomesApi, type BridgeHomesApi } from '../src/resources/bridge-homes';
import type { ApiResponse } from '../src/types/common';
import type { BridgeHomeGet } from '../src/types/bridge-home';
import { mockHttpClient } from './mock-http';

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
