<script lang="ts">
	import type { HueAppConnection } from '@huxel/app';
	import Label from './Label.svelte';

	interface Props {
		label: string;
		date: Date;
		connection?: HueAppConnection;
	}

	let { label, date, connection }: Props = $props();

	const connectionLabels: Record<HueAppConnection, string> = {
		live: 'Live',
		reconnecting: 'Reconnecting…',
		connecting: 'Connecting…',
		offline: 'Offline'
	};

	const formattedDate = $derived(
		date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
	);
</script>

<header class="bar">
	<span class="title">
		<span
			class={[
				'dot',
				{
					live: connection === undefined || connection === 'live',
					pending: connection === 'connecting' || connection === 'reconnecting'
				}
			]}
			aria-hidden="true"
		></span>
		<Label>{label}</Label>
		{#if connection}
			<span class="state" role="status" aria-live="polite">
				<Label>{connectionLabels[connection]}</Label>
			</span>
		{/if}
	</span>
	<time datetime={date.toISOString()}>
		<Label>{formattedDate}</Label>
	</time>
</header>

<style>
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-block-end: var(--space-2);
		border-bottom: var(--rule-thin) solid var(--color-text);
	}

	.title {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.dot {
		width: var(--space-3);
		height: var(--space-3);
		border-radius: 50%;
		background: var(--color-text-secondary);
	}

	.dot.live {
		background: var(--color-text);
	}

	.dot.pending {
		animation: pulse 1.2s ease-in-out infinite;
	}

	.state {
		color: var(--color-text-secondary);
	}

	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot.pending {
			animation: none;
		}
	}
</style>
