<script lang="ts">
	import { LightGrid, Notice, SectionHeader } from 'design-system';
	import { describeError, type XyColor } from 'hue-app';
	import type { SvelteArea } from 'hue-app/svelte';

	interface Props {
		title: string;
		groups: readonly SvelteArea[];
		loading: boolean;
		ontoggle: (id: string) => Promise<void>;
		ondim: (id: string, brightness: number) => Promise<void>;
		onchangecolor: (id: string, color: XyColor) => Promise<void>;
	}

	let { title, groups, loading, ontoggle, ondim, onchangecolor }: Props = $props();

	let commandError = $state<string | null>(null);

	const onCount = $derived(groups.filter((group) => group.isOn).length);
	const loadingLabel = $derived(`Loading ${title.toLowerCase()}…`);

	async function run(command: Promise<void>) {
		commandError = null;

		try {
			await command;
		} catch (error) {
			commandError = describeError(error);
		}
	}
</script>

<section class="groups">
	<SectionHeader {title} active={onCount} total={groups.length} />

	{#if commandError}
		<Notice>{commandError}</Notice>
	{/if}

	{#if loading && groups.length === 0}
		<Notice tone="muted">{loadingLabel}</Notice>
	{:else}
		<LightGrid
			lights={groups}
			ontoggle={(id) => run(ontoggle(id))}
			ondim={(id, brightness) => run(ondim(id, brightness))}
			onchangecolor={(id, color) => run(onchangecolor(id, color))}
		/>
	{/if}
</section>

<style>
	.groups {
		margin-block-start: var(--space-12);
	}
</style>
