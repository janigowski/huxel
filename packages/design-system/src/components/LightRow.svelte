<script lang="ts">
	import { isMirek, kelvinFromMirek } from '@huxel/app';
	import type { SvelteLight } from '@huxel/app/svelte';
	import { findPaletteColor } from '../palette';
	import ColorSwatch from './ColorSwatch.svelte';
	import Label from './Label.svelte';
	import PowerIcon from './icons/PowerIcon.svelte';

	interface Props {
		light: SvelteLight;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
	}

	let { light, ontoggle, ondim, oneditcolor }: Props = $props();

	const level = $derived(light.isOn ? Math.round(light.brightness ?? 0) : 0);
	const editable = $derived(light.color !== null || light.temperature !== null);
	const kelvin = $derived(
		light.temperature?.mirek != null && isMirek(light.temperature.mirek)
			? kelvinFromMirek(light.temperature.mirek)
			: null
	);
	const colorLabel = $derived(
		light.color
			? (findPaletteColor(light.color)?.name ?? 'Color')
			: kelvin !== null
				? `${kelvin}K`
				: 'White'
	);
	const swatch = $derived(light.colors[0] ?? '#fff4e0');
	const stateLabel = $derived(light.isOn ? 'On' : 'Off');
</script>

<article class={['row', { on: light.isOn }]}>
	<p class="name" title={light.name}>{light.name}</p>

	<button
		class="power"
		type="button"
		aria-pressed={light.isOn}
		aria-label="{light.name}, {stateLabel}"
		onclick={ontoggle}
	>
		<PowerIcon />
		<Label>{stateLabel}</Label>
	</button>

	{#if light.brightness !== null}
		<label class="dim">
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				value={light.brightness}
				disabled={!light.isOn}
				aria-label="{light.name} brightness"
				oninput={(event) => ondim(Number(event.currentTarget.value))}
			/>
			<Label>{level}%</Label>
		</label>
	{/if}

	{#if editable}
		<button
			class="color"
			type="button"
			aria-haspopup="dialog"
			aria-label="{light.name} color, {colorLabel}"
			disabled={!light.isOn}
			onclick={oneditcolor}
		>
			<ColorSwatch hex={swatch} />
			<Label>{colorLabel}</Label>
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
