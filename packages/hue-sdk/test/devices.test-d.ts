import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol';
import { createDevicesApi, type DevicesApi } from '../src/resources/devices';
import type { ApiResponse, ResourceIdentifierResponse } from '../src/types/common';
import type { DeviceGet, DevicePut } from '../src/types/device';
import { mockHttpClient } from './mock-http';

const devices = createDevicesApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient() })
);

describe('devices contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(devices.list()).resolves.toEqualTypeOf<ApiResponse<DeviceGet>>();
		expectTypeOf(devices.get('id')).resolves.toEqualTypeOf<ApiResponse<DeviceGet>>();
		expectTypeOf(devices.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(devices.delete('id')).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET and PUT representations', () => {
		expectTypeOf<DeviceGet['metadata']['name']>().toEqualTypeOf<string>();
		expectTypeOf<DevicePut['metadata']>().toEqualTypeOf<
			{ name?: string; archetype?: DeviceGet['metadata']['archetype'] } | undefined
		>();
		expectTypeOf<DeviceGet['type']>().toEqualTypeOf<'device'>();
		expectTypeOf<DevicePut['type']>().toEqualTypeOf<'device' | undefined>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error unknown property
		devices.update('id', { services: [] });
		// @ts-expect-error invalid enum value
		devices.update('id', { metadata: { archetype: 'spaceship' } });
		// @ts-expect-error read-only GET property
		devices.update('id', { product_data: { model_id: 'x' } });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(devices).toEqualTypeOf<DevicesApi>();
	});
});
