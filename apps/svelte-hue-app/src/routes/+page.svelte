<script lang="ts">
	import Board from '$lib/deck/Board.svelte';
	import ConnectPanel from '$lib/deck/ConnectPanel.svelte';
	import Stage from '$lib/deck/Stage.svelte';
	import { hueConnection } from '$lib/hue/connection-data';
	import { BridgeConnection } from '$lib/hue/connection.svelte';
	import GroupsSection from '$lib/hue/GroupsSection.svelte';
	import LightsField from '$lib/hue/LightsField.svelte';
	import { createSvelteHueApp } from 'hue-app/svelte';
	import { untrack } from 'svelte';

	const connection = new BridgeConnection(localStorage);
	const hue = $derived(connection.app ? createSvelteHueApp(connection.app) : null);
	const onCount = $derived(hue ? hue.lights.all.filter((light) => light.isOn).length : null);
	const total = $derived(hue ? hue.lights.all.length : null);
	const roomCount = $derived(hue?.rooms.all.length);
	const zoneCount = $derived(hue?.zones.all.length);
	const loading = $derived(hue?.status === 'idle' || hue?.status === 'loading');

	$effect(() => {
		hueConnection.value = hue?.connection ?? null;
	});

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
	<title>Hue Remote</title>
</svelte:head>

<Stage {onCount} {total} rooms={roomCount} zones={zoneCount}>
	{#if hue}
		<Board>
			{#snippet lanes()}
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
			{/snippet}
			{#snippet sources()}
				<LightsField {hue} />
			{/snippet}
		</Board>
	{:else}
		<ConnectPanel
			connecting={connection.connecting}
			error={connection.error}
			onconnect={() => connection.connect()}
		/>
	{/if}
</Stage>
