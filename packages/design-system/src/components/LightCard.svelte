<script lang="ts">
	import { xyToHex } from '@huxel/app';
	import type { SvelteLight } from '@huxel/app/svelte';
	import { findPaletteColor } from '../palette';
	import ColorSwatch from './ColorSwatch.svelte';
	import Label from './Label.svelte';
	import PowerIcon from './icons/PowerIcon.svelte';

	interface Props {
		light: SvelteLight;
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
	style:--glow={colors[0] ?? 'var(--foreground-emphasis-primary)'}
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
		overflow: hidden;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-8);
		background: color-mix(in srgb, var(--background-neutral-medium) 42%, var(--background-default));
		box-shadow: var(--elevation-1);
		color: var(--foreground-neutral-secondary);
	}

	.card.on {
		border-color: color-mix(in srgb, var(--glow) 55%, var(--border-neutral));
		background: var(--background-neutral-medium);
		color: var(--foreground-neutral-primary);
	}

	.card.combined,
	.card.on.combined {
		position: relative;
		background: var(--background-default);
	}

	.card.on.combined {
		color: var(--foreground-emphasis-on-fill);
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

	.card.combined:not(.on)::before {
		opacity: 0.35;
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
		align-items: flex-start;
		justify-content: space-between;
	}

	.icon {
		display: grid;
		place-items: center;
		width: var(--size-small);
		height: var(--size-small);
		border: var(--border-width) solid currentColor;
		border-radius: var(--radius-control);
	}

	.card.on .icon {
		border-color: transparent;
		background: var(--background-emphasis-strong);
		color: var(--foreground-emphasis-on-fill);
	}

	.metric {
		margin-block-start: auto;
		font-family: var(--font-mono);
		font-size: var(--font-size-heading-1);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-heading-1);
		line-height: var(--line-height-heading-1);
	}

	.metric small {
		font-size: var(--font-size-body-2);
		font-weight: var(--font-weight-medium);
	}

	.color {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2);
		border: var(--border-width) solid currentColor;
		border-radius: var(--radius-control);
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
		accent-color: var(--glow);
		cursor: pointer;
	}

	.dimmer:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
