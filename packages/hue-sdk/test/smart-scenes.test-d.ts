import { describe, expectTypeOf, it } from 'vitest';
import { createHueProtocol } from '../src/protocol.js';
import { createSmartScenesApi } from '../src/resources/smart-scenes.js';
import type { SmartScenesApi } from '../src/resources/smart-scenes.js';
import type {
	ApiResponse,
	ResourceIdentifier,
	ResourceIdentifierResponse
} from '../src/types/common.js';
import type {
	SmartSceneGet,
	SmartScenePost,
	SmartScenePut,
	WeekDay
} from '../src/types/smart-scene.js';
import { mockHttpClient } from './mock-http.js';

const smartScenes = createSmartScenesApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient({}) })
);

const group: ResourceIdentifier = { rid: 'g', rtype: 'room' };
const scene: ResourceIdentifier = { rid: 's', rtype: 'scene' };

describe('smart scenes contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(smartScenes.list()).resolves.toEqualTypeOf<ApiResponse<SmartSceneGet>>();
		expectTypeOf(smartScenes.get('id')).resolves.toEqualTypeOf<ApiResponse<SmartSceneGet>>();
		expectTypeOf(
			smartScenes.create({ metadata: { name: 'n' }, group, week_timeslots: [] })
		).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(smartScenes.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(smartScenes.delete('id')).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET, POST and PUT representations', () => {
		expectTypeOf<SmartSceneGet['type']>().toEqualTypeOf<'smart_scene'>();
		expectTypeOf<SmartScenePost['type']>().toEqualTypeOf<'smart_scene' | undefined>();
		expectTypeOf<SmartSceneGet['state']>().toEqualTypeOf<'active' | 'inactive'>();
		expectTypeOf<SmartSceneGet['transition_duration']>().toEqualTypeOf<number>();
		expectTypeOf<SmartScenePost['transition_duration']>().toEqualTypeOf<number | undefined>();
		expectTypeOf<SmartScenePut['week_timeslots']>().not.toEqualTypeOf<
			SmartScenePost['week_timeslots']
		>();
		expectTypeOf<SmartSceneGet['week_timeslots'][number]['recurrence']>().toEqualTypeOf<
			WeekDay[]
		>();
		expectTypeOf<NonNullable<SmartScenePut['recall']>['action']>().toEqualTypeOf<
			'activate' | 'deactivate' | undefined
		>();
		expectTypeOf<NonNullable<SmartScenePost['recall']>['action']>().toEqualTypeOf<
			'activate' | 'deactivate'
		>();
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error missing required metadata, group and week_timeslots
		smartScenes.create({});
		// @ts-expect-error missing required week_timeslots
		smartScenes.create({ metadata: { name: 'n' }, group });
		smartScenes.create({
			metadata: { name: 'n' },
			group,
			// @ts-expect-error invalid weekday
			week_timeslots: [{ timeslots: [], recurrence: ['someday'] }]
		});
		smartScenes.update('id', {
			week_timeslots: [
				// @ts-expect-error invalid start time kind
				{ timeslots: [{ start_time: { kind: 'sunrise' }, target: scene }], recurrence: [] }
			]
		});
		// @ts-expect-error invalid recall action
		smartScenes.update('id', { recall: { action: 'start' } });
		// @ts-expect-error read-only GET property
		smartScenes.update('id', { state: 'active' });
		// @ts-expect-error image is not accepted on PUT
		smartScenes.update('id', { metadata: { image: { rid: 'i', rtype: 'public_image' } } });
		smartScenes.update('id', {
			week_timeslots: [
				{
					// @ts-expect-error hour is required in a timeslot time
					timeslots: [{ start_time: { kind: 'time', time: { minute: 0 } }, target: scene }],
					recurrence: []
				}
			]
		});
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(smartScenes).toEqualTypeOf<SmartScenesApi>();
	});
});
