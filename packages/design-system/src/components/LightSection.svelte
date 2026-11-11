<script lang="ts">
	import { describeError, type XyColor } from '@huxel/app';
	import type { SvelteLight } from '@huxel/app/svelte';
	import ColorPickerDialog from './ColorPickerDialog.svelte';
	import LightRow from './LightRow.svelte';
	import Notice from './Notice.svelte';
	import SectionHeader from './SectionHeader.svelte';

	interface Props {
		title: string;
		lights: readonly SvelteLight[];
		loading: boolean;
		ontoggle: (id: string) => Promise<void>;
		ondim: (id: string, brightness: number) => Promise<void>;
		onchangecolor: (id: string, color: XyColor) => Promise<void>;
		onchangetemperature: (id: string, mirek: number) => Promise<void>;
	}

	let { title, lights, loading, ontoggle, ondim, onchangecolor, onchangetemperature }: Props =
		$props();

	let commandError = $state<string | null>(null);
	let editingId = $state<string | null>(null);

	const onCount = $derived(lights.filter((light) => light.isOn).length);
	const loadingLabel = $derived(`Loading ${title.toLowerCase()}…`);
	const emptyLabel = $derived(`No ${title.toLowerCase()}`);
	const editing = $derived(
		lights.find(
			(light) =>
				light.id === editingId && light.isOn && (light.color !== null || light.temperature !== null)
		)
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
	<SectionHeader {title} active={onCount} total={lights.length} />

	{#if commandError}
		<Notice>{commandError}</Notice>
	{/if}

	{#if loading && lights.length === 0}
		<Notice tone="muted">{loadingLabel}</Notice>
	{:else if lights.length === 0}
		<Notice tone="muted">{emptyLabel}</Notice>
	{:else}
		<ul class="rows">
			{#each lights as light (light.id)}
				<li>
					<LightRow
						{light}
						ontoggle={() => run(ontoggle(light.id))}
						ondim={(brightness) => run(ondim(light.id, brightness))}
						oneditcolor={() => (editingId = light.id)}
					/>
				</li>
			{/each}
		</ul>
	{/if}

	<ColorPickerDialog
		bind:open={
			() => editing !== undefined,
			(next) => {
				if (!next) {
					editingId = null;
				}
			}
		}
		name={editing?.name ?? ''}
		color={editing?.color ?? null}
		temperature={editing?.temperature ?? null}
		brightness={editing?.brightness ?? null}
		gamut={editing?.gamut ?? null}
		mirekRange={editing?.mirekRange ?? null}
		oncolor={(color) => {
			if (editing) {
				void run(onchangecolor(editing.id, color));
			}
		}}
		ontemperature={(mirek) => {
			if (editing) {
				void run(onchangetemperature(editing.id, mirek));
			}
		}}
		onbrightness={(brightness) => {
			if (editing) {
				void run(ondim(editing.id, brightness));
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
