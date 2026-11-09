<script lang="ts">
	import mark from '$lib/assets/favicon.svg';
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
	<div class="lead">
		<img class="mark" src={mark} alt="" width="48" height="48" />
		<h2 id="link-title">Connect your bridge</h2>
		<p class="copy">Press the button on your Hue bridge, then connect within 30 seconds.</p>
	</div>
	<ActionButton onclick={onconnect} disabled={connecting}>
		{connecting ? 'Connecting…' : 'Connect bridge'}
	</ActionButton>
	{#if error}
		<Notice>{error}</Notice>
	{/if}
	<a class="sample" href="/studio">Preview a sample home</a>
</section>

<style>
	.connect {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-6);
		width: min(28rem, 100%);
		padding: var(--space-6);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-12);
		background: var(--background-neutral-medium);
		box-shadow: var(--elevation-2);
	}

	.lead {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.mark {
		display: block;
		width: var(--size-large);
		height: var(--size-large);
	}

	h2,
	.copy {
		margin: 0;
	}

	h2 {
		font-size: var(--font-size-heading-2);
		font-weight: var(--font-weight-heading-2);
		letter-spacing: var(--tracking-heading-2);
		line-height: var(--line-height-heading-2);
	}

	.copy {
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-1);
		line-height: var(--line-height-body-1);
	}

	.sample {
		align-self: flex-start;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
		text-decoration: underline;
		text-decoration-color: var(--border-neutral);
		text-underline-offset: 3px;
	}

	.sample:hover {
		color: var(--foreground-emphasis-primary);
		text-decoration-color: var(--foreground-emphasis-primary);
	}
</style>
