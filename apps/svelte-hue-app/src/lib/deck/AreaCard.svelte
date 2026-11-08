<script lang="ts">
	import { findAreaPreset, xyToHex } from '@huxel/app';
	import type { SvelteArea } from '@huxel/app/svelte';
	import { findPaletteColor } from 'design-system';
	import ControlCard from './ControlCard.svelte';

	interface Props {
		area: SvelteArea;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
		oneditpresets: () => void;
	}

	let { area, ontoggle, ondim, oneditcolor, oneditpresets }: Props = $props();

	const paletteColor = $derived(findPaletteColor(area.color));
	const colorName = $derived(paletteColor?.name ?? 'Custom');
	const swatch = $derived(area.color === null ? null : (paletteColor?.hex ?? xyToHex(area.color)));
	const presetName = $derived(
		findAreaPreset(area.color, area.brightness, area.temperature?.mirek ?? null)?.name ?? 'Custom'
	);
</script>

<ControlCard
	name={area.name}
	isOn={area.isOn}
	brightness={area.brightness}
	colors={area.colors}
	{swatch}
	{colorName}
	{presetName}
	showBar="always"
	{ontoggle}
	{ondim}
	{oneditcolor}
	{oneditpresets}
/>
