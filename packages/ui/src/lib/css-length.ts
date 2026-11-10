export function readPx(name: string): number {
	if (typeof document === 'undefined') {
		return 0;
	}

	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const match = /^(\d*\.?\d+)px$/.exec(raw);

	if (match === null) {
		return 0;
	}

	const amount = Number(match[1]);

	if (!Number.isFinite(amount)) {
		return 0;
	}

	return amount;
}

export function readMs(name: string): number {
	if (typeof document === 'undefined') {
		return 0;
	}

	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const match = /^(\d*\.?\d+)(ms|s)$/.exec(raw);

	if (match === null) {
		return 0;
	}

	const amount = Number(match[1]);
	const unit = match[2];

	if (!Number.isFinite(amount) || unit === undefined) {
		return 0;
	}

	if (unit === 's') {
		return amount * 1000;
	}

	return amount;
}
