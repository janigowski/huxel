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
		padding-block: var(--space-4);
	}

	.error {
		color: var(--color-orange);
	}

	.muted {
		color: var(--color-mint-muted);
	}
</style>
