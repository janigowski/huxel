<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		lanes: Snippet;
		sources: Snippet;
	}

	let { lanes, sources }: Props = $props();
</script>

<div class="board">
	<div class="lanes">
		{@render lanes()}
	</div>
	<div class="sources">
		{@render sources()}
	</div>
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-8);
		align-items: start;
	}

	.lanes,
	.sources {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		min-width: 0;
	}

	@media (min-width: 960px) {
		.board {
			grid-template-columns: minmax(18rem, 22rem) minmax(0, 1fr);
		}
	}
</style>
