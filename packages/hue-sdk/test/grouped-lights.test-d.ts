import { describe, expectTypeOf, it } from 'vitest';
import { createHueProtocol } from '../src/protocol.js';
import { createGroupedLightsApi, type GroupedLightsApi } from '../src/resources/grouped-lights.js';
import type { ApiResponse, ResourceIdentifierResponse } from '../src/types/common.js';
import type { GroupedLightGet, GroupedLightPut } from '../src/types/grouped-light.js';
import { mockHttpClient } from './mock-http.js';

const groupedLights = createGroupedLightsApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient() })
);

describe('grouped lights contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(groupedLights.list()).resolves.toEqualTypeOf<ApiResponse<GroupedLightGet>>();
		expectTypeOf(groupedLights.get('id')).resolves.toEqualTypeOf<ApiResponse<GroupedLightGet>>();
		expectTypeOf(
			groupedLights.update('id', {})
		).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET and PUT representations', () => {
		expectTypeOf<NonNullable<GroupedLightGet['on']>['on']>().toEqualTypeOf<boolean>();
		expectTypeOf<GroupedLightPut['on']>().toEqualTypeOf<{ on?: boolean } | undefined>();
		expectTypeOf<GroupedLightGet['type']>().toEqualTypeOf<'grouped_light'>();
		expectTypeOf<GroupedLightPut['type']>().toEqualTypeOf<'grouped_light' | undefined>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error unknown property
		groupedLights.update('id', { brightness: 50 });
		// @ts-expect-error invalid enum value
		groupedLights.update('id', { dimming_delta: { action: 'sideways' } });
		// @ts-expect-error read-only GET property
		groupedLights.update('id', { owner: { rid: 'x', rtype: 'room' } });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(groupedLights).toEqualTypeOf<GroupedLightsApi>();
	});
});
