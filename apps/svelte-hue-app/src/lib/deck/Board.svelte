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
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.lanes,
	.sources {
		min-width: 0;
	}

	.lanes {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
</style>
