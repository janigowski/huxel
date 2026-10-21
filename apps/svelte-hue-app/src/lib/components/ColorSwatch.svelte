<script lang="ts">
	interface Props {
		hex: string;
		size?: 'small' | 'large';
	}

	let { hex, size = 'small' }: Props = $props();
</script>

<span class="swatch {size}" style:background={hex} aria-hidden="true"></span>

<style>
	.swatch {
		display: block;
		flex-shrink: 0;
		border: var(--rule-thin) solid currentColor;
	}

	.small {
		width: var(--swatch-size-small);
		height: var(--swatch-size-small);
	}

	.large {
		width: 100%;
		aspect-ratio: 1;
	}
</style>
