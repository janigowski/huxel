<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'error' | 'muted';
		children: Snippet;
	}

	let { tone = 'error', children }: Props = $props();
</script>

<div class={['notice', tone]}>
	{#if tone === 'error'}
		<span class="flag" aria-hidden="true">Error</span>
	{/if}
	<p class="message" role={tone === 'error' ? 'alert' : 'status'}>
		{@render children()}
	</p>
</div>

<style>
	.notice {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: var(--rule) solid var(--color-paper);
		background: var(--color-surface);
	}

	.message {
		margin: 0;
		font-size: var(--text-body);
		line-height: var(--leading-body);
	}

	.muted {
		color: var(--color-mute);
		border-color: var(--color-line);
		background: transparent;
	}

	.flag {
		flex-shrink: 0;
		padding: var(--space-1) var(--space-2);
		background: var(--color-paper);
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: var(--text-label);
		font-weight: var(--font-weight-bold);
		line-height: 1.2;
	}
</style>
