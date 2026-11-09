<script lang="ts">
	interface Props {
		hex: string;
		size?: 'small' | 'large';
	}

	let { hex, size = 'small' }: Props = $props();
</script>

<span class={['swatch', size]} style:background={hex} aria-hidden="true"></span>

<style>
	.swatch {
		display: block;
		flex-shrink: 0;
		box-shadow: inset 0 0 0 var(--border-width) rgb(0 0 0 / 0.28);
	}

	.small {
		width: var(--size-xsmall);
		height: var(--size-xsmall);
		border-radius: var(--radius-4);
	}

	.large {
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: var(--radius-8);
	}
</style>
