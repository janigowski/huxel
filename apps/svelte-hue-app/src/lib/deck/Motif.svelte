<script lang="ts">
	interface Props {
		kind?: 'hatch' | 'barcode';
	}

	let { kind = 'hatch' }: Props = $props();
</script>

<span class={kind} aria-hidden="true"></span>

<style>
	.hatch,
	.barcode {
		display: block;
		flex-shrink: 0;
		width: var(--motif-width);
		height: var(--gradient-height);
		border: var(--rule) solid var(--color-paper);
	}

	.hatch {
		background: var(--hatch);
	}

	.barcode {
		background: var(--barcode);
	}
</style>
