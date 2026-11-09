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
		min-height: var(--size-large);
		padding: var(--space-3) var(--space-4);
		border: 0;
		border-radius: var(--radius-control);
		background: var(--background-emphasis-strong);
		box-shadow: var(--elevation-1);
		color: var(--foreground-emphasis-on-fill);
		font-size: var(--font-size-body-1);
		font-weight: var(--font-weight-control);
		letter-spacing: var(--tracking-control);
		line-height: var(--line-height-body-1);
		cursor: pointer;
		transition: background var(--duration-default) var(--ease-default);
	}

	.action:disabled {
		background: var(--background-emphasis-strong-disabled);
		box-shadow: none;
		color: var(--foreground-emphasis-on-fill-disabled);
		cursor: progress;
	}

	@media (hover: hover) {
		.action:hover:not(:disabled) {
			background: var(--background-emphasis-strong-hover);
		}
	}

	.action:active:not(:disabled) {
		background: var(--background-emphasis-strong-pressed);
	}
</style>
