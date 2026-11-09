declare module 'bun:test' {
	interface Matchers {
		toBe(expected: unknown): void;
		toContain(expected: unknown): void;
		toBeGreaterThan(expected: number): void;
		toBeGreaterThanOrEqual(expected: number): void;
		not: {
			toContain(expected: unknown): void;
		};
	}

	export function describe(name: string, fn: () => void): void;
	export function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
	export function expect(actual: unknown): Matchers;
}
