<script lang="ts">
	import { findAreaPreset, type PresetId, type XyColor } from '@huxel/app';
	import type { SvelteLight } from '@huxel/app/svelte';
	import ColorDialog from './ColorDialog.svelte';
	import LightCard from './LightCard.svelte';
	import ZoneRoomView from './ZoneRoomView.svelte';

	interface Props {
		lights: readonly SvelteLight[];
		ontoggle: (id: string) => void;
		ondim: (id: string, brightness: number) => void;
		onchangecolor: (id: string, color: XyColor) => void;
		onapplypreset: (id: string, preset: PresetId) => void;
	}

	let { lights, ontoggle, ondim, onchangecolor, onapplypreset }: Props = $props();

	let editingId = $state<string | null>(null);
	let presetId = $state<string | null>(null);

	const editing = $derived(
		lights.find((light) => light.id === editingId && light.isOn && light.color !== null)
	);
	const editingPreset = $derived(
		lights.find(
			(light) =>
				light.id === presetId && light.isOn && light.color === null && light.temperature !== null
		)
	);
	const selectedPreset = $derived(
		editingPreset
			? (findAreaPreset(null, editingPreset.brightness, editingPreset.temperature?.mirek ?? null)
					?.id ?? null)
			: null
	);
</script>

<ul class="grid">
	{#each lights as light (light.id)}
		<li>
			<LightCard
				{light}
				ontoggle={() => ontoggle(light.id)}
				ondim={(brightness) => ondim(light.id, brightness)}
				oneditcolor={() => (editingId = light.id)}
				oneditpresets={() => (presetId = light.id)}
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
	temperature
	onchange={(preset) => {
		if (editingPreset) {
			onapplypreset(editingPreset.id, preset);
		}
	}}
/>

<style>
	.grid {
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
