import type { SvelteArea } from '@huxel/app/svelte';

export function areaCanColor(area: SvelteArea): boolean {
	if (area.supportsColor !== undefined) {
		return area.supportsColor;
	}

	return area.color !== null || (area.colors.length > 0 && area.temperature === null);
}

export function areaCanTemperature(area: SvelteArea): boolean {
	if (area.supportsTemperature !== undefined) {
		return area.supportsTemperature;
	}

	return area.temperature !== null;
}
