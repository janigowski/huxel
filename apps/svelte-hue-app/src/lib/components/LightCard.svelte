<script lang="ts">
	import type { SvelteLight } from 'hue-app/svelte';
	import Label from './Label.svelte';
	import PowerIcon from './icons/PowerIcon.svelte';

	interface Props {
		light: SvelteLight;
		index: number;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
	}

	let { light, index, ontoggle, ondim }: Props = $props();

	const number = $derived(String(index + 1).padStart(2, '0'));
	const level = $derived(light.isOn ? Math.round(light.brightness ?? 100) : 0);
</script>

<article class="card" class:on={light.isOn}>
	<button class="toggle" aria-pressed={light.isOn} onclick={ontoggle}>
		<span class="top">
			<span class="icon"><PowerIcon /></span>
			<Label>{number}</Label>
		</span>
		<span class="metric">{level}<small>%</small></span>
		<Label>{light.name}</Label>
	</button>

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
