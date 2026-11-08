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
		gap: var(--space-3);
	}

	h2,
	.count {
		margin: 0;
	}

	h2 {
		font-family: var(--font-display);
		font-size: var(--text-section);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-title);
		line-height: 1.2;
	}

	.count {
		color: var(--color-mute);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		line-height: 1.2;
	}
</style>
