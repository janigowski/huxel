import type {
	EventStreamObserver,
	EventStreamSubscription,
	GroupedLightGet,
	GroupedLightPut,
	HueClient,
	HueEvent,
	RoomGet,
	ZoneGet
} from 'hue-sdk';

export interface FakeHueFixtures {
	rooms?: readonly RoomGet[];
	zones?: readonly ZoneGet[];
	groupedLights?: readonly GroupedLightGet[];
	groupedLight?: (id: string) => GroupedLightGet | undefined;
}

export interface GroupedLightUpdate {
	readonly id: string;
	readonly body: GroupedLightPut;
}

export class FakeHueClient {
	readonly lists: string[] = [];
	readonly updates: GroupedLightUpdate[] = [];
	readonly gets: string[] = [];

	private readonly observers: EventStreamObserver[] = [];
	private readonly fixtures: FakeHueFixtures;

	constructor(fixtures: FakeHueFixtures = {}) {
		this.fixtures = fixtures;
	}

	get client(): HueClient {
		return this as unknown as HueClient;
	}

	emit(events: HueEvent[]): void {
		const observer = this.observers.at(-1);
		if (!observer) {
			throw new Error('watch did not subscribe');
		}

		observer.onEvents(events);
	}

	readonly rooms = {
		list: async () => {
			this.lists.push('rooms');

			return { errors: [], data: [...(this.fixtures.rooms ?? [])] };
		},
		get: async () => ({ errors: [], data: [] as RoomGet[] })
	};

	readonly zones = {
		list: async () => {
			this.lists.push('zones');

			return { errors: [], data: [...(this.fixtures.zones ?? [])] };
		},
		get: async () => ({ errors: [], data: [] as ZoneGet[] })
	};

	readonly groupedLights = {
		list: async () => {
			this.lists.push('groupedLights');

			return { errors: [], data: [...(this.fixtures.groupedLights ?? [])] };
		},
		get: async (id: string) => {
			this.gets.push(id);
			const light =
				this.fixtures.groupedLight?.(id) ??
				this.fixtures.groupedLights?.find((item) => item.id === id);

			return { errors: [], data: light ? [light] : [] };
		},
		update: async (id: string, body: GroupedLightPut) => {
			this.updates.push({ id, body });

			return { errors: [], data: [{ rid: id, rtype: 'grouped_light' as const }] };
		}
	};

	readonly events = {
		subscribe: (observer: EventStreamObserver): EventStreamSubscription => {
			this.observers.push(observer);

			return { state: 'connecting', close: () => {} };
		}
	};
}
