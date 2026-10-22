import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common';
import type { SmartSceneGet, SmartScenePost, SmartScenePut } from '../types/smart-scene';

export interface SmartScenesApi {
	/** `GET /resource/smart_scene` */
	list(options?: RequestOptions): Promise<ApiResponse<SmartSceneGet>>;
	/** `GET /resource/smart_scene/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<SmartSceneGet>>;
	/** `POST /resource/smart_scene` */
	create(body: SmartScenePost, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `PUT /resource/smart_scene/{id}` */
	update(
		id: string,
		body: SmartScenePut,
		options?: RequestOptions
	): Promise<ResourceIdentifierResponse>;
	/** `DELETE /resource/smart_scene/{id}` */
	delete(id: string, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/smart_scene';

export function createSmartScenesApi(protocol: HueProtocol): SmartScenesApi {
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
