<script lang="ts">
	import type { SvelteLight } from 'hue-app/svelte';
	import LightCard from './LightCard.svelte';

	interface Props {
		lights: readonly SvelteLight[];
		ontoggle: (lightId: string) => void;
		ondim: (lightId: string, brightness: number) => void;
	}

	let { lights, ontoggle, ondim }: Props = $props();
</script>

<ul class="grid">
	{#each lights as light, index (light.id)}
		<li>
			<LightCard
				{light}
				{index}
				ontoggle={() => ontoggle(light.id)}
				ondim={(brightness) => ondim(light.id, brightness)}
			/>
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
