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
		font-size: var(--font-size-body-2);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-body-2);
		line-height: var(--line-height-body-2);
	}
</style>
