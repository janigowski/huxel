import type { XyColor } from './color';

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

export class AreasUnsupportedError extends HueAppError {
	override name = 'AreasUnsupportedError';

	constructor() {
		super('Rooms and zones are not available');
	}
}

export class RoomNotFoundError extends HueAppError {
	override name = 'RoomNotFoundError';

	constructor(public readonly roomId: string) {
		super(`Room "${roomId}" not found`);
	}
}

export class ZoneNotFoundError extends HueAppError {
	override name = 'ZoneNotFoundError';

	constructor(public readonly zoneId: string) {
		super(`Zone "${zoneId}" not found`);
	}
}

export class AreaNotDimmableError extends HueAppError {
	override name = 'AreaNotDimmableError';

	constructor(
		public readonly kind: 'room' | 'zone',
		public readonly id: string
	) {
		super(`${kind === 'room' ? 'Room' : 'Zone'} "${id}" does not support brightness`);
	}
}

export class AreaNotColorCapableError extends HueAppError {
	override name = 'AreaNotColorCapableError';

	constructor(
		public readonly kind: 'room' | 'zone',
		public readonly id: string
	) {
		super(`${kind === 'room' ? 'Room' : 'Zone'} "${id}" does not support color`);
	}
}

export class InvalidColorError extends HueAppError {
	override name = 'InvalidColorError';

	constructor(public readonly color: XyColor) {
		super(`Color x and y must be numbers between 0 and 1, received x=${color?.x}, y=${color?.y}`);
	}
}

export class InvalidPresetError extends HueAppError {
	override name = 'InvalidPresetError';

	constructor(public readonly preset: string) {
		super(`Preset must be bright, relax, or energize, received ${preset}`);
	}
}
