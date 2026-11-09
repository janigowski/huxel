<script lang="ts">
	import { areaPresets, mirekToHex, xyToHex, type PresetId } from '@huxel/app';
	import ColorSwatch from './ColorSwatch.svelte';

	interface Props {
		open?: boolean;
		name: string;
		preset: PresetId | null;
		temperature?: boolean;
		onchange: (preset: PresetId) => void;
	}

	let { open = $bindable(false), name, preset, temperature = false, onchange }: Props = $props();

	const id = $props.id();

	function syncOpen(dialog: HTMLDialogElement) {
		if (open && !dialog.open) {
			dialog.showModal();
			return;
		}

		if (!open && dialog.open) {
			dialog.close();
		}
	}
</script>

<dialog
	class="dialog"
	aria-labelledby="{id}-title"
	{@attach syncOpen}
	onclose={() => (open = false)}
>
	<header class="header">
		<div class="titles">
			<p class="kicker">Presets</p>
			<h2 id="{id}-title">{name}</h2>
		</div>
		<button class="close" type="button" aria-label="Close" onclick={() => (open = false)}>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M5 5l14 14M19 5L5 19"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="square"
				/>
			</svg>
		</button>
	</header>

	<fieldset class="options">
		<legend class="visually-hidden">Presets</legend>

		{#each areaPresets as entry (entry.id)}
			<label class="option">
				<input
					class="visually-hidden"
					type="radio"
					name="{id}-preset"
					value={entry.id}
					checked={entry.id === preset}
					onchange={() => onchange(entry.id)}
				/>
				<span class="block">
					<ColorSwatch
						hex={temperature ? mirekToHex(entry.mirek) : xyToHex(entry.color)}
						size="large"
					/>
					<svg class="check" viewBox="0 0 24 24" aria-hidden="true">
						<path
							d="M5 12l5 5 9-10"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="square"
						/>
					</svg>
				</span>
				<span class="name">{entry.name}</span>
			</label>
		{/each}
	</fieldset>
</dialog>

<style>
	.dialog {
		width: min(var(--dialog-width), calc(100vw - 2 * var(--space-4)));
		max-height: min(40rem, calc(100dvh - 2 * var(--space-4)));
		margin: auto;
		padding: var(--space-6);
		overflow: auto;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-12);
		background: var(--background-neutral-medium);
		box-shadow: var(--elevation-4);
		color: var(--foreground-neutral-primary);
	}

	.dialog::backdrop {
		background: var(--color-backdrop);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		margin-block-end: var(--space-6);
	}

	.titles {
		min-width: 0;
	}

	.kicker,
	h2 {
		margin: 0;
	}

	.kicker {
		color: var(--foreground-neutral-secondary);
		font-family: var(--font-mono);
		font-size: var(--font-size-body-2);
		letter-spacing: var(--tracking-label);
		line-height: var(--line-height-body-2);
		text-transform: uppercase;
	}

	h2 {
		font-size: var(--font-size-heading-3);
		font-weight: var(--font-weight-heading-3);
		letter-spacing: var(--tracking-heading-3);
		line-height: var(--line-height-heading-3);
	}

	.close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: var(--size-medium);
		height: var(--size-medium);
		padding: 0;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: transparent;
		color: var(--foreground-neutral-primary);
		cursor: pointer;
	}

	.close:hover {
		background: var(--background-neutral-strong);
	}

	.close svg {
		width: var(--icon-size);
		height: var(--icon-size);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		border: 0;
	}

	.option {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
		color: var(--foreground-neutral-primary);
		cursor: pointer;
	}

	.block {
		position: relative;
		display: block;
		border-radius: var(--radius-8);
	}

	.option:has(:checked) .block {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-1);
	}

	.option:has(:focus-visible) .block {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-2);
	}

	.name {
		font-size: var(--font-size-body-2);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-body-2);
	}

	.option:has(:checked) .name {
		color: var(--foreground-emphasis-primary);
	}

	.check {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		width: var(--icon-size);
		height: var(--icon-size);
		visibility: hidden;
		border-radius: var(--radius-full);
		background: var(--background-emphasis-strong);
		color: var(--foreground-emphasis-on-fill);
	}

	.option:has(:checked) .check {
		visibility: visible;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}
</style>
