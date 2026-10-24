import type { GroupedLightGet, HueClient, HueEventType } from 'hue-sdk';
import { AreaCatalog, type AreaControl, type AreaGroup } from './area-catalog';
import type { ChildLights, ResourceRef } from './child-lights';
import { xyColorFrom, type XyColor } from './color';
import type { AreaChange, AreaKind } from './gateway';

interface PendingAdd {
	token: object;
	name?: string;
}

interface EventResource {
	id: string;
	type: string;
	[key: string]: unknown;
}

type AreaClient = Pick<HueClient, 'rooms' | 'zones' | 'groupedLights'>;

export class AreaEventSession {
	private active = true;
	private readonly pendingAdds = new Map<string, PendingAdd>();
	private readonly serviceBuffer = new Map<string, AreaControl>();
	private readonly catalog = new AreaCatalog();
	private readonly client: AreaClient;
	private readonly emit: (changes: AreaChange[]) => void;
	private readonly childLights: ChildLights;

	constructor(client: AreaClient, emit: (changes: AreaChange[]) => void, childLights: ChildLights) {
		this.client = client;
		this.emit = emit;
		this.childLights = childLights;
	}

	handle(type: HueEventType, resource: EventResource): AreaChange[] {
		if (!this.active || type === 'error') {
			return [];
		}

		if (resource.type === 'room' || resource.type === 'zone') {
			return this.handleGroup(type, resource.type, resource);
		}

		if (resource.type !== 'grouped_light') {
			return [];
		}

		return this.handleGroupedLight(type, resource);
	}

	stop(): void {
		this.active = false;
		this.pendingAdds.clear();
		this.serviceBuffer.clear();
	}

	private handleGroup(type: HueEventType, kind: AreaKind, resource: EventResource): AreaChange[] {
		const key = pendingKey(kind, resource.id);

		if (type === 'delete') {
			this.dropPending(key);

			return [{ kind: 'removed', resource: kind, id: resource.id }];
		}

		if (type === 'add') {
			const token = {};
			this.pendingAdds.set(key, { token });
			void this.resolveAdd(kind, resource.id, resource, token);

			return [];
		}

		const event = new GroupEvent(resource, this.catalog, this.childLights);
		const name = event.name;
		const children = event.childIds;

		if (name === undefined && children === undefined) {
			return [];
		}

		const pending = this.pendingAdds.get(key);
		if (pending && name !== undefined) {
			pending.name = name;
		}

		return [
			{
				kind: 'updated',
				resource: kind,
				id: resource.id,
				...(name !== undefined ? { name } : {}),
				...(children !== undefined ? { children } : {})
			}
		];
	}

	private handleGroupedLight(type: HueEventType, resource: EventResource): AreaChange[] {
		if (type === 'delete') {
			return [{ kind: 'service-removed', serviceId: resource.id }];
		}

		if (type !== 'update' && type !== 'add') {
			return [];
		}

		const fields = new GroupedLightEvent(resource).fields();
		if (!fields) {
			return [];
		}

		if (this.pendingAdds.size > 0) {
			this.serviceBuffer.set(resource.id, { ...this.serviceBuffer.get(resource.id), ...fields });
		}

		return [{ kind: 'service-updated', serviceId: resource.id, ...fields }];
	}

	private dropPending(key: string): void {
		this.pendingAdds.delete(key);
		if (this.pendingAdds.size === 0) {
			this.serviceBuffer.clear();
		}
	}

	private finishPending(key: string, token: object): void {
		const pending = this.pendingAdds.get(key);
		if (!this.active || pending?.token !== token) {
			return;
		}

		this.dropPending(key);
	}

	private async resolveAdd(
		kind: AreaKind,
		id: string,
		resource: EventResource,
		token: object
	): Promise<void> {
		const key = pendingKey(kind, id);
		const event = new GroupEvent(resource, this.catalog, this.childLights);
		let name = event.name;
		let serviceId = event.serviceId;

		if (!name || !serviceId) {
			const group = await this.readGroup(kind, id);
			if (!group) {
				this.finishPending(key, token);

				return;
			}

			name = name ?? group.metadata.name;
			serviceId = serviceId ?? this.catalog.groupedLightId(group.services);
		}

		if (!name || !serviceId) {
			this.finishPending(key, token);

			return;
		}

		const light = await this.readGroupedLight(serviceId);
		if (!light) {
			this.finishPending(key, token);

			return;
		}

		const pending = this.pendingAdds.get(key);
		if (!this.active || pending?.token !== token) {
			return;
		}

		const overlay = this.serviceBuffer.get(serviceId);
		const resolvedName = pending.name ?? name;
		this.dropPending(key);
		this.emit([
			{
				kind: 'added',
				resource: kind,
				area: this.catalog.fromGroupedLight(
					id,
					resolvedName,
					serviceId,
					light,
					event.childIds ?? [],
					overlay
				)
			}
		]);
	}

	private async readGroup(kind: AreaKind, id: string): Promise<AreaGroup | undefined> {
		try {
			const response =
				kind === 'room' ? await this.client.rooms.get(id) : await this.client.zones.get(id);

			return response.data[0];
		} catch {
			return undefined;
		}
	}

	private async readGroupedLight(id: string): Promise<GroupedLightGet | undefined> {
		try {
			const response = await this.client.groupedLights.get(id);

			return response.data[0];
		} catch {
			return undefined;
		}
	}
}

function pendingKey(kind: AreaKind, id: string): string {
	return `${kind}:${id}`;
}

class GroupEvent {
	private readonly resource: EventResource;
	private readonly catalog: AreaCatalog;
	private readonly childLights: ChildLights;

	constructor(resource: EventResource, catalog: AreaCatalog, childLights: ChildLights) {
		this.resource = resource;
		this.catalog = catalog;
		this.childLights = childLights;
	}

	get name(): string | undefined {
		const metadata = this.resource.metadata;
		if (typeof metadata !== 'object' || metadata === null) {
			return undefined;
		}

		const name = (metadata as { name?: unknown }).name;

		return typeof name === 'string' ? name : undefined;
	}

	get childIds(): readonly string[] | undefined {
		const children = this.children;

		if (!children) {
			return undefined;
		}

		return this.childLights.ids(children);
	}

	get serviceId(): string | undefined {
		const services = this.resource.services;
		if (!Array.isArray(services)) {
			return undefined;
		}

		return this.catalog.groupedLightId(refs(services));
	}

	private get children(): readonly ResourceRef[] | undefined {
		const children = this.resource.children;

		if (!Array.isArray(children)) {
			return undefined;
		}

		return refs(children);
	}
}

function refs(value: readonly unknown[]): ResourceRef[] {
	const children: ResourceRef[] = [];

	for (const child of value) {
		if (typeof child !== 'object' || child === null) {
			continue;
		}

		const record = child as { rid?: unknown; rtype?: unknown };

		if (typeof record.rid === 'string' && typeof record.rtype === 'string') {
			children.push({ rid: record.rid, rtype: record.rtype });
		}
	}

	return children;
}

class GroupedLightEvent {
	private readonly resource: EventResource;

	constructor(resource: EventResource) {
		this.resource = resource;
	}

	fields(): AreaControl | undefined {
		const fields: AreaControl = {};
		const isOn = this.readOn(this.resource.on);
		const brightness = this.readBrightness(this.resource.dimming);
		const color = this.readColor(this.resource.color);
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

	private readOn(value: unknown): boolean | undefined {
		if (typeof value !== 'object' || value === null) {
			return undefined;
		}

		const isOn = (value as { on?: unknown }).on;

		return typeof isOn === 'boolean' ? isOn : undefined;
	}

	private readBrightness(value: unknown): number | undefined {
		if (typeof value !== 'object' || value === null) {
			return undefined;
		}

		const brightness = (value as { brightness?: unknown }).brightness;

		return typeof brightness === 'number' ? brightness : undefined;
	}

	private readColor(value: unknown): XyColor | null | undefined {
		if (typeof value !== 'object' || value === null) {
			return undefined;
		}

		return xyColorFrom((value as { xy?: { x?: unknown; y?: unknown } }).xy);
	}
}
