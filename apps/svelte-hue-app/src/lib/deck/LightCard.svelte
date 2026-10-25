<script lang="ts">
	import { xyToHex } from 'hue-app';
	import type { SvelteLight } from 'hue-app/svelte';
	import { findPaletteColor } from 'design-system';
	import ControlCard from './ControlCard.svelte';

	interface Props {
		light: SvelteLight;
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
	}

	let { light, ontoggle, ondim, oneditcolor }: Props = $props();

	const paletteColor = $derived(findPaletteColor(light.color));
	const colorName = $derived(paletteColor?.name ?? 'Custom');
	const swatch = $derived(
		light.color === null ? null : (paletteColor?.hex ?? xyToHex(light.color))
	);
	const colors = $derived(swatch ? [swatch] : []);
</script>

<ControlCard
	name={light.name}
	isOn={light.isOn}
	brightness={light.brightness}
	{colors}
	{swatch}
	{colorName}
	showBar="color"
	{ontoggle}
	{ondim}
	{oneditcolor}
/>
