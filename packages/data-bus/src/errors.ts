export class DataBusError extends Error {
	override name = 'DataBusError';
}

export class DuplicateDataError extends DataBusError {
	override name = 'DuplicateDataError';

	constructor(public readonly dataName: string) {
		super(`Data "${dataName}" is already defined`);
	}
}

export class UnknownDataError extends DataBusError {
	override name = 'UnknownDataError';

	constructor(public readonly dataName: string) {
		super(`Data "${dataName}" is not defined`);
	}
}
