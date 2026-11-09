<script lang="ts">
	import { ActionButton, Label, Notice } from '@huxel/design-system';
	import type { Snippet } from 'svelte';

	interface Props {
		host: string | null;
		requesting: boolean;
		error: string | null;
		onallow: () => void;
		disabled?: boolean;
		children: Snippet;
	}

	let { host, requesting, error, onallow, disabled = false, children }: Props = $props();
</script>

<section class="access">
	<Label>Bridge access</Label>

	{@render children()}

	<ActionButton onclick={onallow} disabled={requesting || disabled}>
		{requesting ? 'Waiting for access…' : host ? `Allow access to ${host}` : 'Allow access'}
	</ActionButton>

	{#if error}
		<Notice>{error}</Notice>
	{/if}
</section>

<style>
	.access {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-4);
		padding-block: var(--space-6);
		border-top: var(--rule-thick) solid var(--color-accent);
	}
</style>
