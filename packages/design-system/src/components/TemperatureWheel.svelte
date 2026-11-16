<script lang="ts">
	import { kelvinFromMirek, mirekFromKelvin, mirekToHex, type MirekRange } from '@huxel/app';
	import { onDestroy } from 'svelte';
	import { PointerDrag } from '../pointer-drag';

	interface Props {
		mirek: number;
		range: MirekRange;
		onchange: (mirek: number, immediate?: boolean) => void;
	}

	let { mirek, range, onchange }: Props = $props();

	const warm = $derived(kelvinFromMirek(range.maximum));
	const cool = $derived(kelvinFromMirek(range.minimum));
	const kelvin = $derived(kelvinFromMirek(mirek));
	const place = $derived(cool === warm ? 0 : (kelvin - warm) / (cool - warm));
	const x = $derived(place * 100);
	let offsetY = $state(50);
	const gradient = $derived(temperatureGradient(range));
	const drag = new PointerDrag((event) => {
		const element = drag.element();

		if (!element) {
			return;
		}

		const rect = element.getBoundingClientRect();
		const radius = rect.width / 2;
		let dx = event.clientX - (rect.left + radius);
		let dy = event.clientY - (rect.top + radius);
		const distance = Math.hypot(dx, dy);

		if (radius > 0 && distance > radius) {
			const scale = radius / distance;
			dx *= scale;
			dy *= scale;
		}

		offsetY = radius === 0 ? 50 : 50 + (dy / radius) * 50;
		const across = radius === 0 ? 0 : (dx / radius + 1) / 2;

		onchange(mirekFromKelvin(warm + across * (cool - warm), range));
	});

	onDestroy(() => {
		drag.dispose();
	});

	function key(event: KeyboardEvent) {
		const step = Math.max(50, Math.round((cool - warm) / 20));
		let next = kelvin;

		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			next = kelvin + step;
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			next = kelvin - step;
		} else if (event.key === 'Home') {
			next = warm;
		} else if (event.key === 'End') {
			next = cool;
		} else {
			return;
		}

		event.preventDefault();
		onchange(mirekFromKelvin(next, range), true);
	}

	function temperatureGradient(span: MirekRange): string {
		const steps = 8;
		const stops = Array.from({ length: steps }, (_, index) => {
			const value = Math.round(
				span.maximum - ((span.maximum - span.minimum) * index) / (steps - 1)
			);

			return mirekToHex(value);
		});

		return `linear-gradient(to right, ${stops.join(', ')})`;
	}
</script>

<div
	class="wheel"
	style:background={gradient}
	role="slider"
	aria-label="Color temperature"
	aria-valuemin={warm}
	aria-valuemax={cool}
	aria-valuenow={kelvin}
	aria-valuetext="{kelvin} kelvin"
	tabindex="0"
	onpointerdown={(event) => drag.start(event)}
	onkeydown={key}
>
	<span class="handle" style:left="{x}%" style:top="{offsetY}%" style:background={mirekToHex(mirek)}
	></span>
</div>

<style>
	.wheel {
		position: relative;
		width: min(16rem, 100%);
		aspect-ratio: 1;
		margin-inline: auto;
		border-radius: 50%;
		box-shadow: inset 0 0 0 var(--border-width) rgb(0 0 0 / 0.35);
		touch-action: none;
		user-select: none;
		cursor: crosshair;
	}

	.wheel:focus-visible {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-1);
	}

	.handle {
		position: absolute;
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid #fff;
		border-radius: 50%;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.55);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}
</style>
