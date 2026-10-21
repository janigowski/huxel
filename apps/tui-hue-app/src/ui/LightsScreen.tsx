import { TextAttributes, type BoxRenderable, type KeyEvent } from '@opentui/core';
import { useKeyboard } from '@opentui/react';
import { describeError, type HueApp } from 'hue-app';
import { useHueApp, type ReactLight } from 'hue-app/react';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Footer } from './Footer';
import { LightRow } from './LightRow';
import { Notice } from './Notice';
import { colors } from './theme';

const DIM_STEP = 10;

interface LightsScreenProps {
	app: HueApp;
	onError?: (error: unknown) => void;
}

export function LightsScreen({ app, onError }: LightsScreenProps) {
	const hue = useHueApp(app);
	const [commandError, setCommandError] = useState<string | null>(null);
	const [selectedId, setSelectedId] = useState<string | undefined>();
	const [visibleRows, setVisibleRows] = useState(Number.POSITIVE_INFINITY);
	const selectedIdRef = useRef<string | undefined>(undefined);

	const lights = useMemo(
		() => [...hue.lights].sort((a, b) => a.name.localeCompare(b.name)),
		[hue.lights]
	);
	const onCount = lights.filter((light) => light.isOn).length;
	const nameWidth = Math.max(0, ...lights.map((light) => light.name.length));
	const loading = hue.status === 'idle' || hue.status === 'loading';
	const error = commandError ?? (hue.status === 'error' ? describeError(hue.error) : null);
	const selectedIndex = indexOf(lights, selectedId);
	const [start, end] = visibleWindow(lights.length, selectedIndex, visibleRows);

	const initializeFailed = useEffectEvent((error: unknown) => onError?.(error));

	useEffect(() => {
		hue.initialize().catch(initializeFailed);
	}, [hue.initialize]);

	function run(command: Promise<void>) {
		setCommandError(null);
		command.catch((error: unknown) => setCommandError(describeError(error)));
	}

	function selected(): ReactLight | undefined {
		return lights[indexOf(lights, selectedIdRef.current)];
	}

	function move(offset: number) {
		const index = indexOf(lights, selectedIdRef.current) + offset;
		const next = lights[Math.min(lights.length - 1, Math.max(0, index))];
		if (next) {
			selectedIdRef.current = next.id;
			setSelectedId(next.id);
		}
	}

	function toggle() {
		const light = selected();
		if (light) {
			run(hue.toggleLight(light.id));
		}
	}

	function dim(offset: number) {
		const selectedLight = selected();
		const light = selectedLight && app.state.lights.get(selectedLight.id);
		const current = light?.brightness.peek();
		if (!light || !light.isOn.peek() || current == null) {
			return;
		}
		const brightness = Math.min(100, Math.max(0, Math.round(current) + offset));
		run(hue.dimLight(light.id, brightness));
	}

	useKeyboard((key: KeyEvent) => {
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
		}
	});

	return (
		<box flexDirection="column" flexGrow={1}>
			<text flexShrink={0}>
				<span fg={colors.text} attributes={TextAttributes.BOLD}>
					All lights
				</span>
				<span fg={colors.muted}>
					{'  '}
					{onCount}/{lights.length} on
				</span>
			</text>
			{error ? <Notice>{error}</Notice> : null}
			{loading && lights.length === 0 ? (
				<Notice tone="muted">Loading lights…</Notice>
			) : (
				<box
					flexDirection="column"
					marginTop={1}
					flexGrow={1}
					flexShrink={1}
					minHeight={1}
					overflow="hidden"
					onSizeChange={function (this: BoxRenderable) {
						setVisibleRows(Math.max(1, this.height));
					}}
				>
					{lights.slice(start, end).map((light, offset) => (
						<LightRow
							key={light.id}
							light={light}
							index={start + offset}
							selected={start + offset === selectedIndex}
							nameWidth={nameWidth}
						/>
					))}
				</box>
			)}
			<Footer keys="↑↓/jk select · space/enter toggle · ←→/hl dim · q quit" />
		</box>
	);
}

function indexOf(lights: readonly ReactLight[], lightId: string | undefined): number {
	return Math.max(
		0,
		lights.findIndex((light) => light.id === lightId)
	);
}

function visibleWindow(count: number, selected: number, size: number): [number, number] {
	if (count <= size) {
		return [0, count];
	}
	const start = Math.min(Math.max(0, selected - Math.floor(size / 2)), count - size);
	return [start, start + size];
}
