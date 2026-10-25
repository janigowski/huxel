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
		font-family: var(--font-mono);
		font-size: var(--text-label);
		font-weight: var(--font-weight-regular);
		letter-spacing: var(--tracking-label);
		line-height: 1.2;
		text-transform: uppercase;
	}
</style>
