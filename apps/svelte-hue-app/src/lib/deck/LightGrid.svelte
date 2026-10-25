<script lang="ts">
	import type { XyColor } from 'hue-app';
	import type { SvelteLight } from 'hue-app/svelte';
	import ColorDialog from './ColorDialog.svelte';
	import LightCard from './LightCard.svelte';

	interface Props {
		lights: readonly SvelteLight[];
		ontoggle: (id: string) => void;
		ondim: (id: string, brightness: number) => void;
		onchangecolor: (id: string, color: XyColor) => void;
	}

	let { lights, ontoggle, ondim, onchangecolor }: Props = $props();

	let editingId = $state<string | null>(null);

	const editing = $derived(
		lights.find((light) => light.id === editingId && light.isOn && light.color !== null)
	);
</script>

<ul class="grid">
	{#each lights as light (light.id)}
		<li>
			<LightCard
				{light}
				ontoggle={() => ontoggle(light.id)}
				ondim={(brightness) => ondim(light.id, brightness)}
				oneditcolor={() => (editingId = light.id)}
			/>
		</li>
	{/each}
</ul>

<ColorDialog
	bind:open={
		() => editing !== undefined,
		(open) => {
			if (!open) {
				editingId = null;
			}
		}
	}
	lightName={editing?.name ?? ''}
	color={editing?.color ?? null}
	onchange={(color) => {
		if (editing) {
			onchangecolor(editing.id, color);
		}
	}}
/>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(var(--tile-min), 1fr));
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		min-width: 0;
	}
</style>
