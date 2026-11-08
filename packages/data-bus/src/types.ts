export interface DataMap {}

export type UnregisteredName<K extends string> = K extends keyof DataMap ? never : K;

export interface Data<T> {
	readonly name: string;
	value: T;
}

export type DataListener<T> = (value: T) => void;
