<script lang="ts">
	import ActionButton from './ActionButton.svelte';
	import Notice from './Notice.svelte';

	interface Props {
		connecting: boolean;
		error: string | null;
		onconnect: () => void;
	}

	let { connecting, error, onconnect }: Props = $props();
</script>

<section class="connect" aria-labelledby="link-title">
	<h2 id="link-title">Connect your bridge</h2>
	<p class="copy">Press the button on your Hue bridge, then connect within 30 seconds.</p>
	<ActionButton onclick={onconnect} disabled={connecting}>
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
		max-width: 36rem;
		padding: var(--space-5);
		border: var(--rule) solid var(--color-line);
		background: var(--color-surface);
	}

	h2,
	.copy {
		margin: 0;
	}

	h2 {
		font-family: var(--font-display);
		font-size: var(--text-section);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-title);
		line-height: 1.2;
	}

	.copy {
		max-width: 34rem;
		color: var(--color-paper);
		font-size: var(--text-body);
		line-height: var(--leading-body);
	}
</style>
