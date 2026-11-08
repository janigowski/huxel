<script lang="ts">
	import type { XyColor } from '@huxel/app';
	import { findPaletteColor, palette } from '../palette';
	import ColorSwatch from './ColorSwatch.svelte';
	import Label from './Label.svelte';

	interface Props {
		open?: boolean;
		lightName: string;
		color: XyColor | null;
		onchange: (color: XyColor) => void;
	}

	let { open = $bindable(false), lightName, color, onchange }: Props = $props();

	const id = $props.id();
	const selected = $derived(findPaletteColor(color));

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
		<h2 id="{id}-title">{lightName} color</h2>
		<button class="close" type="button" aria-label="Close" onclick={() => (open = false)}>
			<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
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
		<legend class="visually-hidden">Color</legend>

		{#each palette as entry (entry.name)}
			<label class="option">
				<input
					class="visually-hidden"
					type="radio"
					name="{id}-color"
					value={entry.name}
					checked={entry === selected}
					onchange={() => onchange(entry.xy)}
				/>
				<span class="block">
					<ColorSwatch hex={entry.hex} size="large" />
					<svg class="check" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M5 12l5 5 9-10"
							fill="none"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="square"
						/>
					</svg>
				</span>
				<Label>{entry.name}</Label>
			</label>
		{/each}
	</fieldset>
</dialog>

<style>
	.dialog {
		width: min(var(--dialog-width), calc(100vw - 2 * var(--space-4)));
		margin: auto;
		padding: var(--space-4);
		border: var(--rule-thin) solid var(--color-orange);
		background: var(--color-background);
		color: var(--color-mint);
	}

	.dialog::backdrop {
		background: var(--color-backdrop);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-block-end: var(--space-3);
		margin-block-end: var(--space-4);
		border-block-end: var(--rule-thin) solid var(--color-orange);
	}

	h2 {
		color: var(--color-orange);
		font-weight: var(--font-weight-semibold);
	}

	.close {
		display: grid;
		place-items: center;
		width: var(--icon-tile-size);
		height: var(--icon-tile-size);
		padding: 0;
		border: var(--rule-thin) solid var(--color-orange);
		background: none;
		color: var(--color-orange);
		cursor: pointer;
	}

	.close:focus-visible {
		outline: var(--rule-thin) solid var(--color-mint);
		outline-offset: var(--rule-thin);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		border: none;
	}

	.option {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		color: var(--color-mint);
		cursor: pointer;
	}

	.option:has(:checked) {
		color: var(--color-orange);
	}

	.block {
		position: relative;
		display: block;
		outline-offset: var(--rule-thin);
	}

	.option:has(:checked) .block {
		outline: var(--rule-thick) solid var(--color-orange);
		outline-offset: 0;
	}

	.option:has(:focus-visible) .block {
		outline: var(--rule-thin) solid var(--color-mint);
		outline-offset: var(--rule-thick);
	}

	.option:has(:checked:focus-visible) .block {
		outline: var(--rule-thick) solid var(--color-mint);
		outline-offset: 0;
	}

	.check {
		position: absolute;
		inset-block-start: var(--space-1);
		inset-inline-end: var(--space-1);
		visibility: hidden;
		padding: 2px;
		background: var(--color-ink);
		color: var(--color-mint);
		box-sizing: content-box;
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
