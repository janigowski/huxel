import { HueResponseError } from '../errors';
import { excerpt, isRecord, parseJsonBody } from '../protocol';
import type { HueEvent, HueEventResource, HueEventType } from '../types/event';

export interface DecodedEvents {
	events: HueEvent[];
	error?: HueResponseError;
}

type EventEnvelope = Omit<HueEvent, 'data'> & { data: unknown[] } & Record<string, unknown>;

const EVENT_TYPES: readonly string[] = [
	'add',
	'update',
	'delete',
	'error'
] satisfies HueEventType[];

export class HueEventDecoder {
	constructor(private readonly status: number) {}

	decode(data: string): DecodedEvents {
		if (data === '') {
			return { events: [] };
		}

		const parsed = parseJsonBody(data);

		if (!parsed.ok) {
			return this.reject('Hue event stream sent a non-JSON message', data, {
				cause: parsed.error
			});
		}

		if (!Array.isArray(parsed.value)) {
			return this.reject('Hue event stream sent a message that is not an array of events', data);
		}

		const events: HueEvent[] = [];
		let invalidEvents = 0;
		let invalidResources = 0;

		for (const item of parsed.value as unknown[]) {
			if (!HueEventDecoder.isEnvelope(item)) {
				invalidEvents++;
				continue;
			}

			const resources = item.data.filter(HueEventDecoder.isResource);
			invalidResources += item.data.length - resources.length;
			events.push({ ...item, data: resources });
		}

		if (invalidEvents === 0 && invalidResources === 0) {
			return { events };
		}

		return {
			events,
			error: new HueResponseError(
				`Hue event stream message contained ${invalidEvents} invalid event(s) and ${invalidResources} invalid resource(s); they were dropped`,
				this.status,
				excerpt(data)
			)
		};
	}

	private reject(message: string, data: string, options?: ErrorOptions): DecodedEvents {
		return {
			events: [],
			error: new HueResponseError(message, this.status, excerpt(data), options)
		};
	}

	private static isEnvelope(value: unknown): value is EventEnvelope {
		return (
			isRecord(value) &&
			typeof value.id === 'string' &&
			typeof value.creationtime === 'string' &&
			typeof value.type === 'string' &&
			EVENT_TYPES.includes(value.type) &&
			Array.isArray(value.data)
		);
	}

	private static isResource(value: unknown): value is HueEventResource {
		return isRecord(value) && typeof value.id === 'string' && typeof value.type === 'string';
	}
}
