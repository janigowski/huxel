import { findAreaPreset, type XyColor } from '@huxel/app';
import { findPaletteColor } from './palette';

export interface ListedControl {
	readonly id: string;
	readonly name: string;
	readonly isOn: boolean;
	readonly brightness: number | null;
	readonly color: XyColor | null;
}

export type ItemKind = 'room' | 'zone' | 'light';

export interface TitleEntry {
	readonly kind: 'title';
	readonly key: string;
	readonly title: string;
	readonly meta: string;
}

export interface MessageEntry {
	readonly kind: 'message';
	readonly key: string;
	readonly text: string;
}

export interface ItemEntry {
	readonly kind: ItemKind;
	readonly key: string;
	readonly id: string;
	readonly name: string;
	readonly index: number;
	readonly nameWidth: number;
	readonly isOn: boolean;
	readonly brightness: number | null;
	readonly detail?: string;
}

export type Entry = TitleEntry | MessageEntry | ItemEntry;

interface Section {
	readonly kind: ItemKind;
	readonly title: string;
	readonly loadingLabel: string;
	readonly emptyLabel: string;
	readonly items: readonly ListedControl[];
	readonly showDetail: boolean;
}

export function areaDetail(area: Pick<ListedControl, 'color' | 'brightness'>): string {
	const preset = findAreaPreset(area.color, area.brightness)?.name ?? 'Custom';
	const color = findPaletteColor(area.color)?.name;

	if (!color || color === preset) {
		return preset;
	}

	return `${preset} · ${color}`;
}

export function buildEntries(input: {
	loading: boolean;
	rooms: readonly ListedControl[];
	zones: readonly ListedControl[];
	lights: readonly ListedControl[];
}): Entry[] {
	return [
		...sectionEntries(
			{
				kind: 'room',
				title: 'Rooms',
				loadingLabel: 'Loading rooms…',
				emptyLabel: 'No rooms',
				items: input.rooms,
				showDetail: true
			},
			input.loading
		),
		...sectionEntries(
			{
				kind: 'zone',
				title: 'Zones',
				loadingLabel: 'Loading zones…',
				emptyLabel: 'No zones',
				items: input.zones,
				showDetail: true
			},
			input.loading
		),
		...sectionEntries(
			{
				kind: 'light',
				title: 'All lights',
				loadingLabel: 'Loading lights…',
				emptyLabel: 'No lights',
				items: input.lights,
				showDetail: false
			},
			input.loading
		)
	];
}

export function isItem(entry: Entry): entry is ItemEntry {
	return entry.kind === 'room' || entry.kind === 'zone' || entry.kind === 'light';
}

export function selectedEntryIndex(
	entries: readonly Entry[],
	selectedKey: string | undefined
): number {
	const current = entries.findIndex((entry) => isItem(entry) && entry.key === selectedKey);

	if (current !== -1) {
		return current;
	}

	const first = entries.findIndex(isItem);

	return Math.max(0, first);
}

export function moveSelection(
	entries: readonly Entry[],
	selectedKey: string | undefined,
	offset: number
): string | undefined {
	const indexes = entries.flatMap((entry, index) => (isItem(entry) ? [index] : []));
	const position = indexes.indexOf(selectedEntryIndex(entries, selectedKey));

	if (indexes.length === 0 || position === -1) {
		return undefined;
	}

	const nextIndex = indexes[Math.min(indexes.length - 1, Math.max(0, position + offset))];
	const next = nextIndex === undefined ? undefined : entries[nextIndex];

	return next && isItem(next) ? next.key : undefined;
}

export function visibleWindow(count: number, selected: number, size: number): [number, number] {
	if (count <= size) {
		return [0, count];
	}

	const start = Math.min(Math.max(0, selected - Math.floor(size / 2)), count - size);

	return [start, start + size];
}

function sectionEntries(section: Section, loading: boolean): Entry[] {
	const onCount = section.items.filter((item) => item.isOn).length;
	const entries: Entry[] = [
		{
			kind: 'title',
			key: `title:${section.title}`,
			title: section.title,
			meta: section.items.length > 0 ? `${onCount}/${section.items.length} on` : ''
		}
	];

	if (loading && section.items.length === 0) {
		entries.push({ kind: 'message', key: `loading:${section.title}`, text: section.loadingLabel });
		return entries;
	}

	if (section.items.length === 0) {
		entries.push({ kind: 'message', key: `empty:${section.title}`, text: section.emptyLabel });
		return entries;
	}

	const nameWidth = Math.max(0, ...section.items.map((item) => item.name.length));

	for (const [index, item] of section.items.entries()) {
		entries.push({
			kind: section.kind,
			key: `${section.kind}:${item.id}`,
			id: item.id,
			name: item.name,
			index,
			nameWidth,
			isOn: item.isOn,
			brightness: item.brightness,
			detail: section.showDetail ? areaDetail(item) : undefined
		});
	}

	return entries;
}
