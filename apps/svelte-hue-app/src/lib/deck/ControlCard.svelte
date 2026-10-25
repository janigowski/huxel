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
		oneditcolor
	}: Props = $props();

	const nameId = $props.id();
	const level = $derived(Math.round(brightness ?? 0));
	const stateLabel = $derived(isOn ? 'On' : 'Off');
	const opacity = $derived(gradientOpacity(isOn, brightness));
	const showGradient = $derived(showBar === 'always' || colors.length > 0);
	const adjustable = $derived(swatch !== null || brightness !== null);
</script>

<article class={['card', { lit: isOn }]} aria-labelledby={nameId}>
	<div class="body">
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
	</div>

	{#if showGradient}
		<GradientBar {colors} {opacity} />
	{/if}

	{#if adjustable}
		<div class="body">
			<div class="controls">
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
						class="color"
						type="button"
						aria-haspopup="dialog"
						aria-label="{name} color, {colorName}"
						disabled={!isOn}
						onclick={oneditcolor}
					>
						<ColorSwatch hex={swatch} />
						<span class="color-copy">
							<span class="meta">Color</span>
							<span class="color-name">{colorName}</span>
						</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}
</article>

<style>
	.card {
		--focus: var(--color-paper);
		display: flex;
		flex-direction: column;
		width: 100%;
		border: var(--rule) solid var(--color-line);
		background: var(--color-surface);
		color: var(--color-paper);
	}

	.lit {
		border-color: #3a3a3a;
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-4);
	}

	.body + .body {
		padding-top: 0;
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
		font-family: var(--font-display);
		font-size: var(--text-name);
		font-weight: var(--font-weight-bold);
		letter-spacing: var(--tracking-title);
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.power {
		--focus: var(--color-paper);
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: var(--space-2);
		justify-content: center;
		min-width: 4.75rem;
		min-height: var(--control-size);
		padding: 0 var(--space-3);
		border: var(--rule) solid var(--color-line);
		background: transparent;
		color: var(--color-mute);
		font-family: var(--font-display);
		font-size: var(--text-body);
		font-weight: var(--font-weight-bold);
		line-height: 1;
		cursor: pointer;
	}

	.lit .power {
		--focus: var(--color-ink);
		border-color: var(--color-paper);
		background: var(--color-paper);
		color: var(--color-ink);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.dim {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--space-2) var(--space-3);
		align-items: center;
	}

	.slider {
		grid-column: 1 / -1;
	}

	.meta {
		color: var(--color-mute);
		font-size: var(--text-label);
		line-height: 1.3;
	}

	.level {
		font-family: var(--font-mono);
		font-size: var(--text-body);
		letter-spacing: var(--tracking-tight);
		line-height: 1;
	}

	.color {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		min-height: var(--control-size);
		padding: var(--space-2) var(--space-3);
		border: var(--rule) solid var(--color-line);
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.color:disabled,
	.power:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.color-copy {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.color-name {
		overflow: hidden;
		font-size: var(--text-body);
		font-weight: var(--font-weight-bold);
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (hover: hover) {
		.power:hover {
			border-color: var(--color-paper);
			color: var(--color-paper);
		}

		.lit .power:hover {
			background: transparent;
			color: var(--color-paper);
		}

		.color:hover:not(:disabled) {
			border-color: var(--color-paper);
		}
	}
</style>
