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
		height: var(--size-small);
		margin: 0;
		color: var(--glow, var(--foreground-emphasis-primary));
		appearance: none;
		background: transparent;
		cursor: pointer;
	}

	.dimmer:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dimmer::-webkit-slider-runnable-track {
		height: var(--track-size);
		border-radius: var(--radius-full);
		background: linear-gradient(
			to right,
			currentColor 0 var(--pct),
			var(--border-neutral) var(--pct) 100%
		);
	}

	.dimmer::-webkit-slider-thumb {
		width: var(--thumb-size);
		height: var(--thumb-size);
		margin-top: calc((var(--track-size) - var(--thumb-size)) / 2);
		appearance: none;
		border: var(--focus-width) solid var(--background-default);
		border-radius: var(--radius-full);
		background: var(--foreground-neutral-primary);
		box-shadow: var(--elevation-1);
	}

	.dimmer::-moz-range-track {
		height: var(--track-size);
		border: 0;
		border-radius: var(--radius-full);
		background: linear-gradient(
			to right,
			currentColor 0 var(--pct),
			var(--border-neutral) var(--pct) 100%
		);
	}

	.dimmer::-moz-range-progress {
		background: transparent;
	}

	.dimmer::-moz-range-thumb {
		width: var(--thumb-size);
		height: var(--thumb-size);
		border: var(--focus-width) solid var(--background-default);
		border-radius: var(--radius-full);
		background: var(--foreground-neutral-primary);
		box-shadow: var(--elevation-1);
	}
</style>
