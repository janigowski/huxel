<script lang="ts">
	import { areaPresets, xyToHex, type PresetId } from 'hue-app';
	import ColorSwatch from './ColorSwatch.svelte';

	interface Props {
		open?: boolean;
		name: string;
		preset: PresetId | null;
		onchange: (preset: PresetId) => void;
	}

	let { open = $bindable(false), name, preset, onchange }: Props = $props();

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
					<ColorSwatch hex={xyToHex(entry.color)} size="large" />
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
		margin: auto;
		padding: var(--space-4);
		border: var(--rule) solid var(--color-line);
		background: var(--color-background);
		color: var(--color-paper);
	}

	.dialog::backdrop {
		background: var(--color-backdrop);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-3);
		margin-block-end: var(--space-4);
	}

	.titles {
		min-width: 0;
	}

	.kicker,
	h2 {
		margin: 0;
	}

	.kicker {
		color: var(--color-mute);
		font-size: var(--text-label);
		line-height: 1.3;
	}

	h2 {
		font-family: var(--font-display);
		font-size: var(--text-name);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-title);
		line-height: 1.2;
	}

	.close {
		--focus: var(--color-paper);
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: var(--control-size);
		height: var(--control-size);
		padding: 0;
		border: var(--rule) solid var(--color-line);
		background: transparent;
		color: var(--color-paper);
		cursor: pointer;
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
		color: var(--color-paper);
		cursor: pointer;
	}

	.block {
		position: relative;
		display: block;
	}

	.option:has(:checked) .block {
		outline: var(--rule-strong) solid var(--color-paper);
		outline-offset: var(--space-1);
	}

	.option:has(:focus-visible) .block {
		outline: var(--rule) solid var(--color-paper);
		outline-offset: var(--space-2);
	}

	.name {
		font-size: var(--text-label);
		font-weight: var(--font-weight-bold);
		line-height: 1.25;
	}

	.check {
		position: absolute;
		top: var(--space-1);
		right: var(--space-1);
		width: var(--space-4);
		height: var(--space-4);
		visibility: hidden;
		background: var(--color-ink);
		color: var(--color-paper);
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
