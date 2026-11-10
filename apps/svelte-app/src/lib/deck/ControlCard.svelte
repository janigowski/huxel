<script lang="ts">
	import ColorSwatch from './ColorSwatch.svelte';
	import Dimmer from './Dimmer.svelte';
	import GradientBar from './GradientBar.svelte';
	import PowerIcon from './PowerIcon.svelte';
	import { gradientOpacity } from './readout';

	interface Props {
		name: string;
		isOn: boolean;
		brightness: number | null;
		colors: readonly string[];
		swatch: string | null;
		colorName: string;
		showBar: 'always' | 'color';
		ontoggle: () => void;
		ondim: (brightness: number) => void;
		oneditcolor: () => void;
		presetName?: string;
		oneditpresets?: () => void;
		singleRow?: boolean;
	}

	let {
		name,
		isOn,
		brightness,
		colors,
		swatch,
		colorName,
		showBar,
		ontoggle,
		ondim,
		oneditcolor,
		presetName,
		oneditpresets,
		singleRow = false
	}: Props = $props();

	const nameId = $props.id();
	const level = $derived(Math.round(brightness ?? 0));
	const stateLabel = $derived(isOn ? 'On' : 'Off');
	const opacity = $derived(gradientOpacity(isOn, brightness));
	const showGradient = $derived(showBar === 'always' || colors.length > 0);
	const adjustable = $derived(
		swatch !== null || brightness !== null || oneditpresets !== undefined
	);
	const glow = $derived(colors[0] ?? 'var(--foreground-emphasis-primary)');
</script>

<article class={['card', { lit: isOn, line: singleRow }]} style:--glow={glow} aria-labelledby={nameId}>
	{#if showGradient}
		<GradientBar {colors} {opacity} orientation={singleRow ? 'vertical' : 'horizontal'} />
	{/if}

	<div class={['body', { line: singleRow }]}>
		<div class="identity">
			<p id={nameId} class="name" title={name}>{name}</p>
			<button
				class="power"
				type="button"
				aria-pressed={isOn}
				aria-label="{name}, {stateLabel}"
				onclick={ontoggle}
			>
				<PowerIcon />
				<span>{stateLabel}</span>
			</button>
		</div>

		{#if adjustable}
			<div class={['controls', { line: singleRow }]}>
				{#if brightness !== null}
					<div class="dim">
						<span class="meta">Brightness</span>
						<span class="level">{level}%</span>
						<div class="slider">
							<Dimmer value={brightness} disabled={!isOn} label="{name} brightness" {ondim} />
						</div>
					</div>
				{/if}

				{#if swatch}
					<button
						class="choice"
						type="button"
						aria-haspopup="dialog"
						aria-label="{name} color, {colorName}"
						disabled={!isOn}
						onclick={oneditcolor}
					>
						<ColorSwatch hex={swatch} />
						<span class="choice-copy">
							<span class="meta">Color</span>
							<span class="choice-name">{colorName}</span>
						</span>
					</button>
				{/if}

				{#if presetName && oneditpresets}
					<button
						class="choice"
						type="button"
						aria-haspopup="dialog"
						aria-label="{name} presets, {presetName}"
						disabled={!isOn}
						onclick={oneditpresets}
					>
						{#if swatch}
							<ColorSwatch hex={swatch} />
						{/if}
						<span class="choice-copy">
							<span class="meta">Presets</span>
							<span class="choice-name">{presetName}</span>
						</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		width: 100%;
		overflow: hidden;
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-12);
		background: color-mix(in srgb, var(--background-neutral-medium) 42%, var(--background-default));
		box-shadow: var(--elevation-1);
		color: var(--foreground-neutral-primary);
		transition:
			border-color var(--duration-default) var(--ease-default),
			background var(--duration-default) var(--ease-default),
			box-shadow var(--duration-default) var(--ease-default);
	}

	.lit {
		border-color: color-mix(in srgb, var(--glow) 55%, var(--border-neutral));
		background: var(--background-neutral-medium);
		box-shadow:
			var(--elevation-2),
			0 0 28px color-mix(in srgb, var(--glow) 22%, transparent);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
	}

	.identity {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.name {
		flex: 1;
		min-width: 0;
		margin: 0;
		overflow: hidden;
		font-size: var(--font-size-heading-3);
		font-weight: var(--font-weight-heading-3);
		letter-spacing: var(--tracking-heading-3);
		line-height: var(--line-height-heading-3);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.power {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-width: 4.5rem;
		min-height: var(--size-small);
		padding: 0 var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: transparent;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		font-weight: var(--font-weight-control);
		line-height: 1;
		cursor: pointer;
		transition:
			background var(--duration-default) var(--ease-default),
			border-color var(--duration-default) var(--ease-default),
			color var(--duration-default) var(--ease-default);
	}

	.lit .power {
		border-color: transparent;
		background: var(--background-emphasis-strong);
		color: var(--foreground-emphasis-on-fill);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.dim {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-1) var(--space-3);
		align-items: center;
	}

	.slider {
		grid-column: 1 / -1;
	}

	.meta {
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
	}

	.level {
		font-family: var(--font-mono);
		font-size: var(--font-size-body-2);
		line-height: var(--line-height-body-2);
	}

	.choice {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		min-height: var(--size-medium);
		padding: var(--space-2) var(--space-3);
		border: var(--border-width) solid var(--border-neutral);
		border-radius: var(--radius-control);
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			border-color var(--duration-default) var(--ease-default),
			background var(--duration-default) var(--ease-default);
	}

	.choice:disabled {
		color: var(--foreground-neutral-disabled);
		cursor: not-allowed;
	}

	.card.line {
		flex-direction: row;
		align-items: stretch;
	}

	.body.line {
		flex: 1;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-3);
		min-width: 0;
	}

	.body.line .identity {
		flex: 0 1 auto;
		min-width: 9rem;
	}

	.body.line .name {
		flex: 1 1 auto;
		width: auto;
		min-width: 0;
	}

	.controls.line {
		flex: 1;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.controls.line .dim {
		display: flex;
		flex: 1 1 auto;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
	}

	.controls.line .dim .meta {
		display: none;
	}

	.controls.line .slider {
		flex: 1 1 3rem;
		min-width: 3rem;
	}

	.controls.line .slider :global(input) {
		width: 100%;
		min-width: 0;
	}

	.controls.line .choice {
		flex: 0 1 auto;
		width: auto;
		min-width: 0;
		max-width: 6.5rem;
		min-height: var(--size-small);
		padding: var(--space-1) var(--space-2);
	}

	.controls.line .choice-name {
		max-width: 8rem;
	}

	@media (max-width: 40rem) {
		.body.line .identity {
			flex-basis: 6rem;
		}

		.controls.line .choice-name {
			max-width: 3.5rem;
		}
	}

	.controls.line .choice .meta {
		display: none;
	}

	.controls.line .choice-copy {
		flex-direction: row;
	}

	.choice-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.choice-name {
		overflow: hidden;
		font-size: var(--font-size-body-1);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-body-1);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (hover: hover) {
		.power:hover {
			border-color: var(--border-neutral-hover);
			background: var(--background-neutral-soft-hover);
			color: var(--foreground-neutral-primary);
		}

		.lit .power:hover {
			border-color: transparent;
			background: var(--background-emphasis-strong-hover);
			color: var(--foreground-emphasis-on-fill);
		}

		.choice:hover:not(:disabled) {
			border-color: var(--border-emphasis);
			background: var(--background-emphasis-soft);
		}
	}
</style>
