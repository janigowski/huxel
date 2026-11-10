<script lang="ts">
	import type { SvelteArea } from '@huxel/app/svelte';
	import { xyToHex } from '@huxel/app';
	import { findPaletteColor } from '../palette';
	import ColorSwatch from './ColorSwatch.svelte';
	import Label from './Label.svelte';
	import PowerIcon from './icons/PowerIcon.svelte';

	interface Props {
		area: SvelteArea;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
	}

	let { area, ontoggle, ondim, oneditcolor }: Props = $props();

	const level = $derived(area.isOn ? Math.round(area.brightness ?? 0) : 0);
	const paletteColor = $derived(findPaletteColor(area.color));
	const colorName = $derived(paletteColor?.name ?? 'Custom');
	const swatch = $derived(area.color === null ? null : (paletteColor?.hex ?? xyToHex(area.color)));
	const stateLabel = $derived(area.isOn ? 'On' : 'Off');
</script>

<article class={['row', { on: area.isOn }]}>
	<p class="name" title={area.name}>{area.name}</p>

	<button
		class="power"
		type="button"
		aria-pressed={area.isOn}
		aria-label="{area.name}, {stateLabel}"
		onclick={ontoggle}
	>
		<PowerIcon />
		<Label>{stateLabel}</Label>
	</button>

	{#if area.brightness !== null}
		<label class="dim">
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				value={area.brightness}
				disabled={!area.isOn}
				aria-label="{area.name} brightness"
				oninput={(event) => ondim(Number(event.currentTarget.value))}
			/>
			<Label>{level}%</Label>
		</label>
	{/if}

	{#if swatch}
		<button
			class="color"
			type="button"
			aria-haspopup="dialog"
			aria-label="{area.name} color, {colorName}"
			disabled={!area.isOn}
			onclick={oneditcolor}
		>
			<ColorSwatch hex={swatch} />
			<Label>{colorName}</Label>
		</button>
	{/if}
</article>

<style>
	.row {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		min-height: var(--size-large);
		padding: var(--space-2) var(--space-3);
		overflow: hidden;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-8);
		background: var(--background-neutral-medium);
		color: var(--foreground-neutral-secondary);
	}

	.row.on {
		border-color: color-mix(in srgb, var(--foreground-emphasis-primary) 55%, var(--border-neutral));
		color: var(--foreground-neutral-primary);
	}

	.name {
		flex: 1 1 6rem;
		min-width: 0;
		margin: 0;
		overflow: hidden;
		font-size: var(--font-size-body-1);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-body-1);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.power,
	.color {
		display: inline-flex;
		flex: 0 0 auto;
		align-items: center;
		gap: var(--space-2);
		min-height: var(--size-small);
		padding: 0 var(--space-2);
		border: var(--border-width) solid currentColor;
		border-radius: var(--radius-control);
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.row.on .power {
		border-color: transparent;
		background: var(--background-emphasis-strong);
		color: var(--foreground-emphasis-on-fill);
	}

	.power:disabled,
	.color:disabled,
	.dim input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dim {
		display: flex;
		flex: 1 1 5rem;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.dim input {
		flex: 1;
		width: 100%;
		min-width: 0;
		accent-color: var(--foreground-emphasis-primary);
	}
</style>
