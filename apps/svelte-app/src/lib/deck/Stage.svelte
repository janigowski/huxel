<script lang="ts">
	import type { HueAppConnection } from '@huxel/app';
	import type { Snippet } from 'svelte';
	import Masthead from './Masthead.svelte';
	import StatusBar from './StatusBar.svelte';

	interface Props {
		bridgeId: string;
		connection?: HueAppConnection;
		onCount: number | null;
		total: number | null;
		rooms?: number;
		zones?: number;
		title?: string;
		detail?: string;
		note?: string;
		preview?: boolean;
		children: Snippet;
	}

	let {
		bridgeId,
		connection,
		onCount,
		total,
		rooms,
		zones,
		title = 'Home',
		detail = 'Link the Hue bridge on this network.',
		note,
		preview = false,
		children
	}: Props = $props();
</script>

<div class="field">
	<a class="skip" href="#lights">Skip to lights</a>
	<StatusBar {bridgeId} {connection} {preview} />
	<main class={['frame', { resting: onCount === null }]} id="lights">
		<Masthead {title} {detail} {note} {onCount} {total} {rooms} {zones} />
		{@render children()}
	</main>
</div>

<style>
	.field {
		position: relative;
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		background:
			radial-gradient(
				80rem 28rem at 0% -10%,
				color-mix(in srgb, var(--color-brand-500) 14%, transparent),
				transparent 62%
			),
			var(--background-default);
	}

	.frame {
		box-sizing: border-box;
		display: flex;
		flex: 1;
		flex-direction: column;
		width: min(var(--page-width), 100%);
		margin-inline: auto;
		padding: var(--space-2) var(--frame-inset) var(--space-16);
	}

	.resting {
		align-items: center;
		justify-content: center;
		padding-block: var(--space-6);
	}

	.skip {
		position: absolute;
		z-index: var(--z-toast);
		inset-block-start: var(--space-4);
		inset-inline-start: var(--space-4);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-control);
		background: var(--background-emphasis-strong);
		color: var(--foreground-emphasis-on-fill);
		transform: translateY(-200%);
	}

	.skip:focus {
		transform: none;
	}
</style>
