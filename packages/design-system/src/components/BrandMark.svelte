<script lang="ts">
	interface Props {
		product?: string;
	}

	let { product }: Props = $props();
</script>

<span class="wordmark">
	huxel<span class="slash">//</span>{product}
</span>

<style>
	.wordmark {
		font-size: var(--text-subtitle);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-display);
		line-height: 1;
	}

	.slash {
		color: var(--color-accent);
	}
</style>
