<script lang="ts">
	import type { HueAppConnection } from 'hue-app';
	import { bridgeTail } from './readout';

	interface Props {
		bridgeId: string;
		connection?: HueAppConnection;
	}

	let { bridgeId, connection }: Props = $props();

	const labels: Record<HueAppConnection, string> = {
		live: 'Live',
		reconnecting: 'Reconnecting',
		connecting: 'Connecting',
		offline: 'Offline'
	};
	const tail = $derived(bridgeTail(bridgeId));
	const label = $derived(connection ? labels[connection] : 'Not connected');
	const live = $derived(connection === 'live');
</script>

<header class="status">
	<p class="brand">Hue</p>
	<p class="bridge" title={bridgeId}>Bridge {tail}</p>
	<p class={['pill', { live }]} role="status" aria-live="polite">{label}</p>
</header>

<style>
	.status {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
		padding-block-end: var(--space-4);
		border-bottom: var(--rule) solid var(--color-line);
	}

	.brand,
	.bridge,
	.pill {
		margin: 0;
	}

	.brand {
		flex-shrink: 0;
		font-family: var(--font-display);
		font-size: var(--text-section);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-title);
		line-height: 1;
	}

	.bridge {
		min-width: 0;
		overflow: hidden;
		color: var(--color-mute);
		font-family: var(--font-mono);
		font-size: var(--text-label);
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pill {
		flex-shrink: 0;
		margin-inline-start: auto;
		padding: var(--space-2) var(--space-3);
		border: var(--rule) solid var(--color-line);
		color: var(--color-mute);
		font-size: var(--text-label);
		font-weight: var(--font-weight-bold);
		line-height: 1.2;
	}

	.live {
		border-color: var(--color-paper);
		background: var(--color-paper);
		color: var(--color-ink);
	}
</style>
