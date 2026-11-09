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
		border: var(--border-width) solid var(--border-critical);
		border-radius: var(--radius-8);
		background: var(--background-critical-soft);
		color: var(--foreground-critical-primary);
	}

	.message {
		margin: 0;
		font-size: var(--font-size-body-1);
		line-height: var(--line-height-body-1);
	}

	.muted {
		border-color: var(--border-neutral);
		background: var(--background-neutral-medium);
		color: var(--foreground-neutral-secondary);
	}

	.flag {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: var(--font-size-body-2);
		letter-spacing: var(--tracking-label);
		line-height: var(--line-height-body-2);
		text-transform: uppercase;
	}
</style>
