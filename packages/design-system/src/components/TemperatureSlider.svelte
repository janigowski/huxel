<script lang="ts">
	import { kelvinFromMirek, mirekFromKelvin, mirekToHex, type MirekRange } from '@huxel/app';

	interface Props {
		mirek: number;
		range: MirekRange;
		onchange: (mirek: number, immediate: boolean) => void;
	}

	let { mirek, range, onchange }: Props = $props();

	const warm = $derived(kelvinFromMirek(range.maximum));
	const cool = $derived(kelvinFromMirek(range.minimum));
	const kelvin = $derived(kelvinFromMirek(mirek));
	const place = $derived(cool === warm ? 0 : (kelvin - warm) / (cool - warm));
	const gradient = $derived(temperatureGradient(range));
	let dragging = false;

	function setFromClientX(clientX: number, element: HTMLElement, immediate: boolean) {
		const rect = element.getBoundingClientRect();
		const t = rect.width === 0 ? 0 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));

		onchange(mirekFromKelvin(warm + t * (cool - warm), range), immediate);
	}

	function start(event: PointerEvent) {
		const element = event.currentTarget as HTMLElement;
		element.setPointerCapture(event.pointerId);
		dragging = true;
		setFromClientX(event.clientX, element, false);
	}

	function drag(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		setFromClientX(event.clientX, event.currentTarget as HTMLElement, false);
	}

	function stop(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		dragging = false;
		setFromClientX(event.clientX, event.currentTarget as HTMLElement, true);
	}

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
		const steps = 7;
		const stops = Array.from({ length: steps }, (_, index) => {
			const value = Math.round(
				span.maximum - ((span.maximum - span.minimum) * index) / (steps - 1)
			);

			return mirekToHex(value);
		});

		return `linear-gradient(to right, ${stops.join(', ')})`;
	}
</script>

<div class="temperature">
	<div
		class="bar"
		style:background={gradient}
		role="slider"
		aria-label="Color temperature"
		aria-valuemin={warm}
		aria-valuemax={cool}
		aria-valuenow={kelvin}
		aria-valuetext="{kelvin} kelvin"
		tabindex="0"
		onpointerdown={start}
		onpointermove={drag}
		onpointerup={stop}
		onpointercancel={stop}
		onkeydown={key}
	>
		<span class="handle" style:left="{place * 100}%" style:background={mirekToHex(mirek)}></span>
	</div>
	<div class="scale">
		<span>{warm}K</span>
		<span class="current">{kelvin}K</span>
		<span>{cool}K</span>
	</div>
</div>

<style>
	.temperature {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.bar {
		position: relative;
		height: 2.75rem;
		border-radius: var(--radius-full);
		box-shadow: inset 0 0 0 var(--border-width) rgb(0 0 0 / 0.28);
		touch-action: none;
		cursor: pointer;
	}

	.bar:focus-visible {
		outline: var(--focus-width) solid var(--focus-border);
		outline-offset: var(--space-1);
	}

	.handle {
		position: absolute;
		top: 50%;
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid #fff;
		border-radius: 50%;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.55);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.scale {
		display: flex;
		justify-content: space-between;
		color: var(--foreground-neutral-secondary);
		font-size: var(--font-size-body-2);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-body-2);
	}

	.current {
		color: var(--foreground-neutral-primary);
		font-weight: var(--font-weight-medium);
	}
</style>
