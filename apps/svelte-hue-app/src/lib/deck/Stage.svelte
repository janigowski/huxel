<script lang="ts">
	import type { HueAppConnection } from 'hue-app';
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
		children: Snippet;
	}

	let { bridgeId, connection, onCount, total, rooms, zones, children }: Props = $props();
</script>

<div class="field">
	<a class="skip" href="#lights">Skip to lights</a>
	<main class="frame" id="lights">
		<StatusBar {bridgeId} {connection} />
		<Masthead
			title="All lights"
			detail="Connect a bridge to control your lights."
			{onCount}
			{total}
			{rooms}
			{zones}
		/>
		{@render children()}
	</main>
</div>

<style>
	.field {
		position: relative;
		min-height: 100dvh;
		padding: var(--frame-inset);
	}

	.frame {
		display: flex;
		flex-direction: column;
		max-width: 88rem;
		min-height: calc(100dvh - 2 * var(--frame-inset));
		margin-inline: auto;
	}

	.skip {
		position: absolute;
		z-index: var(--z-mark);
		inset-block-start: var(--space-4);
		inset-inline-start: var(--space-4);
		padding: var(--space-2) var(--space-3);
		background: var(--color-paper);
		color: var(--color-ink);
		transform: translateY(-200%);
	}

	.skip:focus {
		transform: none;
	}
</style>
