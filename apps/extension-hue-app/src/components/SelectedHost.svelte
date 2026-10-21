<script lang="ts">
	import { Label } from 'design-system';

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
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		border: var(--rule-thin) solid var(--color-mint-muted);
	}

	button {
		padding: 0;
		border: none;
		background: none;
		color: var(--color-mint);
		cursor: pointer;
	}

	button:hover,
	button:focus-visible {
		color: var(--color-orange);
	}

	button:disabled {
		opacity: 0.6;
		cursor: progress;
	}
</style>
