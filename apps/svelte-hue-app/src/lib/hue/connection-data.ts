import { data, UnknownDataError, type Data } from 'data-bus';
import type { HueAppConnection } from 'hue-app';

export type HueConnection = HueAppConnection | null;

declare module 'data-bus' {
	interface DataMap {
		'hue.connection': HueConnection;
	}
}

function connectionSlot(): Data<HueConnection> {
	try {
		return data('hue.connection');
	} catch (error) {
		if (error instanceof UnknownDataError) {
			return data('hue.connection', null);
		}

		throw error;
	}
}

export const hueConnection = connectionSlot();
