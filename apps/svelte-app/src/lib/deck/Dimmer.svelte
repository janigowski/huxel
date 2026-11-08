<script lang="ts">
	interface Props {
		value: number;
		label: string;
		disabled?: boolean;
		ondim: (brightness: number) => void;
	}

	let { value, label, disabled = false, ondim }: Props = $props();

	const pct = $derived(`${value}%`);
</script>

<input
	class="dimmer"
	type="range"
	min="0"
	max="100"
	step="1"
	{value}
	{disabled}
	aria-label={label}
	style:--pct={pct}
	oninput={(event) => ondim(Number(event.currentTarget.value))}
/>

<style>
	.dimmer {
		width: 100%;
		height: var(--control-size);
		margin: 0;
		appearance: none;
		background: transparent;
		cursor: pointer;
	}

	.dimmer:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dimmer:focus-visible {
		outline: var(--rule) solid var(--focus, var(--color-paper));
		outline-offset: var(--focus-offset);
	}

	.dimmer::-webkit-slider-runnable-track {
		height: var(--track-size);
		background: linear-gradient(
			to right,
			currentColor 0 var(--pct),
			var(--color-line) var(--pct) 100%
		);
	}

	.dimmer::-webkit-slider-thumb {
		width: var(--thumb-size);
		height: var(--thumb-size);
		margin-top: calc((var(--track-size) - var(--thumb-size)) / 2);
		appearance: none;
		border: var(--rule-strong) solid var(--color-background);
		background: currentColor;
	}

	.dimmer::-moz-range-track {
		height: var(--track-size);
		border: 0;
		background: linear-gradient(
			to right,
			currentColor 0 var(--pct),
			var(--color-line) var(--pct) 100%
		);
	}

	.dimmer::-moz-range-thumb {
		width: var(--thumb-size);
		height: var(--thumb-size);
		border: var(--rule-strong) solid var(--color-background);
		background: currentColor;
	}
</style>
