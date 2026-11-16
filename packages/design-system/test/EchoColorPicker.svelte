<script lang="ts">
	import { GAMUT_C, type XyColor } from '@huxel/app';
	import ColorPickerDialog from '../src/components/ColorPickerDialog.svelte';

	interface Props {
		color: XyColor;
		oncolor: (color: XyColor) => void;
	}

	let { color, oncolor }: Props = $props();
	let chosen = $state<XyColor | undefined>();
	const shown = $derived(chosen ?? color);

	function change(next: XyColor) {
		chosen = next;
		oncolor(next);
	}
</script>

<ColorPickerDialog
	open
	name="Desk"
	color={shown}
	temperature={{ mirek: null }}
	brightness={80}
	gamut={GAMUT_C}
	mirekRange={{ minimum: 153, maximum: 500 }}
	oncolor={change}
	ontemperature={() => {}}
	onbrightness={() => {}}
/>
