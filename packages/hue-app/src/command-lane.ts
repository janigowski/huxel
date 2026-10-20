import { startTimer, stopTimer, type TimerHandle } from './timers.js';

interface Waiter {
	resolve(): void;
	reject(error: unknown): void;
}

interface Pending<T> {
	value: T;
	waiters: Waiter[];
}

/**
 * Serializes optimistic commands for one property of one light.
 *
 * At most one command is in flight. Commands issued meanwhile collapse into a single
 * pending command carrying the latest value; superseded callers settle with it.
 * On failure the property reverts to the buffered remote value, or else the last
 * confirmed value, only when no newer command is pending.
 */
export class CommandLane<T> {
	readonly #read: () => T;
	readonly #write: (value: T) => void;
	readonly #send: (value: T) => Promise<void>;
	readonly #settleMs: number;
	#confirmed: T;
	#pending: Pending<T> | undefined;
	#remote: { value: T } | undefined;
	#settle: TimerHandle | undefined;
	#running = false;
	#disposed = false;

	constructor(
		read: () => T,
		write: (value: T) => void,
		send: (value: T) => Promise<void>,
		settleMs = 0
	) {
		this.#read = read;
		this.#write = write;
		this.#send = send;
		this.#settleMs = settleMs;
		this.#confirmed = read();
	}

	submit(value: T): Promise<void> {
		const idle = !this.#running;
		if (idle) {
			this.#confirmed = this.#read();
		}
		const result = new Promise<void>((resolve, reject) => {
			if (this.#pending) {
				this.#pending.value = value;
				this.#pending.waiters.push({ resolve, reject });
			} else {
				this.#pending = { value, waiters: [{ resolve, reject }] };
			}
		});
		if (idle) {
			void this.#drain();
		}
		this.#write(value);
		return result;
	}

	reconcile(remote: T): void {
		if (this.#disposed) {
			return;
		}
		if (this.#isBusy()) {
			this.#remote = { value: remote };
			return;
		}
		this.#remote = undefined;
		this.#apply(remote);
	}

	dispose(): void {
		this.#disposed = true;
		this.#remote = undefined;
		this.#stopSettle();
	}

	#isBusy(): boolean {
		return this.#running || this.#pending !== undefined || this.#settle !== undefined;
	}

	async #drain(): Promise<void> {
		this.#running = true;
		try {
			while (this.#pending) {
				const command = this.#pending;
				this.#pending = undefined;
				try {
					await this.#send(command.value);
					this.#restartSettle();
					this.#confirmed = command.value;
					command.waiters.forEach((waiter) => waiter.resolve());
				} catch (error) {
					this.#restartSettle();
					command.waiters.forEach((waiter) => waiter.reject(error));
					if (!this.#pending) {
						this.#revert();
					}
				}
			}
		} finally {
			this.#running = false;
		}
		this.#flush();
	}

	#revert(): void {
		const remote = this.#remote;
		if (remote) {
			this.#remote = undefined;
			this.#confirmed = remote.value;
		}
		this.#write(this.#confirmed);
	}

	#flush(): void {
		const remote = this.#remote;
		if (this.#disposed || this.#isBusy() || !remote) {
			return;
		}
		this.#remote = undefined;
		this.#apply(remote.value);
	}

	#apply(value: T): void {
		this.#confirmed = value;
		if (!Object.is(this.#read(), value)) {
			this.#write(value);
		}
	}

	#restartSettle(): void {
		if (this.#disposed || !(this.#settleMs > 0)) {
			return;
		}
		this.#stopSettle();
		this.#settle = startTimer(() => {
			this.#settle = undefined;
			this.#flush();
		}, this.#settleMs);
	}

	#stopSettle(): void {
		if (this.#settle !== undefined) {
			stopTimer(this.#settle);
			this.#settle = undefined;
		}
	}
}
