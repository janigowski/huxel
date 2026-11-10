<script lang="ts">
	import { describeError, type XyColor } from '@huxel/app';
	import type { SvelteArea } from '@huxel/app/svelte';
	import AreaRow from './AreaRow.svelte';
	import ColorDialog from './ColorDialog.svelte';
	import Notice from './Notice.svelte';
	import SectionHeader from './SectionHeader.svelte';

	interface Props {
		title: string;
		areas: readonly SvelteArea[];
		loading: boolean;
		ontoggle: (id: string) => Promise<void>;
		ondim: (id: string, brightness: number) => Promise<void>;
		onchangecolor: (id: string, color: XyColor) => Promise<void>;
	}

	let { title, areas, loading, ontoggle, ondim, onchangecolor }: Props = $props();

	let commandError = $state<string | null>(null);
	let editingId = $state<string | null>(null);

	const onCount = $derived(areas.filter((area) => area.isOn).length);
	const loadingLabel = $derived(`Loading ${title.toLowerCase()}…`);
	const emptyLabel = $derived(`No ${title.toLowerCase()}`);
	const editing = $derived(
		areas.find((area) => area.id === editingId && area.isOn && area.color !== null)
	);

	async function run(command: Promise<void>) {
		commandError = null;

		try {
			await command;
		} catch (caught) {
			commandError = describeError(caught);
		}
	}
</script>

<section>
	<SectionHeader {title} active={onCount} total={areas.length} />

	{#if commandError}
		<Notice>{commandError}</Notice>
	{/if}

	{#if loading && areas.length === 0}
		<Notice tone="muted">{loadingLabel}</Notice>
	{:else if areas.length === 0}
		<Notice tone="muted">{emptyLabel}</Notice>
	{:else}
		<ul class="rows">
			{#each areas as area (area.id)}
				<li>
					<AreaRow
						{area}
						ontoggle={() => run(ontoggle(area.id))}
						ondim={(brightness) => run(ondim(area.id, brightness))}
						oneditcolor={() => (editingId = area.id)}
					/>
				</li>
			{/each}
		</ul>
	{/if}

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
				void run(onchangecolor(editing.id, color));
			}
		}}
	/>
</section>

<style>
	.rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		min-width: 0;
	}
</style>
