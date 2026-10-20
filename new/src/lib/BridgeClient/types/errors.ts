import type { HueError } from './common';

export type BridgeErrorCode =
	| 'bad_request'
	| 'unauthorized'
	| 'forbidden'
	| 'not_found'
	| 'method_not_supported'
	| 'invalid_query'
	| 'conflict'
	| 'rate_limited'
	| 'server_error'
	| 'service_unavailable'
	| 'insufficient_resources'
	| 'unreachable'
	| 'invalid_response'
	| 'unknown';

export interface BridgeError {
	code: BridgeErrorCode;
	message: string;
	errors: HueError[];
}
