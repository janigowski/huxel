import { describe, expect, it } from 'vitest';
import { bridgeTail, gradientOpacity, indexLabel, levelLabel, padCount } from './readout';

describe('readout', () => {
	it('pads indexes and counts to two digits', () => {
		expect(indexLabel(0)).toBe('01');
		expect(indexLabel(11)).toBe('12');
		expect(padCount(0)).toBe('00');
		expect(padCount(8)).toBe('08');
	});

	it('reads a powered-off level as zero', () => {
		expect(levelLabel(false, 40)).toBe(0);
		expect(levelLabel(true, null)).toBe(100);
		expect(levelLabel(true, 12.4)).toBe(12);
	});

	it('keeps a visible floor on the gradient and reaches full strength at 100%', () => {
		expect(gradientOpacity(false, 100)).toBe(0.28);
		expect(gradientOpacity(true, 0)).toBe(0.35);
		expect(gradientOpacity(true, 100)).toBe(1);
		expect(gradientOpacity(true, null)).toBe(1);
	});

	it('uses the last four characters of a bridge id', () => {
		expect(bridgeTail('001788fffe7d45eb')).toBe('45EB');
	});
});
