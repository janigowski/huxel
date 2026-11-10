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
		border-radius: var(--radius-4);
		box-shadow: inset 0 0 0 var(--border-width) rgb(0 0 0 / 0.28);
	}

	.small {
		width: var(--swatch-size-small);
		height: var(--swatch-size-small);
	}

	.large {
		width: 100%;
		aspect-ratio: 1;
		border-radius: var(--radius-8);
	}
</style>
