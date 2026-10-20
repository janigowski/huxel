<script lang="ts">
	import ConnectPanel from '$lib/components/ConnectPanel.svelte';
	import DashboardBar from '$lib/components/DashboardBar.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import LightsSection from '$lib/components/LightsSection.svelte';
	import { bridge } from '$lib/hue/bridge';
	import { BridgeConnection } from '$lib/hue/connection.svelte';
	import { createSvelteHueApp } from 'hue-app/svelte';
	import { untrack } from 'svelte';

	const connection = new BridgeConnection();
	const hue = $derived(connection.app ? createSvelteHueApp(connection.app) : null);

	$effect(() => {
		const app = hue;
		if (!app) return;
		untrack(() => {
			app.initialize().catch(() => {});
		});
		return () => app.dispose();
	});
</script>

<svelte:head>
	<title>Hue Remote</title>
</svelte:head>

<main class="page">
	<DashboardBar label="Hue control dashboard" date={new Date()} connection={hue?.connection} />
	<Hero title="Home Lights" subtitle="Bridge {bridge.id}" />

	{#if hue}
		<LightsSection {hue} />
	{:else}
		<ConnectPanel {connection} />
	{/if}
</main>

<style>
	.page {
		max-width: var(--page-width);
		margin-inline: auto;
		padding: var(--space-8) var(--page-gutter) var(--space-16);
	}
</style>
