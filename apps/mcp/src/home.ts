import { hexToXy, xyToHex } from '@huxel/app';
import type {
	GroupedLightGet,
	LightGet,
	ResourceIdentifier,
	RoomGet,
	SceneGet,
	XYColor,
	ZoneGet
} from '@huxel/client';
import { SessionError } from './errors';

export interface TargetChange {
	name?: string;
	id?: string;
	on?: boolean;
	brightness?: number;
	color?: string;
}

export interface HomeLight {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
	color: string | null;
}

export interface HomeArea {
	id: string;
	name: string;
	on: boolean;
	brightness: number | null;
	color: string | null;
}

export interface HomeScene {
	id: string;
	name: string;
	group: string;
}

export interface HomeSnapshot {
	rooms: HomeArea[];
	zones: HomeArea[];
	lights: HomeLight[];
	scenes: HomeScene[];
}

export interface TargetState extends HomeLight {
	kind: 'light' | 'room' | 'zone';
}

export interface SceneActivation {
	id: string;
	name: string;
	group: string;
}

export interface LightCommand {
	on?: { on: boolean };
	dimming?: { brightness: number };
	color?: { xy: XYColor };
}

type AreaResource = RoomGet | ZoneGet;

export interface HomeLists {
	lights: LightGet[];
	rooms: RoomGet[];
	zones: ZoneGet[];
	groupedLights: GroupedLightGet[];
	scenes: SceneGet[];
}

export function lightCommand(change: TargetChange): LightCommand {
	const color = change.color?.trim();
	const hasBrightness = change.brightness !== undefined;
	const hasColor = Boolean(color);

	if (change.on === undefined && !hasBrightness && !hasColor) {
		throw new SessionError('Pass on, brightness, or color.', 'invalid');
	}

	if (hasBrightness && !isBrightness(change.brightness)) {
		throw new SessionError('Brightness must be between 0 and 100.', 'invalid');
	}

	if (change.on === false) {
		return { on: { on: false } };
	}

	const command: LightCommand = { on: { on: true } };

	if (hasBrightness && change.brightness !== undefined) {
		command.dimming = { brightness: change.brightness };
	}

	if (color) {
		command.color = { xy: parseColor(color) };
	}

	return command;
}

export function mapHome(lists: HomeLists): HomeSnapshot {
	const grouped = new Map(lists.groupedLights.map((light) => [light.id, light]));
	const groups = groupNames(lists.rooms, lists.zones);

	return {
		rooms: lists.rooms.map((room) => mapArea(room, grouped)).sort(byName),
		zones: lists.zones.map((zone) => mapArea(zone, grouped)).sort(byName),
		lights: lists.lights.map(mapLight).sort(byName),
		scenes: lists.scenes
			.map((scene) => ({
				id: scene.id,
				name: scene.metadata.name,
				group: groups.get(scene.group.rid) ?? scene.group.rid
			}))
			.sort(byName)
	};
}

export function selectLight(lights: LightGet[], change: TargetChange): LightGet {
	return selectNamed(
		lights.map((light) => ({ item: light, id: light.id, name: light.metadata.name })),
		change,
		'light',
		'lights',
		(light) => light.id
	);
}

export function selectArea(rooms: RoomGet[], zones: ZoneGet[], change: TargetChange): AreaResource {
	const areas = [...rooms, ...zones].map((area) => ({
		item: area,
		id: area.id,
		name: area.metadata.name
	}));

	return selectNamed(
		areas,
		change,
		'room or zone',
		'rooms or zones',
		(area) => `${area.type} ${area.id}`
	);
}

export function selectScene(
	scenes: SceneGet[],
	change: TargetChange,
	groups: ReadonlyMap<string, string>
): SceneGet {
	return selectNamed(
		scenes.map((scene) => ({ item: scene, id: scene.id, name: scene.metadata.name })),
		change,
		'scene',
		'scenes',
		(scene) => `${scene.id} (${groups.get(scene.group.rid) ?? scene.group.rid})`
	);
}

export function groupedServiceId(services: ResourceIdentifier[]): string | undefined {
	return services.find((service) => service.rtype === 'grouped_light')?.rid;
}

export function groupNames(rooms: RoomGet[], zones: ZoneGet[]): Map<string, string> {
	return new Map([...rooms, ...zones].map((area) => [area.id, area.metadata.name] as const));
}

export function mapLight(light: LightGet): HomeLight {
	return {
		id: light.id,
		name: light.metadata.name,
		on: light.on.on,
		brightness: light.dimming?.brightness ?? null,
		color: light.color ? xyToHex(light.color.xy) : null
	};
}

export function targetFromLight(light: LightGet): TargetState {
	return { kind: 'light', ...mapLight(light) };
}

export function targetFromArea(
	area: AreaResource,
	grouped: GroupedLightGet | undefined
): TargetState {
	const view = mapArea(area, grouped ? new Map([[grouped.id, grouped]]) : new Map());

	return { kind: area.type, ...view };
}

function mapArea(
	area: AreaResource,
	groupedLights: ReadonlyMap<string, GroupedLightGet>
): HomeArea {
	const serviceId = groupedServiceId(area.services);
	const grouped = serviceId === undefined ? undefined : groupedLights.get(serviceId);

	return {
		id: area.id,
		name: area.metadata.name,
		on: grouped?.on?.on ?? false,
		brightness: grouped?.dimming?.brightness ?? null,
		color: grouped?.color?.xy ? xyToHex(grouped.color.xy) : null
	};
}

function selectNamed<T>(
	items: { item: T; id: string; name: string }[],
	change: TargetChange,
	noun: string,
	plural: string,
	describe: (item: T) => string
): T {
	const id = change.id?.trim();
	const name = change.name?.trim();

	if (!id && !name) {
		throw new SessionError(`Pass a ${noun} name or id.`, 'invalid');
	}

	if (id) {
		const found = items.find((item) => item.id.toLowerCase() === id.toLowerCase());

		if (!found) {
			throw new SessionError(`No ${noun} with id ${id}.`, 'not-found');
		}

		if (name && normalizeName(found.name) !== normalizeName(name)) {
			throw new SessionError(
				`${found.name} has id ${found.id}, not the name "${name}".`,
				'invalid'
			);
		}

		return found.item;
	}

	const matches = items.filter((item) => normalizeName(item.name) === normalizeName(name ?? ''));
	const [only] = matches;

	if (matches.length === 1 && only) {
		return only.item;
	}

	if (matches.length === 0) {
		throw new SessionError(`No ${noun} named "${name}".`, 'not-found');
	}

	throw new SessionError(
		`Several ${plural} are named "${name}": ${matches.map((item) => describe(item.item)).join(', ')}. Pass id.`,
		'ambiguous'
	);
}

function byName<T extends { name: string }>(left: T, right: T): number {
	return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' });
}

function normalizeName(value: string): string {
	return value.trim().toLowerCase();
}

function isBrightness(value: number | undefined): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function parseColor(color: string): XYColor {
	try {
		return hexToXy(color);
	} catch (error) {
		throw new SessionError(error instanceof Error ? error.message : 'Invalid color.', 'invalid');
	}
}
