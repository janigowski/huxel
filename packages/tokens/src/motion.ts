export type DurationName = '--duration-short' | '--duration-default' | '--duration-long';

export type EaseName = '--ease-default' | '--ease-emphasis';

export type MotionName = DurationName | EaseName;

const unreadDuration = '0ms';
const unreadEasing = '0';
const cubicBezier =
	/^cubic-bezier\(\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*,\s*-?\d*\.?\d+\s*\)$/;

export function readMotion(name: MotionName): string {
	if (isDuration(name)) {
		if (prefersReducedMotion()) {
			return unreadDuration;
		}

		const value = readCustomProperty(name);

		if (parseDurationMs(value) === undefined) {
			return unreadDuration;
		}

		return value;
	}

	const value = readCustomProperty(name);

	if (!isEasing(value)) {
		return unreadEasing;
	}

	return value;
}

export function readDurationMs(name: DurationName): number {
	const parsed = parseDurationMs(readMotion(name));

	if (parsed === undefined) {
		return 0;
	}

	return parsed;
}

function isDuration(name: MotionName): name is DurationName {
	return name === '--duration-short' || name === '--duration-default' || name === '--duration-long';
}

function readCustomProperty(name: MotionName): string {
	if (typeof document === 'undefined') {
		return '';
	}

	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return false;
	}

	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function parseDurationMs(value: string): number | undefined {
	const match = /^(\d*\.?\d+)(ms|s)$/.exec(value);

	if (match === null) {
		return undefined;
	}

	const amount = Number(match[1]);
	const unit = match[2];

	if (!Number.isFinite(amount) || unit === undefined) {
		return undefined;
	}

	if (unit === 's') {
		return amount * 1e3;
	}

	return amount;
}

function isEasing(value: string): boolean {
	return (
		value === 'linear' ||
		value === 'ease' ||
		value === 'ease-in' ||
		value === 'ease-out' ||
		value === 'ease-in-out' ||
		cubicBezier.test(value)
	);
}
