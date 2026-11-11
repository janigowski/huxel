<script lang="ts">
	interface Props {
		hue: number;
		saturation: number;
		color: string;
		onchange: (hue: number, saturation: number, immediate: boolean) => void;
	}

	let { hue, saturation, color, onchange }: Props = $props();

	const x = $derived(50 + Math.sin((hue * Math.PI) / 180) * saturation * 50);
	const y = $derived(50 - Math.cos((hue * Math.PI) / 180) * saturation * 50);
	let dragging = false;

	function point(event: PointerEvent, immediate: boolean) {
		const element = event.currentTarget as HTMLElement;
		const rect = element.getBoundingClientRect();
		const radius = rect.width / 2;
		const dx = event.clientX - (rect.left + radius);
		const dy = event.clientY - (rect.top + radius);
		const distance = Math.min(Math.hypot(dx, dy), radius);
		let nextHue = (Math.atan2(dx, -dy) * 180) / Math.PI;

		if (nextHue < 0) {
			nextHue += 360;
		}

		onchange(nextHue, radius === 0 ? 0 : distance / radius, immediate);
	}

	function start(event: PointerEvent) {
		const element = event.currentTarget as HTMLElement;
		element.setPointerCapture(event.pointerId);
		dragging = true;
		point(event, false);
	}

	function drag(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		point(event, false);
	}

	function stop(event: PointerEvent) {
		if (!dragging) {
			return;
		}

		dragging = false;
		point(event, true);
	}

	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 15 : 8;
		let nextHue = hue;
		let nextSaturation = saturation;

		if (event.key === 'ArrowLeft') {
			nextHue = (hue - step + 360) % 360;
		} else if (event.key === 'ArrowRight') {
			nextHue = (hue + step) % 360;
		} else if (event.key === 'ArrowDown') {
			nextSaturation = Math.max(0, saturation - 0.05);
		} else if (event.key === 'ArrowUp') {
			nextSaturation = Math.min(1, saturation + 0.05);
		} else {
			return;
		}

		event.preventDefault();
		onchange(nextHue, nextSaturation, true);
	}
</script>

<div
	class="wheel"
	role="slider"
	aria-label="Hue and saturation"
	aria-valuemin="0"
	aria-valuemax="360"
	aria-valuenow={Math.round(hue)}
	aria-valuetext="{Math.round(hue)} degrees, {Math.round(saturation * 100)} percent saturation"
	tabindex="0"
	onpointerdown={start}
	onpointermove={drag}
	onpointerup={stop}
	onpointercancel={stop}
	onkeydown={key}
>
	<span class="handle" style:left="{x}%" style:top="{y}%" style:background={color}></span>
</div>

<style>
	.wheel {
		position: relative;
		width: min(16rem, 100%);
		aspect-ratio: 1;
		margin-inline: auto;
		border-radius: 50%;
		background:
			radial-gradient(circle, #fff 0%, transparent 70%),
			conic-gradient(#f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
		box-shadow: inset 0 0 0 var(--border-width) rgb(0 0 0 / 0.35);
		touch-action: none;
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
