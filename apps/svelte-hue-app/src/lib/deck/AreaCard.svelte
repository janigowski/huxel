<script lang="ts">
	import { xyToHex } from 'hue-app';
	import type { SvelteArea } from 'hue-app/svelte';
	import { findPaletteColor } from 'design-system';
	import ControlCard from './ControlCard.svelte';

	interface Props {
		area: SvelteArea;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
	}

	let { area, ontoggle, ondim, oneditcolor }: Props = $props();

	const paletteColor = $derived(findPaletteColor(area.color));
	const colorName = $derived(paletteColor?.name ?? 'Custom');
	const swatch = $derived(area.color === null ? null : (paletteColor?.hex ?? xyToHex(area.color)));
</script>

<ControlCard
	name={area.name}
	isOn={area.isOn}
	brightness={area.brightness}
	colors={area.colors}
	{swatch}
	{colorName}
	showBar="always"
	{ontoggle}
	{ondim}
	{oneditcolor}
/>
