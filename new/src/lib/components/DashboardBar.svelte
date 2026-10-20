<script lang="ts">
	import Label from './Label.svelte';

	interface Props {
		label: string;
		date: Date;
	}

	let { label, date }: Props = $props();

	const formattedDate = $derived(
		date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
	);
</script>

<header class="bar">
	<span class="title">
		<span class="dot" aria-hidden="true"></span>
		<Label>{label}</Label>
	</span>
	<time datetime={date.toISOString()}>
		<Label>{formattedDate}</Label>
	</time>
</header>

<style>
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-block-end: var(--space-2);
		border-bottom: var(--rule-thin) solid var(--color-mint);
	}

	.title {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.dot {
		width: var(--space-3);
		height: var(--space-3);
		border-radius: 50%;
		background: var(--color-mint);
	}
</style>
