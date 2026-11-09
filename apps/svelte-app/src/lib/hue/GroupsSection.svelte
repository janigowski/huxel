<script lang="ts">
	import AreaList from '$lib/deck/AreaList.svelte';
	import Notice from '$lib/deck/Notice.svelte';
	import SectionBar from '$lib/deck/SectionBar.svelte';
	import { describeError, type PresetId, type XyColor } from '@huxel/app';
	import type { SvelteArea } from '@huxel/app/svelte';

	interface Props {
		title: string;
		groups: readonly SvelteArea[];
		loading: boolean;
		ontoggle: (id: string) => Promise<void>;
		ondim: (id: string, brightness: number) => Promise<void>;
		onchangecolor: (id: string, color: XyColor) => Promise<void>;
		onapplypreset: (id: string, preset: PresetId) => Promise<void>;
	}

	let { title, groups, loading, ontoggle, ondim, onchangecolor, onapplypreset }: Props = $props();

	let commandError = $state<string | null>(null);

	const onCount = $derived(groups.filter((group) => group.isOn).length);
	const loadingLabel = $derived(`Loading ${title.toLowerCase()}…`);
	const emptyLabel = $derived(`No ${title.toLowerCase()}`);

	async function run(command: Promise<void>) {
		commandError = null;

		try {
			await command;
		} catch (caught) {
			commandError = describeError(caught);
		}
	}
</script>

<section class="group">
	<SectionBar {title} active={onCount} total={groups.length} />

	{#if commandError}
		<Notice>{commandError}</Notice>
	{/if}

	{#if loading && groups.length === 0}
		<Notice tone="muted">{loadingLabel}</Notice>
	{:else if groups.length === 0}
		<Notice tone="muted">{emptyLabel}</Notice>
	{:else}
		<AreaList
			areas={groups}
			ontoggle={(id) => run(ontoggle(id))}
			ondim={(id, brightness) => run(ondim(id, brightness))}
			onchangecolor={(id, color) => run(onchangecolor(id, color))}
			onapplypreset={(id, preset) => run(onapplypreset(id, preset))}
		/>
	{/if}
</section>

<style>
	.group {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}
</style>
