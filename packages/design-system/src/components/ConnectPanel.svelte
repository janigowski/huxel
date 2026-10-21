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
		align-items: flex-start;
		gap: var(--space-4);
		padding-block: var(--space-6);
		border-top: var(--rule-thick) solid var(--color-orange);
	}
</style>
