import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createBridgesApi, type BridgesApi } from '../src/resources/bridges.js';
import type { ApiResponse, ResourceIdentifierResponse } from '../src/types/common.js';
import type { BridgeGet, BridgePut } from '../src/types/bridge.js';
import { mockHttpClient } from './mock-http.js';

const bridges = createBridgesApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient() })
);

describe('bridges contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(bridges.list()).resolves.toEqualTypeOf<ApiResponse<BridgeGet>>();
		expectTypeOf(bridges.get('id')).resolves.toEqualTypeOf<ApiResponse<BridgeGet>>();
		expectTypeOf(bridges.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET and PUT representations', () => {
		expectTypeOf<BridgeGet['bridge_id']>().toEqualTypeOf<string>();
		expectTypeOf<BridgePut['type']>().toEqualTypeOf<'bridge' | undefined>();
		expectTypeOf<BridgeGet['type']>().toEqualTypeOf<'bridge'>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error unknown property
		bridges.update('id', { bridge_id: '0123456789ab' });
		// @ts-expect-error read-only GET property
		bridges.update('id', { time_zone: { time_zone: 'Europe/Amsterdam' } });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(bridges).toEqualTypeOf<BridgesApi>();
	});
});
