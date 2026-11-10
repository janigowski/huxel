<script lang="ts">
	import { Label } from '@huxel/design-system';

	interface Props {
		host: string;
		onforget: () => void;
	}

	let { host, onforget }: Props = $props();
</script>

<footer class="bar">
	<Label>Linked to {host}</Label>
	<button type="button" onclick={onforget}><Label>Forget bridge</Label></button>
</footer>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-block-start: var(--space-4);
		padding-block-start: var(--space-3);
		border-top: var(--border-width) solid var(--border-neutral);
		color: var(--foreground-neutral-secondary);
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
</style>
