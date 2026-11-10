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
		margin: 0;
		font-size: var(--font-size-heading-3);
		font-weight: var(--font-weight-heading-3);
		letter-spacing: var(--tracking-heading-3);
		line-height: var(--line-height-heading-3);
	}

	.ratio {
		height: var(--focus-width);
		margin-block-end: var(--space-4);
		border-radius: var(--radius-full);
		background: var(--border-neutral);
	}

	.fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--background-emphasis-strong);
	}
</style>
