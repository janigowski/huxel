import { describe, expect, it } from 'vite-plus/test';
import {
	bridgeOrigin,
	formatDiscoveredHost,
	hostPermissionPattern,
	parseBridgeHost,
	parseBridgeHostInput
} from '../src/bridge/bridge-host';

describe('parseBridgeHost', () => {
	it.each([
		['192.168.1.10', '192.168.1.10'],
		['  192.168.1.10  ', '192.168.1.10'],
		['https://192.168.1.10', '192.168.1.10'],
		['https://192.168.1.10/', '192.168.1.10'],
		['http://192.168.1.10', '192.168.1.10'],
		['192.168.1.10:443', '192.168.1.10'],
		['192.168.1.10:8443', '192.168.1.10:8443'],
		['https://192.168.1.10:8443/', '192.168.1.10:8443'],
		['Hue-Bridge.local', 'hue-bridge.local']
	])('normalizes %j to %j', (input, expected) => {
		expect(parseBridgeHost(input)).toBe(expected);
	});

	it.each([
		'',
		'   ',
		'ftp://192.168.1.10',
		'https://user:secret@192.168.1.10',
		'192.168.1.10/api',
		'192.168.1.10?x=1',
		'https://',
		'192.168.1.10:99999',
		'[fe80::1]',
		'fe80::1'
	])('rejects %j', (input) => {
		expect(parseBridgeHost(input)).toBeNull();
	});
});

describe('parseBridgeHostInput', () => {
	it('explains why an address was rejected', () => {
		expect(parseBridgeHostInput(' ')).toEqual({ ok: false, reason: 'empty' });
		expect(parseBridgeHostInput('192.168.1.10/api')).toEqual({ ok: false, reason: 'invalid' });
		expect(parseBridgeHostInput('fe80::1')).toEqual({ ok: false, reason: 'ipv6' });
		expect(parseBridgeHostInput('::1')).toEqual({ ok: false, reason: 'ipv6' });
		expect(parseBridgeHostInput('https://[fe80::1]:8443/')).toEqual({ ok: false, reason: 'ipv6' });
	});

	it('returns the normalized host', () => {
		expect(parseBridgeHostInput('https://192.168.1.10/')).toEqual({
			ok: true,
			host: '192.168.1.10'
		});
	});
});

describe('formatDiscoveredHost', () => {
	it('omits the default https port and keeps a custom one', () => {
		expect(formatDiscoveredHost('192.168.1.10', 443)).toBe('192.168.1.10');
		expect(formatDiscoveredHost('192.168.1.10', 8443)).toBe('192.168.1.10:8443');
		expect(formatDiscoveredHost('192.168.1.10')).toBe('192.168.1.10');
	});

	it('rejects IPv6 addresses', () => {
		expect(formatDiscoveredHost('fe80::1')).toBeNull();
	});
});

describe('bridgeOrigin and hostPermissionPattern', () => {
	it('builds an https origin and a port independent permission pattern', () => {
		const origin = bridgeOrigin('192.168.1.10:8443');

		expect(origin).toBe('https://192.168.1.10:8443');
		expect(hostPermissionPattern(origin)).toBe('https://192.168.1.10/*');
	});
});
