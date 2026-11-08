export type TimerHandle = unknown;

interface Timers {
	setTimeout(callback: () => void, ms: number): TimerHandle;
	clearTimeout(handle: TimerHandle): void;
}

const timers = globalThis as unknown as Timers;

export function startTimer(callback: () => void, ms: number): TimerHandle {
	return timers.setTimeout(callback, ms);
}

export function stopTimer(handle: TimerHandle): void {
	timers.clearTimeout(handle);
}
