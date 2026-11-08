import type { BridgeLight, HueGateway, LightChangeObserver, XyColor } from '../src/index';

export interface Deferred<T> {
	readonly promise: Promise<T>;
	resolve(value: T): void;
	reject(error: unknown): void;
}

export function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, resolve, reject };
}

export async function flushMicrotasks(rounds = 10): Promise<void> {
	for (let round = 0; round < rounds; round += 1) {
		await Promise.resolve();
	}
}

export interface PowerCall {
	readonly lightId: string;
	readonly isOn: boolean;
	readonly result: Deferred<void>;
}

export interface BrightnessCall {
	readonly lightId: string;
	readonly brightness: number;
	readonly result: Deferred<void>;
}

export interface ColorCall {
	readonly lightId: string;
	readonly color: XyColor;
	readonly result: Deferred<void>;
}

export interface TemperatureCall {
	readonly lightId: string;
	readonly mirek: number;
	readonly result: Deferred<void>;
}

export class FakeGateway implements HueGateway {
	readonly listCalls: Deferred<BridgeLight[]>[] = [];
	readonly powerCalls: PowerCall[] = [];
	readonly brightnessCalls: BrightnessCall[] = [];
	readonly colorCalls: ColorCall[] = [];
	readonly temperatureCalls: TemperatureCall[] = [];
	readonly calls: Array<
		| { readonly method: 'listLights' }
		| { readonly method: 'setPower'; readonly lightId: string; readonly value: boolean }
		| { readonly method: 'setBrightness'; readonly lightId: string; readonly value: number }
		| { readonly method: 'setColor'; readonly lightId: string; readonly value: XyColor }
		| { readonly method: 'setTemperature'; readonly lightId: string; readonly value: number }
	> = [];
	readonly observers: LightChangeObserver[] = [];
	unwatchCalls = 0;

	get observer(): LightChangeObserver {
		const observer = this.observers.at(-1);
		if (!observer) {
			throw new Error('watch() was not called');
		}
		return observer;
	}

	listLights(): Promise<BridgeLight[]> {
		const result = deferred<BridgeLight[]>();
		this.listCalls.push(result);
		this.calls.push({ method: 'listLights' });
		return result.promise;
	}

	setPower(lightId: string, isOn: boolean): Promise<void> {
		const result = deferred<void>();
		this.powerCalls.push({ lightId, isOn, result });
		this.calls.push({ method: 'setPower', lightId, value: isOn });
		return result.promise;
	}

	setBrightness(lightId: string, brightness: number): Promise<void> {
		const result = deferred<void>();
		this.brightnessCalls.push({ lightId, brightness, result });
		this.calls.push({ method: 'setBrightness', lightId, value: brightness });
		return result.promise;
	}

	setColor(lightId: string, color: XyColor): Promise<void> {
		const result = deferred<void>();
		this.colorCalls.push({ lightId, color, result });
		this.calls.push({ method: 'setColor', lightId, value: color });
		return result.promise;
	}

	setTemperature(lightId: string, mirek: number): Promise<void> {
		const result = deferred<void>();
		this.temperatureCalls.push({ lightId, mirek, result });
		this.calls.push({ method: 'setTemperature', lightId, value: mirek });
		return result.promise;
	}

	watch(observer: LightChangeObserver): () => void {
		this.observers.push(observer);
		return () => {
			this.unwatchCalls += 1;
		};
	}
}

export function bridgeLight(overrides: Partial<BridgeLight> = {}): BridgeLight {
	return {
		id: 'desk',
		name: 'Desk',
		isOn: false,
		brightness: 30,
		color: { x: 0.3, y: 0.3 },
		temperature: null,
		...overrides
	};
}
