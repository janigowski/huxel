import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common';
import type { LightGet, LightPut } from '../types/light';

export interface LightsApi {
	/** `GET /resource/light` */
	list(options?: RequestOptions): Promise<ApiResponse<LightGet>>;
	/** `GET /resource/light/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<LightGet>>;
	/** `PUT /resource/light/{id}` */
	update(id: string, body: LightPut, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `PUT /resource/light` */
	updateMany(body: LightPut[], options?: RequestOptions): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/light';

export function createLightsApi(protocol: HueProtocol): LightsApi {
	return {
		list: (options) => protocol.request('GET', PATH, undefined, options),
		get: (id, options) =>
			protocol.request('GET', `${PATH}/${encodeURIComponent(id)}`, undefined, options),
		update: (id, body, options) =>
			protocol.request('PUT', `${PATH}/${encodeURIComponent(id)}`, body, options),
		updateMany: (body, options) => protocol.request('PUT', PATH, body, options)
	};
}
