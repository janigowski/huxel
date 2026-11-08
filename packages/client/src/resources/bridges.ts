import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common';
import type { BridgeGet, BridgePut } from '../types/bridge';

export interface BridgesApi {
	/** `GET /resource/bridge` */
	list(options?: RequestOptions): Promise<ApiResponse<BridgeGet>>;
	/** `GET /resource/bridge/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<BridgeGet>>;
	/** `PUT /resource/bridge/{id}` */
	update(
		id: string,
		body: BridgePut,
		options?: RequestOptions
	): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/bridge';

export function createBridgesApi(protocol: HueProtocol): BridgesApi {
	return {
		list: (options) => protocol.request('GET', PATH, undefined, options),
		get: (id, options) =>
			protocol.request('GET', `${PATH}/${encodeURIComponent(id)}`, undefined, options),
		update: (id, body, options) =>
			protocol.request('PUT', `${PATH}/${encodeURIComponent(id)}`, body, options)
	};
}
