<script lang="ts">
	import LightGrid from '$lib/deck/LightGrid.svelte';
	import Notice from '$lib/deck/Notice.svelte';
	import SectionBar from '$lib/deck/SectionBar.svelte';
	import { describeError, type PresetId, type XyColor } from 'hue-app';
	import type { SvelteHueApp } from 'hue-app/svelte';

	interface Props {
		hue: SvelteHueApp;
	}

	let { hue }: Props = $props();

	let commandError = $state<string | null>(null);

	const lights = $derived([...hue.lights.all].sort((a, b) => a.name.localeCompare(b.name)));
	const onCount = $derived(lights.filter((light) => light.isOn).length);
	const loading = $derived(hue.status === 'idle' || hue.status === 'loading');
	const error = $derived(
		commandError ?? (hue.status === 'error' ? describeError(hue.error) : null)
	);

	async function run(command: Promise<void>) {
		commandError = null;

		try {
			await command;
		} catch (caught) {
			commandError = describeError(caught);
		}
	}

	function toggle(lightId: string) {
		return run(hue.toggleLight(lightId));
	}

	function dim(lightId: string, brightness: number) {
		return run(hue.dimLight(lightId, brightness));
	}

	function changeColor(lightId: string, color: XyColor) {
		return run(hue.changeColor(lightId, color));
	}

	function applyPreset(lightId: string, preset: PresetId) {
		return run(hue.applyLightPreset(lightId, preset));
	}
</script>

<section class="field">
	<SectionBar title="Lights" active={onCount} total={lights.length} />

	{#if error}
		<Notice>{error}</Notice>
	{/if}

	{#if loading && lights.length === 0}
		<Notice tone="muted">Loading lights…</Notice>
	{:else if lights.length === 0}
		<Notice tone="muted">No lights</Notice>
	{:else}
		<LightGrid
			{lights}
			ontoggle={toggle}
			ondim={dim}
			onchangecolor={changeColor}
			onapplypreset={applyPreset}
		/>
	{/if}
</section>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}
</style>
