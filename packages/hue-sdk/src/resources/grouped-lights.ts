import type { HueProtocol, RequestOptions } from '../protocol.js';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common.js';
import type { GroupedLightGet, GroupedLightPut } from '../types/grouped-light.js';

export interface GroupedLightsApi {
	/** `GET /resource/grouped_light` */
	list(options?: RequestOptions): Promise<ApiResponse<GroupedLightGet>>;
	/** `GET /resource/grouped_light/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<GroupedLightGet>>;
	/** `PUT /resource/grouped_light/{id}` */
	update(
		id: string,
		body: GroupedLightPut,
		options?: RequestOptions
	): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/grouped_light';

export function createGroupedLightsApi(protocol: HueProtocol): GroupedLightsApi {
	return {
		list: (options) => protocol.request('GET', PATH, undefined, options),
		get: (id, options) =>
			protocol.request('GET', `${PATH}/${encodeURIComponent(id)}`, undefined, options),
		update: (id, body, options) =>
			protocol.request('PUT', `${PATH}/${encodeURIComponent(id)}`, body, options)
	};
}
