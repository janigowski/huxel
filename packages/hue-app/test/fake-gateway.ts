import type { BridgeLight, HueGateway, LightChangeObserver } from '../src/index';

export interface Deferred<T> {
	promise: Promise<T>;
	resolve(value: T): void;
	reject(error: unknown): void;
}

export function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

export class FakeGateway implements HueGateway {
	readonly listCalls: Deferred<BridgeLight[]>[] = [];
	readonly commands: Deferred<void>[] = [];
	readonly observers: LightChangeObserver[] = [];
	unwatchCalls = 0;

	listLights(): Promise<BridgeLight[]> {
		const call = deferred<BridgeLight[]>();
		this.listCalls.push(call);
		return call.promise;
	}

	setPower(): Promise<void> {
		return this.command();
	}

	setBrightness(): Promise<void> {
		return this.command();
	}

	setColor(): Promise<void> {
		return this.command();
	}

	setTemperature(): Promise<void> {
		return this.command();
	}

	watch(observer: LightChangeObserver): () => void {
		this.observers.push(observer);
		return () => {
			this.unwatchCalls += 1;
		};
	}

	private command(): Promise<void> {
		const call = deferred<void>();
		this.commands.push(call);
		return call.promise;
	}
}

export const desk: BridgeLight = {
	id: 'desk',
	name: 'Desk',
	isOn: false,
	brightness: 40,
	color: { x: 0.3, y: 0.3 },
	temperature: null
};
export const lamp: BridgeLight = {
	id: 'lamp',
	name: 'Lamp',
	isOn: true,
	brightness: null,
	color: null,
	temperature: null
};

export function at<T>(items: readonly T[], index: number): T {
	const item = items[index];
	if (item === undefined) {
		throw new Error(`No item at ${index}`);
	}
	return item;
}
