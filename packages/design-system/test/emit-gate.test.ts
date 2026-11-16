import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { EmitGate } from '../src/emit-gate';

describe('EmitGate', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('sends the first value immediately and the latest value on the next tick', () => {
		const gate = new EmitGate();
		const sent: number[] = [];

		gate.push(() => sent.push(1));
		gate.push(() => sent.push(2));
		gate.push(() => sent.push(3));

		expect(sent).toEqual([1]);

		vi.advanceTimersByTime(99);
		expect(sent).toEqual([1]);

		vi.advanceTimersByTime(1);
		expect(sent).toEqual([1, 3]);

		vi.advanceTimersByTime(500);
		expect(sent).toEqual([1, 3]);
	});

	it('sends again as soon as the interval has passed', () => {
		const gate = new EmitGate();
		const sent: number[] = [];

		gate.push(() => sent.push(1));
		vi.advanceTimersByTime(100);
		gate.push(() => sent.push(2));

		expect(sent).toEqual([1, 2]);
		vi.advanceTimersByTime(500);
		expect(sent).toEqual([1, 2]);
	});

	it('flush sends the pending value once', () => {
		const gate = new EmitGate();
		const sent: number[] = [];

		gate.push(() => sent.push(1));
		gate.push(() => sent.push(2));
		gate.flush();

		expect(sent).toEqual([1, 2]);
		vi.advanceTimersByTime(200);
		expect(sent).toEqual([1, 2]);
	});
});
