<div class="marks" aria-hidden="true">
	<span class="mark tl"></span>
	<span class="mark tr"></span>
	<span class="mark bl"></span>
	<span class="mark br"></span>
</div>

<style>
	.mark {
		position: fixed;
		z-index: var(--z-mark);
		width: var(--mark-size);
		height: var(--mark-size);
		pointer-events: none;
	}

	.mark::before,
	.mark::after {
		content: '';
		position: absolute;
		background: var(--color-paper);
	}

	.mark::before {
		top: 50%;
		left: 0;
		width: 100%;
		height: var(--rule);
		transform: translateY(-50%);
	}

	.mark::after {
		left: 50%;
		top: 0;
		width: var(--rule);
		height: 100%;
		transform: translateX(-50%);
	}

	.tl {
		top: calc(var(--frame-inset) * 0.45);
		left: calc(var(--frame-inset) * 0.45);
	}

	.tr {
		top: calc(var(--frame-inset) * 0.45);
		right: calc(var(--frame-inset) * 0.45);
	}

	.bl {
		bottom: calc(var(--frame-inset) * 0.45);
		left: calc(var(--frame-inset) * 0.45);
	}

	.br {
		right: calc(var(--frame-inset) * 0.45);
		bottom: calc(var(--frame-inset) * 0.45);
	}
</style>
