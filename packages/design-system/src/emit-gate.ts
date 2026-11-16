export class EmitGate {
	private readonly waitMs: number;
	private last = 0;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private pending: (() => void) | undefined;

	constructor(waitMs = 100) {
		this.waitMs = waitMs;
	}

	push(emit: () => void): void {
		const now = Date.now();

		if (now - this.last >= this.waitMs) {
			this.clearTimer();
			this.pending = undefined;
			this.last = now;
			emit();
			return;
		}

		this.pending = emit;

		if (this.timer !== undefined) {
			return;
		}

		this.timer = setTimeout(
			() => {
				this.timer = undefined;
				this.last = Date.now();
				const next = this.pending;
				this.pending = undefined;
				next?.();
			},
			this.waitMs - (now - this.last)
		);
	}

	flush(): void {
		this.clearTimer();
		const next = this.pending;
		this.pending = undefined;

		if (next) {
			this.last = Date.now();
			next();
		}
	}

	cancel(): void {
		this.clearTimer();
		this.pending = undefined;
	}

	private clearTimer(): void {
		if (this.timer !== undefined) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
	}
}
