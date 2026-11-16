export class PointerDrag {
	private active = false;
	private surface: HTMLElement | null = null;
	private pointerId = -1;
	private readonly move: (event: PointerEvent) => void;
	private readonly end: (event: PointerEvent) => void;

	constructor(private readonly apply: (event: PointerEvent) => void) {
		this.move = (event) => {
			if (!this.active || event.pointerId !== this.pointerId) {
				return;
			}

			if (event.buttons === 0) {
				this.finish(event);
				return;
			}

			this.apply(event);
		};

		this.end = (event) => {
			if (!this.active || event.pointerId !== this.pointerId) {
				return;
			}

			this.finish(event);
		};
	}

	start(event: PointerEvent): void {
		if (event.button !== 0 || this.active) {
			return;
		}

		const surface = event.currentTarget;

		if (!(surface instanceof HTMLElement)) {
			return;
		}

		event.preventDefault();
		this.surface = surface;
		this.pointerId = event.pointerId;
		this.active = true;
		surface.focus({ preventScroll: true });

		try {
			surface.setPointerCapture(event.pointerId);
		} catch (error) {
			if (!(error instanceof DOMException)) {
				throw error;
			}
		}

		window.addEventListener('pointermove', this.move);
		window.addEventListener('pointerup', this.end);
		window.addEventListener('pointercancel', this.end);
		this.apply(event);
	}

	element(): HTMLElement | null {
		return this.surface;
	}

	dispose(): void {
		this.detach();
		this.active = false;
	}

	private finish(event: PointerEvent): void {
		this.active = false;
		this.detach();
		this.apply(event);
	}

	private detach(): void {
		window.removeEventListener('pointermove', this.move);
		window.removeEventListener('pointerup', this.end);
		window.removeEventListener('pointercancel', this.end);
	}
}
