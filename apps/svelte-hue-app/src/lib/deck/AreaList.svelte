<script lang="ts">
	import { findAreaPreset, type PresetId, type XyColor } from 'hue-app';
	import type { SvelteArea } from 'hue-app/svelte';
	import AreaCard from './AreaCard.svelte';
	import ColorDialog from './ColorDialog.svelte';
	import ZoneRoomView from './ZoneRoomView.svelte';

	interface Props {
		areas: readonly SvelteArea[];
		ontoggle: (id: string) => void;
		ondim: (id: string, brightness: number) => void;
		onchangecolor: (id: string, color: XyColor) => void;
		onapplypreset: (id: string, preset: PresetId) => void;
	}

	let { areas, ontoggle, ondim, onchangecolor, onapplypreset }: Props = $props();

	let editingId = $state<string | null>(null);
	let presetId = $state<string | null>(null);

	const editing = $derived(
		areas.find((area) => area.id === editingId && area.isOn && area.color !== null)
	);
	const editingPreset = $derived(areas.find((area) => area.id === presetId && area.isOn));
	const temperatureOnly = $derived(
		editingPreset !== undefined &&
			editingPreset.color === null &&
			editingPreset.temperature !== null
	);
	const selectedPreset = $derived(
		editingPreset
			? (findAreaPreset(
					editingPreset.color,
					editingPreset.brightness,
					editingPreset.temperature?.mirek ?? null
				)?.id ?? null)
			: null
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
				oneditpresets={() => (presetId = area.id)}
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

<ZoneRoomView
	bind:open={
		() => editingPreset !== undefined,
		(open) => {
			if (!open) {
				presetId = null;
			}
		}
	}
	name={editingPreset?.name ?? ''}
	preset={selectedPreset}
	temperature={temperatureOnly}
	onchange={(preset) => {
		if (editingPreset) {
			onapplypreset(editingPreset.id, preset);
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
