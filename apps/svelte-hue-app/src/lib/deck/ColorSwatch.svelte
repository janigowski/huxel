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
		border: var(--rule) solid currentColor;
	}

	.small {
		width: 1.25rem;
		height: 1.25rem;
	}

	.large {
		width: 100%;
		aspect-ratio: 1;
	}
</style>
