<script lang="ts">
	import type { BridgeConnection } from '$lib/hue/connection.svelte';
	import ActionButton from './ActionButton.svelte';
	import Label from './Label.svelte';
	import Notice from './Notice.svelte';

	interface Props {
		connection: BridgeConnection;
	}

	let { connection }: Props = $props();
</script>

<section class="connect">
	<Label>Bridge not linked</Label>
	<p>Press the link button on your Hue bridge, then connect within 30 seconds.</p>
	<ActionButton onclick={() => connection.connect()} disabled={connection.connecting}>
		{connection.connecting ? 'Connecting…' : 'Connect bridge'}
	</ActionButton>

	{#if connection.error}
		<Notice>{connection.error}</Notice>
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
