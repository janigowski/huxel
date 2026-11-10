import { readDurationMs } from '@huxel/tokens/motion';

export function waitForExit(): Promise<void> {
	const duration = readDurationMs('--duration-long');

	return new Promise((resolve) => {
		window.setTimeout(resolve, duration);
	});
}
