import { describe, expectTypeOf, it } from 'vite-plus/test';
import { createHueProtocol } from '../src/protocol.js';
import { createScenesApi } from '../src/resources/scenes.js';
import type { ScenesApi } from '../src/resources/scenes.js';
import type {
	ApiResponse,
	EmptyObject,
	ResourceIdentifier,
	ResourceIdentifierResponse
} from '../src/types/common.js';
import type {
	SceneActionContentGet,
	SceneActionContentPut,
	SceneGet,
	ScenePost,
	ScenePut
} from '../src/types/scene.js';
import { mockHttpClient } from './mock-http.js';

const scenes = createScenesApi(
	createHueProtocol({ baseUrl: 'https://bridge', appKey: 'key', httpClient: mockHttpClient({}) })
);

const group: ResourceIdentifier = { rid: 'g', rtype: 'room' };
const target: ResourceIdentifier = { rid: 'l', rtype: 'light' };

describe('scenes contract', () => {
	it('preserves response envelopes', () => {
		expectTypeOf(scenes.list()).resolves.toEqualTypeOf<ApiResponse<SceneGet>>();
		expectTypeOf(scenes.get('id')).resolves.toEqualTypeOf<ApiResponse<SceneGet>>();
		expectTypeOf(
			scenes.create({ metadata: { name: 'n' }, group, actions: [] })
		).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(scenes.update('id', {})).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
		expectTypeOf(scenes.delete('id')).resolves.toEqualTypeOf<ResourceIdentifierResponse>();
	});

	it('distinguishes GET, POST and PUT representations', () => {
		expectTypeOf<SceneGet['type']>().toEqualTypeOf<'scene'>();
		expectTypeOf<ScenePost['type']>().toEqualTypeOf<'scene' | undefined>();
		expectTypeOf<ScenePut['type']>().toEqualTypeOf<'scene' | undefined>();
		expectTypeOf<SceneGet['recall']>().toEqualTypeOf<EmptyObject>();
		expectTypeOf<ScenePut['recall']>().not.toEqualTypeOf<EmptyObject>();
		expectTypeOf<SceneGet['speed']>().toEqualTypeOf<number>();
		expectTypeOf<ScenePost['speed']>().toEqualTypeOf<number | undefined>();
		expectTypeOf<SceneGet['status']['active']>().toEqualTypeOf<
			'inactive' | 'static' | 'dynamic_palette' | undefined
		>();
		expectTypeOf<NonNullable<SceneGet['last_actions_update']>['source']>().toEqualTypeOf<
			'clip' | 'autogrow'
		>();
		expectTypeOf<NonNullable<ScenePut['recall']>['action']>().toEqualTypeOf<
			'active' | 'dynamic_palette' | 'static' | undefined
		>();
	});

	it('models required fields on POST', () => {
		expectTypeOf<Pick<ScenePost, 'actions' | 'metadata' | 'group'>>().toEqualTypeOf<{
			actions: ScenePost['actions'];
			metadata: ScenePost['metadata'];
			group: ScenePost['group'];
		}>();
		expectTypeOf<ScenePost['palette']>().toEqualTypeOf<
			NonNullable<ScenePost['palette']> | undefined
		>();
	});

	it('models nullable mirek on GET only', () => {
		expectTypeOf<NonNullable<SceneActionContentGet['color_temperature']>['mirek']>().toEqualTypeOf<
			number | null
		>();
		expectTypeOf<NonNullable<SceneActionContentPut['color_temperature']>['mirek']>().toEqualTypeOf<
			number | undefined
		>();
	});

	it('accepts valid request bodies', () => {
		scenes.update('id', { recall: { action: 'active', duration: 400 } });
		scenes.create({
			metadata: { name: 'n' },
			group,
			actions: [{ target, action: { on: { on: true }, dimming: { brightness: 10 } } }]
		});
	});

	it('rejects invalid request bodies', () => {
		// @ts-expect-error missing required actions, metadata and group
		scenes.create({});
		// @ts-expect-error missing required group
		scenes.create({ metadata: { name: 'n' }, actions: [] });
		// @ts-expect-error missing required name in metadata
		scenes.create({ metadata: {}, group, actions: [] });
		// @ts-expect-error action requires target
		scenes.create({ metadata: { name: 'n' }, group, actions: [{ action: {} }] });
		scenes.create({
			metadata: { name: 'n' },
			group,
			// @ts-expect-error brightness is required on POST dimming
			actions: [{ target, action: { dimming: {} } }]
		});
		// @ts-expect-error null mirek is GET only
		scenes.update('id', { actions: [{ target, action: { color_temperature: { mirek: null } } }] });
		// @ts-expect-error invalid recall action
		scenes.update('id', { recall: { action: 'play' } });
		// @ts-expect-error read-only GET property
		scenes.update('id', { status: { active: 'static' } });
		// @ts-expect-error recall is not part of POST
		scenes.create({ metadata: { name: 'n' }, group, actions: [], recall: { action: 'active' } });
		// @ts-expect-error invalid mapping algorithm
		scenes.update('id', { mapping: { algorithm: 'linear' } });
		// @ts-expect-error invalid effect
		scenes.update('id', { actions: [{ target, action: { effects: { effect: 'disco' } } }] });
		// @ts-expect-error image is not accepted on PUT
		scenes.update('id', { metadata: { image: { rid: 'i', rtype: 'public_image' } } });
	});

	it('exposes the resource API contract for fakes', () => {
		expectTypeOf(scenes).toEqualTypeOf<ScenesApi>();
	});
});
