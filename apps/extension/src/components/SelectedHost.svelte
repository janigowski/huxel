<script lang="ts">
	import { Label } from '@huxel/design-system';

	interface Props {
		host: string;
		disabled?: boolean;
		onchange: () => void;
	}

	let { host, disabled = false, onchange }: Props = $props();
</script>

<div class="selected">
	<Label>Bridge {host}</Label>
	<button type="button" onclick={onchange} {disabled}><Label>Change</Label></button>
</div>

<style>
	.selected {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: var(--background-default);
		font-family: var(--font-mono);
	}

	button {
		padding: 0;
		border: none;
		background: none;
		color: var(--foreground-neutral-secondary);
		cursor: pointer;
	}

	button:hover,
	button:focus-visible {
		color: var(--foreground-emphasis-primary);
	}

	button:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
