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
					live: connection === 'live',
					pending: connection === 'connecting' || connection === 'reconnecting',
					offline: connection === 'offline'
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
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding-block-end: var(--space-3);
		border-bottom: var(--border-width) solid var(--border-neutral);
		color: var(--foreground-neutral-secondary);
	}

	.title {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: var(--foreground-neutral-tertiary);
	}

	.dot.live {
		background: var(--foreground-success-primary);
	}

	.dot.pending {
		background: var(--foreground-warning-primary);
	}

	.dot.offline {
		background: var(--foreground-critical-primary);
	}

	.state {
		color: var(--foreground-neutral-primary);
	}

	time {
		font-family: var(--font-mono);
	}
</style>
