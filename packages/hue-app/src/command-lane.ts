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
 * On failure the property reverts to the last confirmed value only when no newer
 * command is pending.
 */
export class CommandLane<T> {
	readonly #read: () => T;
	readonly #write: (value: T) => void;
	readonly #send: (value: T) => Promise<void>;
	#confirmed!: T;
	#pending: Pending<T> | undefined;
	#running = false;

	constructor(read: () => T, write: (value: T) => void, send: (value: T) => Promise<void>) {
		this.#read = read;
		this.#write = write;
		this.#send = send;
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

	async #drain(): Promise<void> {
		this.#running = true;
		try {
			while (this.#pending) {
				const command = this.#pending;
				this.#pending = undefined;
				try {
					await this.#send(command.value);
					this.#confirmed = command.value;
					command.waiters.forEach((waiter) => waiter.resolve());
				} catch (error) {
					command.waiters.forEach((waiter) => waiter.reject(error));
					if (!this.#pending) {
						this.#write(this.#confirmed);
					}
				}
			}
		} finally {
			this.#running = false;
		}
	}
}
