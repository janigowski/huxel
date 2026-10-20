<script lang="ts">
	import type { Lights } from '$lib/hue/lights.svelte';
	import LightCard from './LightCard.svelte';

	interface Props {
		lights: Lights;
	}

	let { lights }: Props = $props();
</script>

<ul class="grid">
	{#each lights.items as light, index (light.id)}
		<li>
			<LightCard {light} {index} ontoggle={() => lights.toggle(light)} />
		</li>
	{/each}
</ul>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--tile-min-width), 1fr));
		gap: var(--space-2);
	}
</style>
