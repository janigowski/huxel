<script lang="ts">
	import {
		DEFAULT_MIREK_RANGE,
		GAMUT_C,
		clampMirek,
		hsvToXy,
		mirekToHex,
		xyToHex,
		xyToHsv,
		type ColorTemperature,
		type GamutTriangle,
		type MirekRange,
		type XyColor
	} from '@huxel/app';
	import { onDestroy } from 'svelte';
	import ColorWheel from './ColorWheel.svelte';
	import TemperatureWheel from './TemperatureWheel.svelte';
	import { EmitGate } from '../emit-gate';

	interface Props {
		open?: boolean;
		name: string;
		color: XyColor | null;
		temperature: ColorTemperature | null;
		brightness: number | null;
		gamut?: GamutTriangle | null;
		mirekRange?: MirekRange | null;
		supportsColor?: boolean;
		supportsTemperature?: boolean;
		oncolor: (color: XyColor) => void;
		ontemperature: (mirek: number) => void;
		onbrightness?: (brightness: number) => void;
	}

	let {
		open = $bindable(false),
		name,
		color,
		temperature,
		brightness,
		gamut = null,
		mirekRange = null,
		supportsColor,
		supportsTemperature,
		oncolor,
		ontemperature,
		onbrightness
	}: Props = $props();

	const id = $props.id();
	const levelGate = new EmitGate();
	const colorGate = new EmitGate();
	const whiteGate = new EmitGate();
	const colorEnabled = $derived(supportsColor ?? color !== null);
	const temperatureEnabled = $derived(supportsTemperature ?? temperature !== null);
	const activeGamut = $derived(colorEnabled ? (gamut ?? GAMUT_C) : null);
	const activeRange = $derived(temperatureEnabled ? (mirekRange ?? DEFAULT_MIREK_RANGE) : null);
	const both = $derived(activeGamut !== null && activeRange !== null);

	interface Draft {
		hue: number;
		saturation: number;
		mirek: number;
		level: number;
		mode: 'color' | 'white';
	}

	let draft = $state<Draft | null>(null);

	const fromLight = $derived.by((): Draft => {
		const range = activeRange ?? DEFAULT_MIREK_RANGE;
		const hsv = color ? xyToHsv(color) : { h: 0, s: 1 };
		const mode: Draft['mode'] =
			temperature?.mirek != null || (temperature !== null && color === null) ? 'white' : 'color';

		return {
			hue: hsv.h,
			saturation: hsv.s,
			mirek: clampMirek(
				temperature?.mirek ?? Math.round((range.minimum + range.maximum) / 2),
				range
			),
			level:
				typeof brightness === 'number' ? Math.min(100, Math.max(0, Math.round(brightness))) : 100,
			mode
		};
	});
	const view = $derived(draft ?? fromLight);
	const preview = $derived(
		view.mode === 'white' && activeRange
			? mirekToHex(clampMirek(view.mirek, activeRange))
			: xyToHex(hsvToXy({ h: view.hue, s: view.saturation }, activeGamut))
	);

	onDestroy(() => {
		levelGate.flush();
		colorGate.flush();
		whiteGate.flush();
	});

	function edit(patch: Partial<Draft>): void {
		draft = { ...(draft ?? fromLight), ...patch };
	}

	function release() {
		levelGate.flush();
		colorGate.flush();
		whiteGate.flush();
		draft = null;
		open = false;
	}

	function syncOpen(dialog: HTMLDialogElement) {
		if (open && !dialog.open) {
			dialog.showModal();
			return;
		}

		if (!open && dialog.open) {
			dialog.close();
		}
	}

	function emitColor(immediate = false) {
		const send = () => {
			const current = draft ?? fromLight;

			if (!activeGamut) {
				return;
			}

			oncolor(hsvToXy({ h: current.hue, s: current.saturation }, activeGamut));
		};

		if (immediate) {
			colorGate.cancel();
			send();
			return;
		}

		colorGate.push(send);
	}

	function emitTemperature(immediate = false) {
		const send = () => {
			const current = draft ?? fromLight;

			if (!activeRange) {
				return;
			}

			ontemperature(clampMirek(current.mirek, activeRange));
		};

		if (immediate) {
			whiteGate.cancel();
			send();
			return;
		}

		whiteGate.push(send);
	}

	function emitBrightness(immediate: boolean) {
		const send = () => onbrightness?.((draft ?? fromLight).level);

		if (immediate) {
			levelGate.cancel();
			send();
			return;
		}

		levelGate.push(send);
	}

	function selectMode(next: Draft['mode']) {
		if (next === view.mode) {
			return;
		}

		edit({ mode: next });

		if (next === 'color') {
			emitColor(true);
			return;
		}

		emitTemperature(true);
	}

	function onWheel(nextHue: number, nextSaturation: number, immediate = false) {
		edit({ hue: nextHue, saturation: nextSaturation });
		emitColor(immediate);
	}

	function onMirek(next: number, immediate = false) {
		edit({ mirek: next });
		emitTemperature(immediate);
	}
</script>

<dialog class="dialog" aria-labelledby="{id}-title" {@attach syncOpen} onclose={release}>
	<header class="header">
		<h2 id="{id}-title">{name} color</h2>
		<button class="close" type="button" aria-label="Close" onclick={release}>
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
				<path
					d="M5 5l14 14M19 5L5 19"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="square"
				/>
			</svg>
		</button>
	</header>

	{#if both}
		<div class="modes" role="radiogroup" aria-label="Color mode">
			<input
				class="circle color"
				type="radio"
				name="{id}-mode"
				value="color"
				aria-label="Color"
				checked={view.mode === 'color'}
				onchange={() => selectMode('color')}
			/>
			<input
				class="circle temperature"
				type="radio"
				name="{id}-mode"
				value="white"
				aria-label="Temperature"
				checked={view.mode === 'white'}
				onchange={() => selectMode('white')}
			/>
		</div>
	{/if}

	{#if view.mode === 'color' && activeGamut}
		<ColorWheel hue={view.hue} saturation={view.saturation} color={preview} onchange={onWheel} />
	{:else if view.mode === 'white' && activeRange}
		<TemperatureWheel mirek={view.mirek} range={activeRange} onchange={onMirek} />
	{/if}

	{#if brightness !== null}
		<label class="dim">
			<span>Brightness</span>
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				value={view.level}
				aria-label="{name} brightness"
				oninput={(event) => {
					edit({ level: Number(event.currentTarget.value) });
					emitBrightness(false);
				}}
				onchange={() => emitBrightness(true)}
			/>
			<span class="percent">{view.level}%</span>
		</label>
	{/if}
</dialog>

<style>
	.dialog {
		width: min(var(--dialog-width), calc(100vw - 2 * var(--space-4)));
		max-height: min(40rem, calc(100dvh - 2 * var(--space-4)));
		margin: auto;
		padding: var(--space-4);
		overflow: auto;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-12);
		background: var(--background-neutral-medium);
		box-shadow: var(--elevation-4);
		color: var(--foreground-neutral-primary);
	}

	.dialog::backdrop {
		background: var(--color-backdrop);
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-block-end: var(--space-4);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-heading-3);
		font-weight: var(--font-weight-heading-3);
		letter-spacing: var(--tracking-heading-3);
		line-height: var(--line-height-heading-3);
	}

	.close {
		display: grid;
		place-items: center;
		width: var(--size-small);
		height: var(--size-small);
		padding: 0;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: transparent;
		color: var(--foreground-neutral-primary);
		cursor: pointer;
	}

	.modes {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		margin-block-end: var(--space-4);
	}

	.circle {
		display: block;
		width: 4.5rem;
		height: 4.5rem;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 50%;
		box-shadow: inset 0 0 0 var(--border-width) rgb(0 0 0 / 0.35);
		appearance: none;
		cursor: pointer;
	}

	.color {
		background:
			radial-gradient(circle, #fff 0%, transparent 68%),
			conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
	}

	.temperature {
		background: linear-gradient(to right, #ffb25a, #fff1d6, #d6e8ff);
	}

	.circle:checked {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-1);
	}

	.circle:focus-visible {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-2);
	}

	.dim {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-block-start: var(--space-4);
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
	}

	.dim input {
		flex: 1;
		min-width: 0;
		accent-color: var(--foreground-emphasis-primary);
	}

	.percent {
		min-width: 3ch;
		color: var(--foreground-neutral-primary);
		font-variant-numeric: tabular-nums;
		text-align: end;
	}
</style>
