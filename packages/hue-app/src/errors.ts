import type { XyColor } from './color.js';

export class HueAppError extends Error {
	override name = 'HueAppError';
}

export class HueAppDisposedError extends HueAppError {
	override name = 'HueAppDisposedError';

	constructor() {
		super('HueApp has been disposed');
	}
}

export class LightNotFoundError extends HueAppError {
	override name = 'LightNotFoundError';

	constructor(public readonly lightId: string) {
		super(`Light "${lightId}" not found`);
	}
}

export class LightNotDimmableError extends HueAppError {
	override name = 'LightNotDimmableError';

	constructor(public readonly lightId: string) {
		super(`Light "${lightId}" does not support brightness`);
	}
}

export class InvalidBrightnessError extends HueAppError {
	override name = 'InvalidBrightnessError';

	constructor(public readonly brightness: number) {
		super(`Brightness must be a number between 0 and 100, received ${brightness}`);
	}
}

export class LightNotColorCapableError extends HueAppError {
	override name = 'LightNotColorCapableError';

	constructor(public readonly lightId: string) {
		super(`Light "${lightId}" does not support color`);
	}
}

export class InvalidColorError extends HueAppError {
	override name = 'InvalidColorError';

	constructor(public readonly color: XyColor) {
		super(`Color x and y must be numbers between 0 and 1, received x=${color?.x}, y=${color?.y}`);
	}
}
