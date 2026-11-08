<script lang="ts">
	interface Props {
		colors: readonly string[];
		opacity: number;
	}

	let { colors, opacity }: Props = $props();

	const empty = $derived(colors.length === 0);
	const stops = $derived(empty ? 'transparent' : colors.join(', '));
</script>

<div
	class={['bar', { empty }]}
	style:--stops={stops}
	style:opacity
	data-gradient=""
	aria-hidden="true"
></div>

<style>
	.bar {
		flex: 0 0 var(--gradient-height);
		width: 100%;
		height: var(--gradient-height);
		background-image: linear-gradient(to right, var(--stops));
		background-repeat: no-repeat;
	}

	.empty {
		background-image: var(--hatch);
	}
</style>
