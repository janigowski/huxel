<script lang="ts">
	import type { Snippet } from 'svelte';
	import ActionButton from './ActionButton.svelte';
	import Label from './Label.svelte';
	import Notice from './Notice.svelte';

	interface Props {
		connecting: boolean;
		error: string | null;
		onconnect: () => void;
		disabled?: boolean;
		children?: Snippet;
	}

	let { connecting, error, onconnect, disabled = false, children }: Props = $props();
</script>

<section class="connect">
	<Label>Bridge not linked</Label>
	<p>Press the link button on your Hue bridge, then connect within 30 seconds.</p>

	{@render children?.()}

	<ActionButton onclick={onconnect} disabled={connecting || disabled}>
		{connecting ? 'Connecting…' : 'Connect bridge'}
	</ActionButton>

	{#if error}
		<Notice>{error}</Notice>
	{/if}
</section>

<style>
	.connect {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-4);
		padding: var(--space-4);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-12);
		background: var(--background-neutral-medium);
		box-shadow: var(--elevation-1);
	}

	.connect :global(p) {
		margin: 0;
		color: var(--foreground-neutral-secondary);
	}
</style>
