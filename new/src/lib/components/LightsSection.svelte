<script lang="ts">
	import { untrack } from 'svelte';
	import type { SvelteHueApp } from 'hue-app/svelte';
	import { describeError } from '$lib/hue/bridge';
	import LightGrid from './LightGrid.svelte';
	import Notice from './Notice.svelte';
	import SectionHeader from './SectionHeader.svelte';

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

	$effect(() => {
		const app = hue;
		untrack(() => {
			app.initialize().catch(() => {});
		});
		return () => app.dispose();
	});

	async function run(command: Promise<void>) {
		commandError = null;
		try {
			await command;
		} catch (error) {
			commandError = describeError(error);
		}
	}

	function toggle(lightId: string) {
		return run(hue.toggleLight(lightId));
	}

	function dim(lightId: string, brightness: number) {
		return run(hue.dimLight(lightId, brightness));
	}
</script>

<section>
	<SectionHeader title="All lights" active={onCount} total={lights.length} />

	{#if error}
		<Notice>{error}</Notice>
	{/if}

	{#if loading && lights.length === 0}
		<Notice tone="muted">Loading lights…</Notice>
	{:else}
		<LightGrid {lights} ontoggle={toggle} ondim={dim} />
	{/if}
</section>
