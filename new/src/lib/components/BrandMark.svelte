<script lang="ts">
	import HexIcon from './icons/HexIcon.svelte';

	interface Props {
		name: string;
	}

	let { name }: Props = $props();
</script>

<span class="brand">
	<HexIcon />
	<span class="divider" aria-hidden="true"></span>
	<span class="name">{name}</span>
</span>

<style>
	.brand {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
	}

	.divider {
		width: var(--rule-thin);
		height: var(--space-6);
		background: currentColor;
	}

	.name {
		font-size: var(--text-subtitle);
		font-weight: var(--font-weight-medium);
		letter-spacing: var(--tracking-label);
	}
</style>
