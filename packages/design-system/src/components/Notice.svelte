<script lang="ts">
	import type { Snippet } from 'svelte';
	import Label from './Label.svelte';

	interface Props {
		tone?: 'error' | 'muted';
		children: Snippet;
	}

	let { tone = 'error', children }: Props = $props();
</script>

<p class="notice {tone}" role={tone === 'error' ? 'alert' : 'status'}>
	<Label>{@render children()}</Label>
</p>

<style>
	.notice {
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border: var(--border-width) solid var(--border-critical);
		border-radius: var(--radius-8);
		background: var(--background-critical-soft);
		color: var(--foreground-critical-primary);
	}

	.muted {
		border-color: var(--border-neutral);
		background: var(--background-neutral-medium);
		color: var(--foreground-neutral-secondary);
	}
</style>
