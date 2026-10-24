<script lang="ts">
	import { xyToHex } from 'hue-app';
	import type { SvelteLight } from 'hue-app/svelte';
	import { findPaletteColor } from '../palette';
	import ColorSwatch from './ColorSwatch.svelte';
	import Label from './Label.svelte';
	import PowerIcon from './icons/PowerIcon.svelte';

	interface CardLight extends SvelteLight {
		readonly colors?: readonly string[];
	}

	interface Props {
		light: CardLight;
		index: number;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
	}

	let { light, index, ontoggle, ondim, oneditcolor }: Props = $props();

	const number = $derived(String(index + 1).padStart(2, '0'));
	const level = $derived(light.isOn ? Math.round(light.brightness ?? 100) : 0);
	const paletteColor = $derived(findPaletteColor(light.color));
	const colorName = $derived(paletteColor?.name ?? 'Custom');
	const colors = $derived(light.colors ?? []);
	const combined = $derived(colors.length > 0);
	const stops = $derived(colors.join(', '));
	const restOpacity = $derived.by(() => {
		const brightness = Math.min(100, Math.max(0, light.brightness ?? 100));

		return Math.round((0.05 + (brightness / 100) * 0.95) * 1000) / 1000;
	});
</script>

<article
	class={['card', { on: light.isOn, combined }]}
	style:--combined-stops={stops}
	style:--combined-opacity={restOpacity}
>
	<button class="toggle" aria-pressed={light.isOn} onclick={ontoggle}>
		<span class="top">
			<span class="icon"><PowerIcon /></span>
			<Label>{number}</Label>
		</span>
		<span class="metric">{level}<small>%</small></span>
		<Label>{light.name}</Label>
	</button>

	{#if light.color !== null}
		<button
			class="color"
			type="button"
			aria-haspopup="dialog"
			aria-label="{light.name} color: {colorName}"
			disabled={!light.isOn}
			onclick={oneditcolor}
		>
			<ColorSwatch hex={paletteColor?.hex ?? xyToHex(light.color)} />
			<Label>{colorName}</Label>
		</button>
	{/if}

	{#if light.brightness !== null}
		<input
			class="dimmer"
			type="range"
			min="0"
			max="100"
			step="1"
			value={light.brightness}
			disabled={!light.isOn}
			aria-label="{light.name} brightness"
			oninput={(event) => ondim(Number(event.currentTarget.value))}
		/>
	{/if}
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		min-height: 9rem;
		padding: var(--space-3);
		border: var(--rule-thin) solid var(--color-orange);
		background: repeating-linear-gradient(
			-45deg,
			color-mix(in srgb, var(--color-orange) 25%, transparent) 0 1px,
			transparent 1px 6px
		);
		color: var(--color-orange);
	}

	.card.on {
		background: var(--color-orange);
		color: var(--color-ink);
	}

	.card.combined,
	.card.on.combined {
		position: relative;
		color: var(--color-orange);
		background: var(--color-background);
	}

	.card.combined::before {
		content: '';
		position: absolute;
		z-index: 0;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(to bottom, var(--combined-stops));
		mask-image: linear-gradient(
			to bottom,
			#000 0%,
			rgb(0 0 0 / calc(var(--combined-opacity) + (1 - var(--combined-opacity)) * 0.92)) 15%,
			rgb(0 0 0 / calc(var(--combined-opacity) + (1 - var(--combined-opacity)) * 0.45)) 55%,
			rgb(0 0 0 / var(--combined-opacity)) 100%
		);
	}

	.card.combined > * {
		position: relative;
		z-index: 1;
	}

	.toggle {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-2);
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.icon {
		display: grid;
		place-items: center;
		width: var(--icon-tile-size);
		height: var(--icon-tile-size);
		border: var(--rule-thin) solid currentColor;
	}

	.metric {
		margin-block-start: auto;
		font-size: var(--text-metric);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-tight);
		line-height: 1;
	}

	.metric small {
		font-size: var(--text-body);
		font-weight: var(--font-weight-semibold);
	}

	.color {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		border: var(--rule-thin) solid currentColor;
		background: none;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.color:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dimmer {
		width: 100%;
		accent-color: currentColor;
		cursor: pointer;
	}

	.dimmer:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
