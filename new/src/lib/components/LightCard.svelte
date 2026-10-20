<script lang="ts">
	import type { Light } from '$lib/hue/lights.svelte';
	import Label from './Label.svelte';
	import PowerIcon from './icons/PowerIcon.svelte';

	interface Props {
		light: Light;
		index: number;
		ontoggle: () => void;
	}

	let { light, index, ontoggle }: Props = $props();

	const number = $derived(String(index + 1).padStart(2, '0'));
	const level = $derived(light.on ? (light.brightness ?? 100) : 0);
</script>

<button class="card" class:on={light.on} aria-pressed={light.on} onclick={ontoggle}>
	<span class="top">
		<span class="icon"><PowerIcon /></span>
		<Label>{number}</Label>
	</span>
	<span class="metric">{level}<small>%</small></span>
	<Label>{light.name}</Label>
</button>

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
		text-align: left;
		cursor: pointer;
	}

	.card.on {
		background: var(--color-orange);
		color: var(--color-ink);
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
</style>
