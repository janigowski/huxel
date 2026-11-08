import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common';
import type { ZoneGet, ZonePost, ZonePut } from '../types/zone';

export interface ZonesApi {
	/** `GET /resource/zone` */
	list(options?: RequestOptions): Promise<ApiResponse<ZoneGet>>;
	/** `GET /resource/zone/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<ZoneGet>>;
	/** `POST /resource/zone` */
	create(body: ZonePost, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `PUT /resource/zone/{id}` */
	update(id: string, body: ZonePut, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `DELETE /resource/zone/{id}` */
	delete(id: string, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/zone';

export function createZonesApi(protocol: HueProtocol): ZonesApi {
	return {
		list: (options) => protocol.request('GET', PATH, undefined, options),
		get: (id, options) =>
			protocol.request('GET', `${PATH}/${encodeURIComponent(id)}`, undefined, options),
		create: (body, options) => protocol.request('POST', PATH, body, options),
		update: (id, body, options) =>
			protocol.request('PUT', `${PATH}/${encodeURIComponent(id)}`, body, options),
		delete: (id, options) =>
			protocol.request('DELETE', `${PATH}/${encodeURIComponent(id)}`, undefined, options)
	};
}
