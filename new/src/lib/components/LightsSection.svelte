<script lang="ts">
	import { onMount } from 'svelte';
	import type { Lights } from '$lib/hue/lights.svelte';
	import LightGrid from './LightGrid.svelte';
	import Notice from './Notice.svelte';
	import SectionHeader from './SectionHeader.svelte';

	interface Props {
		lights: Lights;
	}

	let { lights }: Props = $props();

	onMount(() => {
		lights.load();
	});
</script>

<section>
	<SectionHeader title="All lights" active={lights.onCount} total={lights.items.length} />

	{#if lights.error}
		<Notice>{lights.error}</Notice>
	{/if}

	{#if lights.loading && lights.items.length === 0}
		<Notice tone="muted">Loading lights…</Notice>
	{:else}
		<LightGrid {lights} />
	{/if}
</section>
