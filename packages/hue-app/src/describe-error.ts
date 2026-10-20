import { HueLinkButtonNotPressedError } from 'hue-sdk';

export function describeError(error: unknown): string {
	if (error instanceof HueLinkButtonNotPressedError) {
		return 'Press the link button on the bridge, then connect again.';
	}
	if (!(error instanceof Error)) {
		return String(error);
	}
	return error.cause === undefined
		? error.message
		: `${error.message} (${describeError(error.cause)})`;
}
