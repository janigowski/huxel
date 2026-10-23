import type { HueClient, HueEventType } from 'hue-sdk';
import type { GroupedLightGet } from 'hue-sdk';
import { xyColorFrom, type XyColor } from './color';
import type { AreaChange, AreaKind, BridgeArea } from './gateway';

interface NamedGroup {
	id: string;
	metadata: { name: string };
	services: readonly { rid: string; rtype: string }[];
}

interface PendingAdd {
	token: object;
	name?: string;
}

interface ControlFields {
	isOn?: boolean;
	brightness?: number;
	color?: XyColor;
}

type AreaClient = Pick<HueClient, 'rooms' | 'zones' | 'groupedLights'>;

export function joinAreas(
	groups: readonly NamedGroup[],
	lights: readonly GroupedLightGet[]
): BridgeArea[] {
	const grouped = new Map(lights.map((light) => [light.id, light]));
	const areas: BridgeArea[] = [];

	for (const group of groups) {
		const serviceId = groupedLightId(group.services);
		const light = serviceId ? grouped.get(serviceId) : undefined;
		if (!serviceId || !light) {
			continue;
		}

		areas.push(toBridgeArea(group.id, group.metadata.name, serviceId, light));
	}

	return areas;
}

export function createAreaEventSession(
	client: AreaClient,
	emit: (changes: AreaChange[]) => void
): {
	handle(
		type: HueEventType,
		resource: { id: string; type: string; [key: string]: unknown }
	): AreaChange[];
	stop(): void;
} {
	let active = true;
	const pendingAdds = new Map<string, PendingAdd>();
	const serviceBuffer = new Map<string, ControlFields>();

	const finishPending = (key: string, token: object): PendingAdd | undefined => {
		const pending = pendingAdds.get(key);
		if (!active || pending?.token !== token) {
			return undefined;
		}

		pendingAdds.delete(key);
		if (pendingAdds.size === 0) {
			serviceBuffer.clear();
		}

		return pending;
	};

	const resolveAdd = async (
		kind: AreaKind,
		id: string,
		resource: Record<string, unknown>,
		token: object
	): Promise<void> => {
		const key = pendingKey(kind, id);
		let name = readName(resource);
		let serviceId = readServiceId(resource);

		if (!name || !serviceId) {
			const group = await readGroup(client, kind, id);
			if (!group) {
				finishPending(key, token);
				return;
			}
			name = name ?? group.metadata.name;
			serviceId = serviceId ?? groupedLightId(group.services);
		}

		if (!name || !serviceId) {
			finishPending(key, token);
			return;
		}

		const light = await readGroupedLight(client, serviceId);
		if (!light) {
			finishPending(key, token);
			return;
		}

		const pending = pendingAdds.get(key);
		if (!active || pending?.token !== token) {
			return;
		}

		const overlay = serviceBuffer.get(serviceId);
		const resolvedName = pending.name ?? name;
		pendingAdds.delete(key);
		if (pendingAdds.size === 0) {
			serviceBuffer.clear();
		}

		emit([
			{
				kind: 'added',
				resource: kind,
				area: {
					...toBridgeArea(id, resolvedName, serviceId, light),
					...overlay
				}
			}
		]);
	};

	return {
		handle(type, resource) {
			if (!active || type === 'error') {
				return [];
			}

			if (resource.type === 'room' || resource.type === 'zone') {
				const kind = resource.type;
				const key = pendingKey(kind, resource.id);

				if (type === 'delete') {
					pendingAdds.delete(key);
					if (pendingAdds.size === 0) {
						serviceBuffer.clear();
					}
					return [{ kind: 'removed', resource: kind, id: resource.id }];
				}

				if (type === 'add') {
					const token = {};
					pendingAdds.set(key, { token });
					void resolveAdd(kind, resource.id, resource, token);
					return [];
				}

				const name = readName(resource);
				if (name === undefined) {
					return [];
				}
				const pending = pendingAdds.get(key);
				if (pending) {
					pending.name = name;
				}
				return [{ kind: 'updated', resource: kind, id: resource.id, name }];
			}

			if (resource.type !== 'grouped_light') {
				return [];
			}

			if (type === 'delete') {
				return [{ kind: 'service-removed', serviceId: resource.id }];
			}

			if (type !== 'update' && type !== 'add') {
				return [];
			}

			const fields = controlFields(resource);
			if (!fields) {
				return [];
			}
			if (pendingAdds.size > 0) {
				serviceBuffer.set(resource.id, { ...serviceBuffer.get(resource.id), ...fields });
			}
			return [{ kind: 'service-updated', serviceId: resource.id, ...fields }];
		},
		stop() {
			active = false;
			pendingAdds.clear();
			serviceBuffer.clear();
		}
	};
}

function pendingKey(kind: AreaKind, id: string): string {
	return `${kind}:${id}`;
}

function groupedLightId(services: readonly { rid: string; rtype: string }[]): string | undefined {
	return services.find((service) => service.rtype === 'grouped_light')?.rid;
}

async function readGroup(
	client: AreaClient,
	kind: AreaKind,
	id: string
): Promise<NamedGroup | undefined> {
	try {
		const response = kind === 'room' ? await client.rooms.get(id) : await client.zones.get(id);
		return response.data[0];
	} catch {
		return undefined;
	}
}

async function readGroupedLight(
	client: AreaClient,
	id: string
): Promise<GroupedLightGet | undefined> {
	try {
		const response = await client.groupedLights.get(id);
		return response.data[0];
	} catch {
		return undefined;
	}
}

function toBridgeArea(
	id: string,
	name: string,
	serviceId: string,
	light: GroupedLightGet
): BridgeArea {
	return {
		id,
		name,
		serviceId,
		isOn: light.on?.on ?? false,
		brightness: typeof light.dimming?.brightness === 'number' ? light.dimming.brightness : null,
		color: xyColorFrom(light.color?.xy)
	};
}

function readName(resource: Record<string, unknown>): string | undefined {
	const metadata = resource.metadata;
	if (typeof metadata !== 'object' || metadata === null) {
		return undefined;
	}

	const name = (metadata as { name?: unknown }).name;

	return typeof name === 'string' ? name : undefined;
}

function readServiceId(resource: Record<string, unknown>): string | undefined {
	const services = resource.services;
	if (!Array.isArray(services)) {
		return undefined;
	}

	return groupedLightId(
		services.filter((service): service is { rid: string; rtype: string } => {
			if (typeof service !== 'object' || service === null) {
				return false;
			}

			const record = service as { rid?: unknown; rtype?: unknown };

			return typeof record.rid === 'string' && typeof record.rtype === 'string';
		})
	);
}

function controlFields(resource: Record<string, unknown>): ControlFields | undefined {
	const fields: ControlFields = {};
	const isOn = readOn(resource.on);
	const brightness = readBrightness(resource.dimming);
	const color = readColor(resource.color);
	if (isOn !== undefined) {
		fields.isOn = isOn;
	}
	if (brightness !== undefined) {
		fields.brightness = brightness;
	}
	if (color) {
		fields.color = color;
	}

	return Object.keys(fields).length > 0 ? fields : undefined;
}

function readOn(value: unknown): boolean | undefined {
	if (typeof value !== 'object' || value === null) {
		return undefined;
	}

	const isOn = (value as { on?: unknown }).on;

	return typeof isOn === 'boolean' ? isOn : undefined;
}

function readBrightness(value: unknown): number | undefined {
	if (typeof value !== 'object' || value === null) {
		return undefined;
	}

	const brightness = (value as { brightness?: unknown }).brightness;

	return typeof brightness === 'number' ? brightness : undefined;
}

function readColor(value: unknown): XyColor | null | undefined {
	if (typeof value !== 'object' || value === null) {
		return undefined;
	}

	return xyColorFrom((value as { xy?: { x?: unknown; y?: unknown } }).xy);
}
