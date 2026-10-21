<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<span class="label">{@render children()}</span>

<style>
	.label {
		font-size: var(--text-label);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
	}
</style>
