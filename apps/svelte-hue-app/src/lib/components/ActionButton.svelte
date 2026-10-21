<script lang="ts">
	import type { Snippet } from 'svelte';
	import Label from './Label.svelte';

	interface Props {
		onclick: () => void;
		disabled?: boolean;
		children: Snippet;
	}

	let { onclick, disabled = false, children }: Props = $props();
</script>

<button class="action" {onclick} {disabled}>
	<Label>{@render children()}</Label>
</button>

<style>
	.action {
		padding: var(--space-3) var(--space-6);
		background: var(--color-orange);
		color: var(--color-ink);
		cursor: pointer;
	}

	.action:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
