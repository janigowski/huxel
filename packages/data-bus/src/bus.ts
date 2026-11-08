import { DuplicateDataError, UnknownDataError } from './errors';
import { ObjectView, unwrapValue } from './object-view';
import type { Data, DataListener, DataMap, UnregisteredName } from './types';

interface Slot {
	value: unknown;
	readonly listeners: DataListener<unknown>[];
	handle: Data<unknown>;
	view: ObjectView;
}

export class DataBus {
	private readonly slots = new Map<string, Slot>();

	data<K extends keyof DataMap>(name: K, initial?: DataMap[K]): Data<DataMap[K]>;
	data<T, K extends string>(name: UnregisteredName<K>, initial: T): Data<T>;
	data<K extends string>(name: UnregisteredName<K>): Data<unknown>;
	data(name: string, initial?: unknown): Data<unknown> {
		if (arguments.length < 2) {
			return this.lookup(name);
		}

		return this.define(name, initial);
	}

	on<K extends keyof DataMap>(name: K, listener: DataListener<DataMap[K]>): () => void;
	on<T, K extends string>(name: UnregisteredName<K>, listener: DataListener<T>): () => void;
	on(name: string, listener: DataListener<unknown>): () => void {
		const slot = this.require(name);

		slot.listeners.push(listener);

		return () => {
			const index = slot.listeners.indexOf(listener);

			if (index === -1) {
				return;
			}

			slot.listeners.splice(index, 1);
		};
	}

	read<K extends keyof DataMap>(name: K): DataMap[K];
	read<T = unknown>(name: string): T;
	read(name: string): unknown {
		const slot = this.require(name);

		return slot.view.expose(slot.value);
	}

	write<K extends keyof DataMap>(name: K, value: DataMap[K]): void;
	write<T, K extends string>(name: UnregisteredName<K>, value: T): void;
	write(name: string, value: unknown): void {
		const slot = this.require(name);
		const next = unwrapValue(value);

		if (Object.is(slot.value, next)) {
			return;
		}

		slot.value = next;
		this.publish(slot);
	}

	reset(): void {
		this.slots.clear();
	}

	private define(name: string, initial: unknown): Data<unknown> {
		if (this.slots.has(name)) {
			throw new DuplicateDataError(name);
		}

		const slot: Slot = {
			value: unwrapValue(initial),
			listeners: [],
			handle: undefined as unknown as Data<unknown>,
			view: undefined as unknown as ObjectView
		};

		slot.view = new ObjectView(
			() => {
				this.publish(slot);
			},
			(root) => this.slots.get(name) === slot && slot.value === root
		);
		slot.handle = this.createHandle(name);
		this.slots.set(name, slot);

		return slot.handle;
	}

	private lookup(name: string): Data<unknown> {
		return this.require(name).handle;
	}

	private require(name: string): Slot {
		const slot = this.slots.get(name);

		if (!slot) {
			throw new UnknownDataError(name);
		}

		return slot;
	}

	private publish(slot: Slot): void {
		const value = slot.view.expose(slot.value);

		for (const listener of [...slot.listeners]) {
			listener(value);
		}
	}

	private createHandle(name: string): Data<unknown> {
		const target = { name };

		return new Proxy(target, {
			get: (current, property, receiver) => {
				if (property === 'value') {
					return this.read(name);
				}

				return Reflect.get(current, property, receiver);
			},

			set: (_current, property, next) => {
				if (property !== 'value') {
					return false;
				}

				this.write(name, next);

				return true;
			},

			deleteProperty: () => false
		}) as Data<unknown>;
	}
}
