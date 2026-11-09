declare module 'bun:test' {
	export function describe(name: string, fn: () => void): void;
	export function test(name: string, fn: () => void | Promise<void>): void;
	export function expect(value: unknown): {
		toBe(expected: unknown): void;
		toEqual(expected: unknown): void;
		toContain(expected: unknown): void;
		toMatch(expected: RegExp): void;
		toThrow(): void;
		not: {
			toContain(expected: unknown): void;
			toMatch(expected: RegExp): void;
		};
	};
}
