<script lang="ts">
	import { createSvelteHueApp } from '@huxel/app/svelte';
	import Home from '$lib/deck/Home.svelte';
	import { bridge } from '$lib/hue/bridge';
	import { BridgeConnection } from '$lib/hue/connection.svelte';

	const connection = new BridgeConnection(localStorage);
	const hue = $derived(connection.app ? createSvelteHueApp(connection.app) : null);
</script>

<Home
	{hue}
	bridgeId={bridge.id}
	connecting={connection.connecting}
	error={connection.error}
	onconnect={() => connection.connect()}
/>
