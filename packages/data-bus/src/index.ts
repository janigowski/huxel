import { DataBus } from './bus';
import type { Data, DataListener, DataMap, UnregisteredName } from './types';

export const dataBus = new DataBus();

export function data<K extends keyof DataMap>(name: K, initial?: DataMap[K]): Data<DataMap[K]>;
export function data<T, K extends string>(name: UnregisteredName<K>, initial: T): Data<T>;
export function data<K extends string>(name: UnregisteredName<K>): Data<unknown>;
export function data(name: string, initial?: unknown): Data<unknown> {
	if (arguments.length < 2) {
		return dataBus.data(name);
	}

	return dataBus.data(name, initial);
}

export function on<K extends keyof DataMap>(
	name: K,
	listener: DataListener<DataMap[K]>
): () => void;
export function on<T, K extends string>(
	name: UnregisteredName<K>,
	listener: DataListener<T>
): () => void;
export function on(name: string, listener: DataListener<unknown>): () => void {
	return dataBus.on(name, listener);
}

export function read<K extends keyof DataMap>(name: K): DataMap[K];
export function read<T = unknown>(name: string): T;
export function read(name: string): unknown {
	return dataBus.read(name);
}

export function resetDataBus(): void {
	dataBus.reset();
}

export { DataBus } from './bus';
export { DataBusError, DuplicateDataError, UnknownDataError } from './errors';
export type { Data, DataListener, DataMap, UnregisteredName } from './types';
