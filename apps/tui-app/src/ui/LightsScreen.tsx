import { TextAttributes, type BoxRenderable, type KeyEvent } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { areaPresets, describeError, findAreaPreset, type HueApp, type PresetId } from '@huxel/app';
import { useHueApp, type ReactArea } from '@huxel/app/react';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Footer } from './Footer';
import { Notice } from './Notice';
import { findPaletteColor, palette } from './palette';
import {
	buildEntries,
	isItem,
	moveSelection,
	selectedEntryIndex,
	visibleWindow,
	type Entry,
	type ItemEntry,
	type ItemKind
} from './sections';
import { StatusRow } from './StatusRow';
import { colors } from './theme';

const DIM_STEP = 10;

interface LightsScreenProps {
	app: HueApp;
	onError?: (error: unknown) => void;
	onQuit?: () => void;
}

interface ChooserTarget {
	readonly kind: 'room' | 'zone';
	readonly id: string;
}

interface BrowseMode {
	readonly kind: 'browse';
}

interface ChooserMode {
	readonly kind: 'preset' | 'color';
	readonly target: ChooserTarget;
	readonly cursor: number;
}

type Mode = BrowseMode | ChooserMode;

const BROWSE: BrowseMode = { kind: 'browse' };

export function LightsScreen({ app, onError, onQuit }: LightsScreenProps) {
	const hue = useHueApp(app);
	const [commandError, setCommandError] = useState<string | null>(null);
	const [selectedKey, setSelectedKey] = useState<string | undefined>();
	const [visibleRows, setVisibleRows] = useState(Number.POSITIVE_INFINITY);
	const [mode, setMode] = useState<Mode>(BROWSE);
	const selectedKeyRef = useRef<string | undefined>(undefined);
	const modeRef = useRef<Mode>(BROWSE);

	const loading = hue.status === 'idle' || hue.status === 'loading';
	const entries = useMemo(
		() => buildEntries({ loading, rooms: hue.rooms, zones: hue.zones }),
		[loading, hue.rooms, hue.zones]
	);
	const error = commandError ?? (hue.status === 'error' ? describeError(hue.error) : null);
	const editing =
		mode.kind !== 'browse' && chooserAvailable(mode, hue.rooms, hue.zones) ? mode : BROWSE;

	if (editing !== mode) {
		modeRef.current = BROWSE;
		setMode(BROWSE);
	}

	const selectedIndex = selectedEntryIndex(entries, selectedKey);
	const listRows = Math.max(1, visibleRows - (error ? 1 : 0));
	const [start, end] = visibleWindow(entries.length, selectedIndex, listRows);
	const chooserArea = listedArea(editing, hue.rooms, hue.zones);
	const initializeFailed = useEffectEvent((caught: unknown) => onError?.(caught));

	useEffect(() => {
		hue.initialize().catch(initializeFailed);
	}, [hue.initialize]);

	function run(command: Promise<void>) {
		setCommandError(null);
		command.catch((caught: unknown) => setCommandError(describeError(caught)));
	}

	function selectedItem(): ItemEntry | undefined {
		const entry = entries[selectedEntryIndex(entries, selectedKeyRef.current)];

		return entry && isItem(entry) ? entry : undefined;
	}

	function move(offset: number) {
		const next = moveSelection(entries, selectedKeyRef.current, offset);

		if (!next) {
			return;
		}

		selectedKeyRef.current = next;
		setSelectedKey(next);
	}

	function toggle() {
		const item = selectedItem();

		if (!item) {
			return;
		}

		run(item.kind === 'room' ? hue.toggleRoom(item.id) : hue.toggleZone(item.id));
	}

	function dim(offset: number) {
		const item = selectedItem();

		if (!item) {
			return;
		}

		const current = liveLevel(app, item.kind, item.id);

		if (!current) {
			return;
		}

		const brightness = Math.min(100, Math.max(0, Math.round(current.brightness) + offset));
		const command =
			item.kind === 'room' ? hue.dimRoom(item.id, brightness) : hue.dimZone(item.id, brightness);
		run(command);
	}

	function openChooser(kind: 'preset' | 'color') {
		const item = selectedItem();

		if (!item) {
			return;
		}

		const area = liveArea(app, item.kind, item.id);

		if (!area?.isOn.peek()) {
			return;
		}

		if (kind === 'color' && area.color.peek() === null) {
			return;
		}

		const cursor = kind === 'preset' ? presetCursor(area) : colorCursor(area);
		const next: ChooserMode = { kind, target: { kind: item.kind, id: item.id }, cursor };
		modeRef.current = next;
		setMode(next);
	}

	function moveCursor(offset: number) {
		const current = modeRef.current;

		if (current.kind === 'browse') {
			return;
		}

		const count = current.kind === 'preset' ? areaPresets.length : palette.length;
		const cursor = Math.min(count - 1, Math.max(0, current.cursor + offset));
		const next: ChooserMode = { ...current, cursor };
		modeRef.current = next;
		setMode(next);
	}

	function applyChooser() {
		const current = modeRef.current;

		if (current.kind === 'browse') {
			return;
		}

		const area = liveArea(app, current.target.kind, current.target.id);

		if (!area?.isOn.peek()) {
			return;
		}

		if (current.kind === 'preset') {
			const preset = areaPresets[current.cursor];

			if (!preset) {
				return;
			}

			run(applyPreset(hue, current.target.kind, area.id, preset.id));
			return;
		}

		if (area.color.peek() === null) {
			return;
		}

		const color = palette[current.cursor];

		if (!color) {
			return;
		}

		const command =
			current.target.kind === 'room'
				? hue.changeRoomColor(area.id, color.xy)
				: hue.changeZoneColor(area.id, color.xy);
		run(command);
	}

	function closeChooser() {
		modeRef.current = BROWSE;
		setMode(BROWSE);
	}

	function rememberRows(this: BoxRenderable) {
		setVisibleRows(Math.max(1, this.height));
	}

	useKeyboard((key: KeyEvent) => {
		if (key.ctrl || key.meta) {
			return;
		}

		if (modeRef.current.kind !== 'browse') {
			switch (key.name) {
				case 'up':
				case 'k':
					return moveCursor(-1);
				case 'down':
				case 'j':
					return moveCursor(1);
				case 'space':
				case 'return':
				case 'linefeed':
					return applyChooser();
				case 'escape':
				case 'backspace':
					return closeChooser();
			}

			return;
		}

		switch (key.name) {
			case 'up':
			case 'k':
				return move(-1);
			case 'down':
			case 'j':
				return move(1);
			case 'space':
			case 'return':
			case 'linefeed':
				return toggle();
			case 'left':
			case 'h':
				return dim(-DIM_STEP);
			case 'right':
			case 'l':
				return dim(DIM_STEP);
			case 'p':
				return openChooser('preset');
			case 'c':
				return openChooser('color');
			case 'escape':
				onQuit?.();
		}
	});

	const chooser =
		editing.kind !== 'browse' && chooserArea ? { mode: editing, area: chooserArea } : undefined;
	const choices = chooserChoices(editing);
	const currentId = chooser ? currentChoice(chooser.mode, chooser.area) : undefined;
	const [choiceStart, choiceEnd] = visibleWindow(
		choices.length,
		chooser?.mode.cursor ?? 0,
		Math.max(1, listRows - 1)
	);
	const footer = chooser
		? '↑↓/jk select · space/enter apply · esc back · q quit'
		: '↑↓/jk select · space/enter toggle · ←→/hl dim · p preset · c color · q quit';

	return (
		<box flexDirection="column" flexGrow={1}>
			<box
				flexDirection="column"
				flexGrow={1}
				flexShrink={1}
				minHeight={1}
				overflow="hidden"
				onSizeChange={rememberRows}
			>
				{error ? <Notice>{error}</Notice> : null}
				{chooser ? (
					<>
						<text flexShrink={0} wrapMode="none">
							<span fg={colors.text} attributes={TextAttributes.BOLD}>
								{chooser.mode.kind === 'preset' ? 'Presets' : 'Color'}
							</span>
							<span fg={colors.muted}>
								{'  '}
								{chooser.area.name}
							</span>
						</text>
						{choices.slice(choiceStart, choiceEnd).map((choice, offset) => {
							const index = choiceStart + offset;
							const selected = index === chooser.mode.cursor;

							return (
								<text
									key={choice.id}
									flexShrink={0}
									wrapMode="none"
									attributes={selected ? TextAttributes.BOLD : TextAttributes.NONE}
								>
									<span fg={colors.accent}>{selected ? '›' : ' '}</span>
									<span fg={selected ? colors.accent : colors.text}> {choice.label}</span>
									{choice.id === currentId ? <span fg={colors.muted}> current</span> : null}
								</text>
							);
						})}
					</>
				) : (
					entries
						.slice(start, end)
						.map((entry, offset) => renderEntry(entry, start + offset === selectedIndex))
				)}
			</box>
			<Footer keys={footer} />
		</box>
	);
}

function renderEntry(entry: Entry, selected: boolean) {
	if (entry.kind === 'title') {
		return (
			<text key={entry.key} flexShrink={0} wrapMode="none">
				<span fg={colors.text} attributes={TextAttributes.BOLD}>
					{entry.title}
				</span>
				{entry.meta === '' ? null : (
					<span fg={colors.muted}>
						{'  '}
						{entry.meta}
					</span>
				)}
			</text>
		);
	}

	if (entry.kind === 'message') {
		return (
			<Notice key={entry.key} tone="muted">
				{entry.text}
			</Notice>
		);
	}

	return (
		<StatusRow
			key={entry.key}
			name={entry.name}
			index={entry.index}
			selected={selected && isItem(entry)}
			nameWidth={entry.nameWidth}
			isOn={entry.isOn}
			brightness={entry.brightness}
			detail={entry.detail}
		/>
	);
}

function chooserAvailable(
	mode: ChooserMode,
	rooms: readonly ReactArea[],
	zones: readonly ReactArea[]
): boolean {
	const area = findArea(mode.target, rooms, zones);

	if (!area?.isOn) {
		return false;
	}

	return mode.kind === 'preset' || area.color !== null;
}

function listedArea(
	mode: Mode,
	rooms: readonly ReactArea[],
	zones: readonly ReactArea[]
): ReactArea | undefined {
	if (mode.kind === 'browse') {
		return undefined;
	}

	return findArea(mode.target, rooms, zones);
}

function findArea(
	target: ChooserTarget,
	rooms: readonly ReactArea[],
	zones: readonly ReactArea[]
): ReactArea | undefined {
	const areas = target.kind === 'room' ? rooms : zones;

	return areas.find((area) => area.id === target.id);
}

interface Choice {
	readonly id: string;
	readonly label: string;
}

function chooserChoices(mode: Mode): Choice[] {
	if (mode.kind === 'preset') {
		return areaPresets.map((preset) => ({ id: preset.id, label: preset.name }));
	}

	if (mode.kind === 'color') {
		return palette.map((color) => ({ id: color.name, label: color.name }));
	}

	return [];
}

function currentChoice(mode: Mode, area: ReactArea): string | undefined {
	if (mode.kind === 'preset') {
		return findAreaPreset(area.color, area.brightness)?.id;
	}

	if (mode.kind === 'color') {
		return findPaletteColor(area.color)?.name;
	}

	return undefined;
}

function liveArea(app: HueApp, kind: 'room' | 'zone', id: string) {
	return (kind === 'room' ? app.state.rooms : app.state.zones).get(id);
}

function liveLevel(app: HueApp, kind: ItemKind, id: string): { brightness: number } | undefined {
	const area = liveArea(app, kind, id);
	const brightness = area?.brightness.peek();

	if (!area?.isOn.peek() || brightness == null) {
		return undefined;
	}

	return { brightness };
}

function presetCursor(area: NonNullable<ReturnType<typeof liveArea>>): number {
	const current = findAreaPreset(area.color.peek(), area.brightness.peek());

	return Math.max(
		0,
		areaPresets.findIndex((preset) => preset.id === current?.id)
	);
}

function colorCursor(area: NonNullable<ReturnType<typeof liveArea>>): number {
	const current = findPaletteColor(area.color.peek());

	return Math.max(
		0,
		palette.findIndex((color) => color.name === current?.name)
	);
}

function applyPreset(
	hue: ReturnType<typeof useHueApp>,
	kind: 'room' | 'zone',
	id: string,
	preset: PresetId
): Promise<void> {
	return kind === 'room' ? hue.applyRoomPreset(id, preset) : hue.applyZonePreset(id, preset);
}
