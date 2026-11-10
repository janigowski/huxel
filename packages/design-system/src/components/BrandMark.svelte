<script lang="ts">
	interface Props {
		product?: string;
	}

	let { product }: Props = $props();
</script>

<span class="wordmark">
	huxel<span class="slash" aria-hidden="true">//</span>{product}
</span>

<style>
	.wordmark {
		display: inline-flex;
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
</style>
