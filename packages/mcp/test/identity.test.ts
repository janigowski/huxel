import { describe, expect, test } from 'bun:test';
import { checkBridgeIdentity } from '../src/bridge/identity';

describe('checkBridgeIdentity', () => {
	test('accepts a certificate issued for the bridge id', () => {
		expect(
			checkBridgeIdentity('001788fffe7d45eb', { subject: { CN: '001788fffe7d45eb' } })
		).toBeUndefined();
	});

	test('compares ids case-insensitively', () => {
		expect(
			checkBridgeIdentity('001788fffe7d45eb', { subject: { CN: '001788FFFE7D45EB' } })
		).toBeUndefined();
	});

	test('rejects a certificate for another bridge', () => {
		const error = checkBridgeIdentity('001788fffe7d45eb', { subject: { CN: '001788FFFE000000' } });

		expect(error).toBeInstanceOf(Error);
		expect(error?.message).toContain('001788FFFE000000');
	});

	test('rejects a certificate without a common name', () => {
		expect(checkBridgeIdentity('001788fffe7d45eb', { subject: {} })).toBeInstanceOf(Error);
		expect(checkBridgeIdentity('001788fffe7d45eb', {})).toBeInstanceOf(Error);
	});
});
