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
		justify-content: space-between;
		align-items: center;
		margin-block-start: var(--space-6);
		padding-block-start: var(--space-2);
		border-top: var(--rule-thin) solid var(--color-text);
		color: var(--color-text-secondary);
	}

	button {
		padding: 0;
		border: none;
		background: none;
		color: var(--color-text);
		cursor: pointer;
	}

	button:hover,
	button:focus-visible {
		color: var(--color-accent);
	}
</style>
