import type { HueApiError } from '../errors';
import type { HttpStreamResponse } from '../http';
import { createApiError, parseJsonBody, readErrors } from '../protocol';

const MAX_BODY_LENGTH = 1000;
const BODY_TIMEOUT = 2000;

export class StreamRejection {
	private constructor(
		private readonly label: string,
		private readonly status: number,
		private readonly headers: Headers,
		private readonly body: string
	) {}

	static async read(label: string, response: HttpStreamResponse): Promise<StreamRejection> {
		const body = await StreamRejection.readBody(response.body);

		return new StreamRejection(label, response.status, response.headers, body);
	}

	get isPermanent(): boolean {
		return this.status === 401 || this.status === 403;
	}

	get retryDelay(): number {
		return this.status === 429 || this.status === 503 ? this.retryAfter() : 0;
	}

	toError(): HueApiError {
		const parsed = parseJsonBody(this.body);
		const errors = parsed.ok ? (readErrors(parsed.value) ?? []) : [];

		return createApiError(this.label, this.status, errors, this.body);
	}

	private retryAfter(): number {
		const value = this.headers.get('retry-after')?.trim();

		if (!value) {
			return 0;
		}

		if (/^\d+$/.test(value)) {
			return Number.parseInt(value, 10) * 1000;
		}

		const date = Date.parse(value);

		return Number.isNaN(date) ? 0 : Math.max(0, date - Date.now());
	}

	private static async readBody(body: AsyncIterable<string>): Promise<string> {
		const iterator = body[Symbol.asyncIterator]();
		let timeout: ReturnType<typeof setTimeout> | undefined;
		const expired = new Promise<undefined>((resolve) => {
			timeout = setTimeout(resolve, BODY_TIMEOUT, undefined);
		});
		let text = '';

		try {
			while (text.length < MAX_BODY_LENGTH) {
				const result = await Promise.race([iterator.next(), expired]);

				if (!result || result.done) {
					break;
				}

				text += result.value;
			}
		} catch {
			return text;
		} finally {
			clearTimeout(timeout);
			void Promise.resolve(iterator.return?.()).catch(() => undefined);
		}

		return text;
	}
}
