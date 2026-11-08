import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse } from '../types/common';
import type { AnyResourceGet, ResourceListParams } from '../types/resource';

export interface ResourcesApi {
	/** `GET /resource` */
	list(params?: ResourceListParams, options?: RequestOptions): Promise<ApiResponse<AnyResourceGet>>;
}

const PATH = '/resource';

export function createResourcesApi(protocol: HueProtocol): ResourcesApi {
	return {
		list: (params, options) => {
			const types = params?.type === undefined ? [] : [params.type].flat();
			const query = types.length > 0 ? `?type=${types.map(encodeURIComponent).join(',')}` : '';
			return protocol.request('GET', `${PATH}${query}`, undefined, options);
		}
	};
}
