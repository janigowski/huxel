import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse } from '../types/common';
import type { BridgeHomeGet } from '../types/bridge-home';

export interface BridgeHomesApi {
	/** `GET /resource/bridge_home` */
	list(options?: RequestOptions): Promise<ApiResponse<BridgeHomeGet>>;
	/** `GET /resource/bridge_home/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<BridgeHomeGet>>;
}

const PATH = '/resource/bridge_home';

export function createBridgeHomesApi(protocol: HueProtocol): BridgeHomesApi {
	return {
		list: (options) => protocol.request('GET', PATH, undefined, options),
		get: (id, options) =>
			protocol.request('GET', `${PATH}/${encodeURIComponent(id)}`, undefined, options)
	};
}
