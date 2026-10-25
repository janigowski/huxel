const OFF_OPACITY = 0.28;
const ON_FLOOR = 0.35;

export function padCount(value: number): string {
	return String(Math.max(0, Math.round(value))).padStart(2, '0');
}

export function indexLabel(index: number): string {
	return padCount(index + 1);
}

export function levelLabel(isOn: boolean, brightness: number | null): number {
	if (!isOn) {
		return 0;
	}

	return Math.round(brightness ?? 100);
}

export function gradientOpacity(isOn: boolean, brightness: number | null): number {
	if (!isOn) {
		return OFF_OPACITY;
	}

	const level = Math.min(100, Math.max(0, brightness ?? 100));

	return Math.round((ON_FLOOR + (level / 100) * (1 - ON_FLOOR)) * 1000) / 1000;
}

export function bridgeTail(id: string): string {
	return id.slice(-4).toUpperCase();
}
