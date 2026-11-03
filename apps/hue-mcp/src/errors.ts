export type SessionErrorCode =
	| 'link-button'
	| 'unauthorized'
	| 'unreachable'
	| 'not-linked'
	| 'ambiguous'
	| 'not-found'
	| 'invalid'
	| 'failed';

export class SessionError extends Error {
	override name = 'SessionError';

	constructor(
		message: string,
		readonly code: SessionErrorCode
	) {
		super(message);
	}
}

export const PRESS_BUTTON =
	'Press the link button on the bridge, then ask again within 30 seconds.';

export const NOT_LINKED =
	'Hue bridge is not linked. Press the link button on the bridge, then link again.';

export const KEY_REJECTED =
	'The bridge rejected the application key. Press the link button on the bridge, then link again.';

export const UNREACHABLE = 'The Hue bridge is unreachable.';
