import { describeError } from 'hue-app';
import { HueNetworkError, HueRateLimitError } from 'hue-sdk';
import type { BridgeHostResult } from './bridge-host';

export interface SessionError {
	message: string;
	certificateUrl?: string;
}

type InvalidHostReason = Extract<BridgeHostResult, { ok: false }>['reason'];

export function describeInvalidHost(reason: InvalidHostReason): SessionError {
	if (reason === 'ipv6') {
		return {
			message: 'IPv6 addresses are not supported. Enter the IPv4 address of the bridge instead.'
		};
	}

	return { message: 'Enter the bridge address, for example 192.168.1.10.' };
}

export function unreachableMessage(host: string): string {
	return `Could not reach the bridge at ${host}. Open it in a new tab, accept its certificate, then try again.`;
}

export function accessDeniedMessage(host: string): string {
	return `Access to ${host} was not allowed. The extension needs it to reach the bridge.`;
}

export function describeConnectError(error: unknown, origin: string): SessionError {
	if (error instanceof HueNetworkError) {
		return {
			message: unreachableMessage(new URL(origin).host),
			certificateUrl: `${origin}/`
		};
	}

	return { message: describeError(error) };
}

export function describeDiscoveryError(error: unknown): SessionError {
	if (error instanceof HueRateLimitError) {
		return {
			message: 'Bridge discovery is busy right now. Enter the bridge address instead.'
		};
	}

	if (error instanceof HueNetworkError) {
		return {
			message: 'Could not reach the Hue discovery service. Enter the bridge address instead.'
		};
	}

	return { message: describeError(error) };
}

export function isUnreachable(error: unknown): boolean {
	return error instanceof HueNetworkError;
}
