<script lang="ts">
	import type { HueAppConnection } from '@huxel/app';
	import { resolve } from '$app/paths';
	import { bridgeTail } from './readout';

	interface Props {
		bridgeId: string;
		connection?: HueAppConnection;
		preview?: boolean;
	}

	let { bridgeId, connection, preview = false }: Props = $props();

	const labels: Record<HueAppConnection, string> = {
		live: 'Live',
		reconnecting: 'Reconnecting',
		connecting: 'Connecting',
		offline: 'Offline'
	};
	const tail = $derived(bridgeTail(bridgeId));
	const label = $derived(preview ? 'Preview' : connection ? labels[connection] : 'Not connected');
	const tone = $derived(preview ? 'preview' : (connection ?? 'idle'));
</script>

<header class="status">
	<div class="bar">
		<p class="brand">huxel<span class="slash" aria-hidden="true">//</span>app</p>
		<p class="bridge" title={bridgeId}>{preview ? 'sample home' : `bridge ${tail}`}</p>
		{#if preview}
			<a class="exit" href={resolve('/')}>Exit preview</a>
		{/if}
		<p class={['pill', tone]} role="status" aria-live="polite">
			<span class="dot" aria-hidden="true"></span>
			{label}
		</p>
	</div>
</header>

<style>
	.status {
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
		border-bottom: var(--border-width) solid var(--border-neutral);
		background: color-mix(in srgb, var(--background-default) 92%, transparent);
		backdrop-filter: blur(16px);
	}

	.bar {
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: var(--space-4);
		width: min(var(--page-width), 100%);
		min-width: 0;
		margin-inline: auto;
		padding: var(--space-4) var(--frame-inset);
	}

	.brand,
	.bridge,
	.pill {
		margin: 0;
	}

	.brand {
		display: inline-flex;
		flex-shrink: 0;
		align-items: baseline;
		gap: var(--space-2);
		font-size: var(--font-size-heading-3);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-display);
		line-height: var(--line-height-heading-3);
	}

	.slash {
		color: var(--foreground-emphasis-primary);
	}

	.bridge {
		min-width: 0;
		overflow: hidden;
		color: var(--foreground-neutral-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.exit {
		flex-shrink: 0;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
		text-decoration: none;
	}

	.exit:hover {
		color: var(--foreground-neutral-primary);
	}

	.pill {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: var(--space-2);
		margin-inline-start: auto;
		padding: var(--space-1) var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: var(--radius-full);
		background: currentColor;
	}

	.live {
		border-color: transparent;
		background: var(--background-success-soft);
		color: var(--foreground-success-primary);
	}

	.connecting,
	.reconnecting {
		border-color: transparent;
		background: var(--background-warning-soft);
		color: var(--foreground-warning-primary);
	}

	.offline {
		border-color: transparent;
		background: var(--background-critical-soft);
		color: var(--foreground-critical-primary);
	}

	.preview {
		border-color: transparent;
		background: var(--background-emphasis-soft);
		color: var(--foreground-emphasis-primary);
	}

	@media (max-width: 560px) {
		.bridge {
			display: none;
		}
	}
</style>
