const BASE_DELAY = 1000;
const MAX_BACKOFF_DELAY = 30_000;
const MAX_DELAY = 300_000;
const STABLE_CONNECTION_DURATION = 30_000;

export class ReconnectPolicy {
	private attempt = 0;
	private openedAt: number | undefined;

	nextDelay(minimumDelay = 0): number {
		const ceiling = Math.min(MAX_BACKOFF_DELAY, BASE_DELAY * 2 ** this.attempt);
		const backoff = ceiling / 2 + (Math.random() * ceiling) / 2;

		this.attempt++;

		return Math.min(MAX_DELAY, Math.max(backoff, minimumDelay));
	}

	connectionOpened(): void {
		this.openedAt = Date.now();
	}

	connectionEnded(): void {
		if (this.openedAt !== undefined && Date.now() - this.openedAt >= STABLE_CONNECTION_DURATION) {
			this.attempt = 0;
		}

		this.openedAt = undefined;
	}
}
