<script lang="ts">
	import { mirekToHex, xyToHex } from '@huxel/app';
	import type { SvelteArea } from '@huxel/app/svelte';
	import { findPaletteColor } from '@huxel/design-system';
	import { areaCanColor, areaCanTemperature } from './color-capability';
	import ControlCard from './ControlCard.svelte';

	interface Props {
		area: SvelteArea;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
	}

	let { area, ontoggle, ondim, oneditcolor }: Props = $props();

	const canPick = $derived(areaCanColor(area) || areaCanTemperature(area));
	const paletteColor = $derived(findPaletteColor(area.color));
	const colorName = $derived(
		area.color
			? (paletteColor?.name ?? 'Custom')
			: area.temperature?.mirek != null
				? 'White'
				: 'Custom'
	);
	const swatch = $derived(
		!canPick
			? null
			: area.color
				? (paletteColor?.hex ?? xyToHex(area.color))
				: area.temperature?.mirek != null
					? mirekToHex(area.temperature.mirek)
					: (area.colors[0] ?? '#fff4e0')
	);
</script>

<ControlCard
	name={area.name}
	isOn={area.isOn}
	brightness={area.brightness}
	colors={area.colors}
	{swatch}
	{colorName}
	showBar="always"
	singleRow
	{ontoggle}
	{ondim}
	{oneditcolor}
/>
