import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createZonesApi, type ZonesApi } from '../src/resources/zones.js';
import type { ApiResponse, ResourceIdentifierResponse } from '../src/types/common.js';
import type { ZoneGet, ZonePost, ZonePut } from '../src/types/zone.js';
import { mockHttpClient } from './mock-http.js';

const zones = createZonesApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient() })
);

describe('zones contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(zones.list()).resolves.toEqualTypeOf<ApiResponse<ZoneGet>>();
		expectTypeOf(zones.get('id')).resolves.toEqualTypeOf<ApiResponse<ZoneGet>>();
		expectTypeOf(
			zones.create({ children: [], metadata: { name: 'x', archetype: 'other' } })
		).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(zones.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(zones.delete('id')).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET and PUT representations', () => {
		expectTypeOf<ZoneGet['metadata']['archetype']>().toEqualTypeOf<
			ZonePost['metadata']['archetype']
		>();
		expectTypeOf<ZonePut['metadata']>().toEqualTypeOf<
			{ name?: string; archetype?: ZoneGet['metadata']['archetype'] } | undefined
		>();
		expectTypeOf<ZoneGet['type']>().toEqualTypeOf<'zone'>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error unknown property
		zones.update('id', { geometry: {} });
		// @ts-expect-error invalid enum value
		zones.create({ children: [], metadata: { name: 'x', archetype: 'invalid' } });
		// @ts-expect-error read-only GET property
		zones.update('id', { services: [] });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(zones).toEqualTypeOf<ZonesApi>();
	});
});
