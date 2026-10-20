import { describe, expectTypeOf, it } from 'vitest';
import { createHueProtocol } from '../src/protocol.js';
import { createRoomsApi, type RoomsApi } from '../src/resources/rooms.js';
import type { ApiResponse, ResourceIdentifierResponse } from '../src/types/common.js';
import type { RoomGet, RoomPost, RoomPut } from '../src/types/room.js';
import { mockHttpClient } from './mock-http.js';

const rooms = createRoomsApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient() })
);

describe('rooms contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(rooms.list()).resolves.toEqualTypeOf<ApiResponse<RoomGet>>();
		expectTypeOf(rooms.get('id')).resolves.toEqualTypeOf<ApiResponse<RoomGet>>();
		expectTypeOf(
			rooms.create({ children: [], metadata: { name: 'x', archetype: 'other' } })
		).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(rooms.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(rooms.delete('id')).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET and PUT representations', () => {
		expectTypeOf<RoomGet['metadata']['name']>().toEqualTypeOf<string>();
		expectTypeOf<RoomPut['metadata']>().toEqualTypeOf<
			{ name?: string; archetype?: RoomGet['metadata']['archetype'] } | undefined
		>();
		expectTypeOf<RoomGet['type']>().toEqualTypeOf<'room'>();
		expectTypeOf<RoomPut['type']>().toEqualTypeOf<'room' | undefined>();
	});

	it('requires POST fields', () => {
		expectTypeOf<RoomPost['children']>().toEqualTypeOf<RoomGet['children']>();
		expectTypeOf<RoomPost['metadata']['name']>().toEqualTypeOf<string>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error unknown property
		rooms.update('id', { services: [] });
		// @ts-expect-error invalid enum value
		rooms.update('id', { metadata: { archetype: 'spaceship' } });
		// @ts-expect-error read-only GET property
		rooms.update('id', { id_v1: '/groups/1' });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(rooms).toEqualTypeOf<RoomsApi>();
	});
});
