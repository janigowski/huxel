<script lang="ts">
	import { Label } from '@huxel/design-system';

	interface Props {
		url: string;
		onretry?: () => void;
	}

	let { url, onretry }: Props = $props();

	const host = $derived(new URL(url).host);
</script>

<aside class="hint" aria-label="Bridge certificate">
	<Label>Trust the bridge</Label>
	<p>
		The bridge uses its own certificate. Open {host}, choose Advanced and then Proceed, close the
		tab and come back.
		{#if onretry}
			If the bridge moved to another address, forget it and link it again.
		{/if}
	</p>

	<div class="actions">
		<a href={url} target="_blank" rel="noreferrer"><Label>Open {host}</Label></a>

		{#if onretry}
			<button type="button" onclick={onretry}><Label>Retry</Label></button>
		{/if}
	</div>
</aside>

<style>
	.hint {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		border: var(--border-width) solid var(--border-warning);
		border-radius: var(--radius-8);
		background: var(--background-warning-soft);
		color: var(--foreground-neutral-primary);
	}

	.hint :global(p) {
		margin: 0;
	}

	.actions {
		display: flex;
		gap: var(--space-2);
	}

	a,
	button {
		padding: var(--space-2) var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: var(--background-neutral-medium);
		color: var(--foreground-neutral-primary);
		text-decoration: none;
		cursor: pointer;
	}
</style>
