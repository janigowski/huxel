<script lang="ts">
	interface Props {
		value: string;
		solid?: boolean;
	}

	let { value, solid = false }: Props = $props();
</script>

<span class={['chip', { solid }]}>{value}</span>

<style>
	.chip {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		min-width: var(--index-size);
		height: var(--index-size);
		padding-inline: var(--space-1);
		border: var(--rule) solid currentColor;
		background: transparent;
		font-family: var(--font-mono);
		font-size: var(--text-index);
		line-height: 1;
	}

	.solid {
		border-color: var(--mark-bg);
		background: var(--mark-bg);
		color: var(--mark-fg);
	}
</style>
