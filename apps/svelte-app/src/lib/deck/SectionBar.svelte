<script lang="ts">
	interface Props {
		title: string;
		active: number;
		total: number;
	}

	let { title, active, total }: Props = $props();
</script>

<header class="bar">
	<h2>{title}</h2>
	{#if total > 0}
		<p class="count">{active} of {total} on</p>
	{/if}
</header>

<style>
	.bar {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		padding-bottom: var(--space-3);
		border-bottom: var(--border-width) solid var(--border-neutral);
	}

	h2,
	.count {
		margin: 0;
	}

	h2 {
		font-size: var(--font-size-heading-2);
		font-weight: var(--font-weight-heading-2);
		letter-spacing: var(--tracking-heading-2);
		line-height: var(--line-height-heading-2);
	}

	.count {
		color: var(--foreground-neutral-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
	}
</style>
