<script lang="ts">
	import type { XyColor } from 'hue-app';
	import type { SvelteArea } from 'hue-app/svelte';
	import AreaCard from './AreaCard.svelte';
	import ColorDialog from './ColorDialog.svelte';

	interface Props {
		areas: readonly SvelteArea[];
		ontoggle: (id: string) => void;
		ondim: (id: string, brightness: number) => void;
		onchangecolor: (id: string, color: XyColor) => void;
	}

	let { areas, ontoggle, ondim, onchangecolor }: Props = $props();

	let editingId = $state<string | null>(null);

	const editing = $derived(
		areas.find((area) => area.id === editingId && area.isOn && area.color !== null)
	);
</script>

<ul class="list">
	{#each areas as area (area.id)}
		<li>
			<AreaCard
				{area}
				ontoggle={() => ontoggle(area.id)}
				ondim={(brightness) => ondim(area.id, brightness)}
				oneditcolor={() => (editingId = area.id)}
			/>
		</li>
	{/each}
</ul>

<ColorDialog
	bind:open={
		() => editing !== undefined,
		(open) => {
			if (!open) {
				editingId = null;
			}
		}
	}
	lightName={editing?.name ?? ''}
	color={editing?.color ?? null}
	onchange={(color) => {
		if (editing) {
			onchangecolor(editing.id, color);
		}
	}}
/>

<style>
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--tile-min), 1fr));
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		min-width: 0;
	}
</style>
