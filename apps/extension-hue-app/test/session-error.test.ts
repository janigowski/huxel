import { HueLinkButtonNotPressedError, HueNetworkError, HueRateLimitError } from 'hue-sdk';
import { describe, expect, it } from 'vite-plus/test';
import {
	describeConnectError,
	describeDiscoveryError,
	describeInvalidHost,
	isUnreachable
} from '../src/bridge/session-error';

const linkButtonNotPressed = new HueLinkButtonNotPressedError('not pressed', {
	type: 101,
	address: '',
	description: 'link button not pressed'
});

describe('describeConnectError', () => {
	it('points to the bridge certificate on network errors', () => {
		const error = describeConnectError(
			new HueNetworkError('Network request failed', { cause: new TypeError('Failed to fetch') }),
			'https://192.168.1.10'
		);

		expect(error.message).toContain('192.168.1.10');
		expect(error.message).toContain('accept its certificate');
		expect(error.certificateUrl).toBe('https://192.168.1.10/');
	});

	it('asks to press the link button', () => {
		expect(describeConnectError(linkButtonNotPressed, 'https://192.168.1.10')).toEqual({
			message: 'Press the link button on the bridge, then connect again.'
		});
	});
});

describe('describeDiscoveryError', () => {
	it('suggests manual entry when discovery is rate limited or unreachable', () => {
		expect(describeDiscoveryError(new HueRateLimitError('429', 429, [])).message).toContain(
			'Enter the bridge address'
		);
		expect(describeDiscoveryError(new HueNetworkError('offline')).message).toContain(
			'Enter the bridge address'
		);
	});
});

describe('describeInvalidHost', () => {
	it('explains that IPv6 is not supported', () => {
		expect(describeInvalidHost('ipv6').message).toContain('IPv6 addresses are not supported');
		expect(describeInvalidHost('invalid').message).toContain('for example 192.168.1.10');
	});
});

describe('isUnreachable', () => {
	it('is true only for network errors', () => {
		expect(isUnreachable(new HueNetworkError('offline'))).toBe(true);
		expect(isUnreachable(linkButtonNotPressed)).toBe(false);
		expect(isUnreachable(undefined)).toBe(false);
	});
});
