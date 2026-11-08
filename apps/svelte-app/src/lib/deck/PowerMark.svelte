<script lang="ts">
	import PowerIcon from './PowerIcon.svelte';
</script>

<span class="power" aria-hidden="true">
	<span class="glyph"><PowerIcon /></span>
</span>

<style>
	.power {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: var(--index-size);
		height: var(--index-size);
		border: var(--rule) solid currentColor;
	}

	.glyph {
		display: grid;
	}

	:global(button:hover) .power {
		background: currentColor;
	}

	:global(button:hover) .glyph {
		color: var(--field);
	}

	@media (hover: none) {
		:global(button:hover) .power {
			background: transparent;
		}

		:global(button:hover) .glyph {
			color: inherit;
		}
	}
</style>
