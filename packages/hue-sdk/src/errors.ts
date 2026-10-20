import type { ApiError } from './types/common.js';

export class HueError extends Error {
	override name = 'HueError';
}

export class HueNetworkError extends HueError {
	override name = 'HueNetworkError';
}

export class HueResponseError extends HueError {
	override name = 'HueResponseError';

	constructor(
		message: string,
		public readonly status: number,
		public readonly body: string,
		options?: ErrorOptions
	) {
		super(message, options);
	}
}

export interface HueApiErrorOptions extends ErrorOptions {
	body?: string;
}

export class HueApiError extends HueError {
	override name = 'HueApiError';
	public readonly body: string | undefined;

	constructor(
		message: string,
		public readonly status: number,
		public readonly errors: ApiError[],
		options?: HueApiErrorOptions
	) {
		super(message, options);
		this.body = options?.body;
	}
}

export class HueUnauthorizedError extends HueApiError {
	override name = 'HueUnauthorizedError';
}

export class HueForbiddenError extends HueApiError {
	override name = 'HueForbiddenError';
}

export class HueNotFoundError extends HueApiError {
	override name = 'HueNotFoundError';
}

export class HueRateLimitError extends HueApiError {
	override name = 'HueRateLimitError';
}

/** Error item returned by the V1 `POST /api` registration endpoint. */
export interface RegistrationErrorDetail {
	type: number;
	address: string;
	description: string;
}

export class HueRegistrationError extends HueError {
	override name = 'HueRegistrationError';

	constructor(
		message: string,
		public readonly error: RegistrationErrorDetail,
		options?: ErrorOptions
	) {
		super(message, options);
	}
}

/** V1 error type 101: the bridge link button has not been pressed. */
export class HueLinkButtonNotPressedError extends HueRegistrationError {
	override name = 'HueLinkButtonNotPressedError';
}
