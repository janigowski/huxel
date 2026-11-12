<script lang="ts">
	import { hexToXy, type XyColor } from '@huxel/app';
	import type { SvelteArea } from '@huxel/app/svelte';
	import { ColorPickerDialog } from '@huxel/design-system';
	import AreaCard from './AreaCard.svelte';
	import { areaCanColor, areaCanTemperature } from './color-capability';

	interface Props {
		areas: readonly SvelteArea[];
		ontoggle: (id: string) => void;
		ondim: (id: string, brightness: number) => void;
		onchangecolor: (id: string, color: XyColor) => void;
		onchangetemperature: (id: string, mirek: number) => void;
	}

	let { areas, ontoggle, ondim, onchangecolor, onchangetemperature }: Props = $props();

	let editingId = $state<string | null>(null);

	const editing = $derived(areas.find((area) => area.id === editingId && area.isOn));
	const pickerColor = $derived.by((): XyColor | null => {
		if (!editing) {
			return null;
		}

		if (editing.color) {
			return editing.color;
		}

		if (editing.temperature?.mirek != null) {
			return null;
		}

		const hex = editing.colors[0];

		return hex ? hexToXy(hex) : null;
	});
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

<ColorPickerDialog
	bind:open={
		() => editing !== undefined,
		(open) => {
			if (!open) {
				editingId = null;
			}
		}
	}
	name={editing?.name ?? ''}
	color={pickerColor}
	temperature={editing?.temperature ?? null}
	brightness={editing?.brightness ?? null}
	supportsColor={editing ? areaCanColor(editing) : false}
	supportsTemperature={editing ? areaCanTemperature(editing) : false}
	oncolor={(color) => {
		if (editing) {
			onchangecolor(editing.id, color);
		}
	}}
	ontemperature={(mirek) => {
		if (editing) {
			onchangetemperature(editing.id, mirek);
		}
	}}
	onbrightness={(brightness) => {
		if (editing) {
			ondim(editing.id, brightness);
		}
	}}
/>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		min-width: 0;
	}
</style>
