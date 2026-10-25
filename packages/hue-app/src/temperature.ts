/** Color temperature feature. `mirek` is null when the resource is outside the CT spectrum. */
export interface ColorTemperature {
	readonly mirek: number | null;
}

const MIREK_MIN = 50;
const MIREK_MAX = 1000;

export function isMirek(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isInteger(value) && value >= MIREK_MIN && value <= MIREK_MAX
	);
}

export function sameTemperature(a: ColorTemperature | null, b: ColorTemperature | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}

	return a.mirek === b.mirek;
}

export function freezeTemperature(temperature: ColorTemperature | null): ColorTemperature | null {
	if (temperature === null) {
		return null;
	}

	return Object.freeze({ mirek: temperature.mirek });
}

/** Feature object from a full resource. `null` when the resource has no color temperature. */
export function temperatureOf(feature: unknown): ColorTemperature | null {
	if (feature === undefined || feature === null) {
		return null;
	}

	return temperatureFrom(feature) ?? { mirek: null };
}

/** Present temperature on a partial update. `undefined` when the payload does not carry one. */
export function temperatureFrom(feature: unknown): ColorTemperature | undefined {
	if (typeof feature !== 'object' || feature === null) {
		return undefined;
	}

	const { mirek, mirek_valid } = feature as { mirek?: unknown; mirek_valid?: unknown };

	if (mirek_valid === false || mirek === null) {
		return { mirek: null };
	}

	if (typeof mirek === 'number') {
		return { mirek };
	}

	return undefined;
}

export function mirekToHex(mirek: number): string {
	if (!isMirek(mirek)) {
		throw new TypeError(
			`Expected a mirek from ${MIREK_MIN} to ${MIREK_MAX}, received ${String(mirek)}`
		);
	}

	const temperature = 1_000_000 / mirek / 100;
	const red = temperature <= 66 ? 255 : 329.698727446 * (temperature - 60) ** -0.1332047592;
	const green =
		temperature <= 66
			? 99.4708025861 * Math.log(temperature) - 161.1195681661
			: 288.1221695283 * (temperature - 60) ** -0.0755148492;
	let blue = 255;

	if (temperature <= 19) {
		blue = 0;
	} else if (temperature < 66) {
		blue = 138.5177312231 * Math.log(temperature - 10) - 305.0447927307;
	}

	return `#${byte(red)}${byte(green)}${byte(blue)}`;
}

function byte(value: number): string {
	return Math.round(Math.min(255, Math.max(0, value)))
		.toString(16)
		.padStart(2, '0');
}
