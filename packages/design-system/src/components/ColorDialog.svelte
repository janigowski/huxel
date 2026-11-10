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
		max-height: min(40rem, calc(100dvh - 2 * var(--space-4)));
		margin: auto;
		padding: var(--space-4);
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
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-block-end: var(--space-4);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-heading-3);
		font-weight: var(--font-weight-heading-3);
		letter-spacing: var(--tracking-heading-3);
		line-height: var(--line-height-heading-3);
	}

	.close {
		display: grid;
		place-items: center;
		width: var(--size-small);
		height: var(--size-small);
		padding: 0;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: transparent;
		color: var(--foreground-neutral-primary);
		cursor: pointer;
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
		color: var(--foreground-neutral-primary);
		cursor: pointer;
	}

	.option:has(:checked) {
		color: var(--foreground-emphasis-primary);
	}

	.block {
		position: relative;
		display: block;
		border-radius: var(--radius-8);
		outline-offset: var(--space-1);
	}

	.option:has(:checked) .block {
		outline: var(--focus-width) solid var(--focus-border);
	}

	.option:has(:focus-visible) .block {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-1);
	}

	.check {
		position: absolute;
		inset-block-start: var(--space-1);
		inset-inline-end: var(--space-1);
		visibility: hidden;
		padding: 2px;
		border-radius: var(--radius-full);
		background: var(--background-emphasis-strong);
		color: var(--foreground-emphasis-on-fill);
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
