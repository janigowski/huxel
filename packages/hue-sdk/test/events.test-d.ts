import { describe, expectTypeOf, it } from 'vitest';
import { createHueClient } from '../src/index.js';
import type {
	EventStreamState,
	EventStreamSubscription,
	EventsApi,
	HueEvent,
	HueEventResource,
	HueEventType,
	LightEventResource,
	OtherEventResource
} from '../src/index.js';

const hue = createHueClient({ baseUrl: 'https://bridge', appKey: 'key' });

describe('events contract', () => {
	it('exposes the events API', () => {
		expectTypeOf(hue.events).toEqualTypeOf<EventsApi>();
		expectTypeOf(
			hue.events.subscribe({ onEvents: () => {} })
		).toEqualTypeOf<EventStreamSubscription>();
		expectTypeOf<EventStreamSubscription['state']>().toEqualTypeOf<EventStreamState>();
	});

	it('types event batches', () => {
		hue.events.subscribe({
			onEvents(events) {
				expectTypeOf(events).toEqualTypeOf<HueEvent[]>();
				expectTypeOf(events[0]!.type).toEqualTypeOf<HueEventType>();
				expectTypeOf(events[0]!.data).toEqualTypeOf<HueEventResource[]>();
			}
		});
	});

	it('narrows resources to light on type', () => {
		const resource = {} as HueEventResource;
		if (resource.type === 'light') {
			expectTypeOf(resource).toEqualTypeOf<LightEventResource>();
			expectTypeOf(resource.on?.on).toEqualTypeOf<boolean | undefined>();
		} else {
			expectTypeOf(resource).toEqualTypeOf<OtherEventResource>();
		}
	});
});
