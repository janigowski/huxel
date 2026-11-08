import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common';
import type { SceneGet, ScenePost, ScenePut } from '../types/scene';

export interface ScenesApi {
	/** `GET /resource/scene` */
	list(options?: RequestOptions): Promise<ApiResponse<SceneGet>>;
	/** `GET /resource/scene/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<SceneGet>>;
	/** `POST /resource/scene` */
	create(body: ScenePost, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `PUT /resource/scene/{id}` */
	update(id: string, body: ScenePut, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `DELETE /resource/scene/{id}` */
	delete(id: string, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/scene';

export function createScenesApi(protocol: HueProtocol): ScenesApi {
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
