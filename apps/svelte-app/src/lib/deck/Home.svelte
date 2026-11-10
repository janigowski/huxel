<script lang="ts">
	import { createSvelteHueApp } from '@huxel/app/svelte';
	import type { SvelteHueApp } from '@huxel/app/svelte';
	import { untrack } from 'svelte';
	import GroupsSection from '$lib/hue/GroupsSection.svelte';
	import ConnectPanel from './ConnectPanel.svelte';
	import Stage from './Stage.svelte';

	interface Props {
		hue: SvelteHueApp | null;
		bridgeId: string;
		connecting?: boolean;
		error?: string | null;
		preview?: boolean;
		onconnect?: () => void;
	}

	let {
		hue,
		bridgeId,
		connecting = false,
		error = null,
		preview = false,
		onconnect = () => {}
	}: Props = $props();

	const roomCount = $derived(hue?.rooms.all.length);
	const zoneCount = $derived(hue?.zones.all.length);
	const loading = $derived(hue?.status === 'idle' || hue?.status === 'loading');
	const linked = $derived(hue !== null);

	$effect(() => {
		const app = hue;

		if (!app) {
			return;
		}

		untrack(() => {
			app.initialize().catch(() => {});
		});

		return () => app.dispose();
	});
</script>

<svelte:head>
	<title>huxel//app</title>
</svelte:head>

<Stage
	{bridgeId}
	connection={hue?.connection}
	{preview}
	title={preview ? 'Sample home' : 'Home'}
	detail={linked ? '' : 'Link the Hue bridge on this network.'}
	note={preview ? 'Nothing here leaves the browser.' : undefined}
	{linked}
	rooms={roomCount}
	zones={zoneCount}
>
	{#if hue}
		<div class="home" id="rooms">
			<GroupsSection
				title="Rooms"
				groups={hue.rooms.all}
				{loading}
				ontoggle={(id) => hue.toggleRoom(id)}
				ondim={(id, brightness) => hue.dimRoom(id, brightness)}
				onchangecolor={(id, color) => hue.changeRoomColor(id, color)}
				onapplypreset={(id, preset) => hue.applyRoomPreset(id, preset)}
			/>
			<GroupsSection
				title="Zones"
				groups={hue.zones.all}
				{loading}
				ontoggle={(id) => hue.toggleZone(id)}
				ondim={(id, brightness) => hue.dimZone(id, brightness)}
				onchangecolor={(id, color) => hue.changeZoneColor(id, color)}
				onapplypreset={(id, preset) => hue.applyZonePreset(id, preset)}
			/>
		</div>
	{:else}
		<ConnectPanel {connecting} {error} {onconnect} />
	{/if}
</Stage>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		min-width: 0;
	}
</style>
