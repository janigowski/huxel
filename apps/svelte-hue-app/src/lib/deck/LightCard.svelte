<script lang="ts">
	import { findAreaPreset, xyToHex } from '@huxel/app';
	import type { SvelteLight } from '@huxel/app/svelte';
	import { findPaletteColor } from 'design-system';
	import ControlCard from './ControlCard.svelte';

	interface Props {
		light: SvelteLight;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
		oneditpresets?: () => void;
	}

	let { light, ontoggle, ondim, oneditcolor, oneditpresets }: Props = $props();

	const paletteColor = $derived(findPaletteColor(light.color));
	const colorName = $derived(paletteColor?.name ?? 'Custom');
	const swatch = $derived(
		light.color === null ? null : (paletteColor?.hex ?? xyToHex(light.color))
	);
	const colors = $derived(swatch ? [swatch] : light.colors);
	const temperatureOnly = $derived(light.color === null && light.temperature !== null);
	const presetName = $derived(
		temperatureOnly
			? (findAreaPreset(null, light.brightness, light.temperature?.mirek ?? null)?.name ?? 'Custom')
			: undefined
	);
</script>

<ControlCard
	name={light.name}
	isOn={light.isOn}
	brightness={light.brightness}
	{colors}
	{swatch}
	{colorName}
	{presetName}
	showBar="color"
	{ontoggle}
	{ondim}
	{oneditcolor}
	{oneditpresets}
/>
