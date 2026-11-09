<script lang="ts">
	import Label from './Label.svelte';

	interface Props {
		title: string;
		active: number;
		total: number;
	}

	let { title, active, total }: Props = $props();

	const activePercent = $derived(total > 0 ? (active / total) * 100 : 0);
</script>

<header class="section-header">
	<div class="heading">
		<h2>{title}</h2>
		<Label>{active} of {total} on</Label>
	</div>
	<div class="ratio" aria-hidden="true">
		<span class="fill" style:width="{activePercent}%"></span>
	</div>
</header>

<style>
	.heading {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-block-end: var(--space-3);
	}

	h2 {
		color: var(--color-accent);
		font-weight: var(--font-weight-semibold);
	}

	.ratio {
		height: var(--rule-thick);
		margin-block-end: var(--space-6);
		background: var(--color-text);
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--color-accent);
	}
</style>
