<script lang="ts">
	import BrandMark from './BrandMark.svelte';

	interface Props {
		title: string;
		subtitle: string;
	}

	let { title, subtitle }: Props = $props();
</script>

<section class="hero">
	<div>
		<h1>{title}</h1>
		<p class="subtitle">{subtitle}</p>
	</div>
	<BrandMark name="HUE" />
</section>

<style>
	.hero {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-6);
		padding-block: var(--space-8) var(--space-12);
	}

	h1 {
		font-size: var(--text-title);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-tight);
		line-height: var(--leading-tight);
	}

	.subtitle {
		margin-block-start: var(--space-2);
		font-size: var(--text-subtitle);
		font-weight: var(--font-weight-semibold);
		letter-spacing: var(--tracking-tight);
	}
</style>
