<script lang="ts">
	import BrandMark from './BrandMark.svelte';

	interface Props {
		title: string;
		subtitle: string;
		product?: string;
	}

	let { title, subtitle, product }: Props = $props();
</script>

<section class="hero">
	<div>
		<h1>{title}</h1>
		<p class="subtitle">{subtitle}</p>
	</div>
	<BrandMark {product} />
</section>

<style>
	.hero {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-4);
		padding-block: var(--space-4) var(--space-6);
	}

	h1 {
		margin: 0;
		font-size: var(--font-size-heading-1);
		font-weight: var(--font-weight-heading-1);
		letter-spacing: var(--tracking-heading-1);
		line-height: var(--line-height-heading-1);
	}

	.subtitle {
		margin: var(--space-2) 0 0;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-1);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-body-1);
	}
</style>
