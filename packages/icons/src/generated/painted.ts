export const paintedIconNames = ['spark'] as const;

export type PaintedIconName = (typeof paintedIconNames)[number];

export function isPaintedIcon(name: string): name is PaintedIconName {
	return (paintedIconNames as readonly string[]).includes(name);
}

export function paintedMarkup(name: PaintedIconName, id: string): string {
	if (name !== 'spark') {
		throw new Error(`Unknown painted icon: ${String(name)}`);
	}

	return (
		`<defs><linearGradient id="${id}" x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse">` +
		'<stop offset="0" style="stop-color:var(--color-brand-400)"/>' +
		'<stop offset="1" style="stop-color:var(--color-insight-400)"/>' +
		'</linearGradient></defs>' +
		`<path fill="url(#${id})" d="M8 1.5 9.2 6.8 14.5 8 9.2 9.2 8 14.5 6.8 9.2 1.5 8 6.8 6.8Z"/>`
	);
}
