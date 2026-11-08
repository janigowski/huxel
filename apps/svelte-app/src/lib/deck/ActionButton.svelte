<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		onclick: () => void;
		disabled?: boolean;
		children: Snippet;
	}

	let { onclick, disabled = false, children }: Props = $props();
</script>

<button class="action" type="button" {onclick} {disabled}>
	{@render children()}
</button>

<style>
	.action {
		min-height: var(--control-size);
		padding: var(--space-3) var(--space-5);
		border: var(--rule) solid var(--color-paper);
		background: var(--color-paper);
		color: var(--color-ink);
		font-family: var(--font-display);
		font-size: var(--text-body);
		font-weight: var(--font-weight-bold);
		line-height: 1.2;
		cursor: pointer;
	}

	.action:disabled {
		opacity: 0.6;
		cursor: progress;
	}

	@media (hover: hover) {
		.action:hover:not(:disabled) {
			background: transparent;
			color: var(--color-paper);
		}
	}
</style>
