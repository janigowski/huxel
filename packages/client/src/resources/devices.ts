import type { HueProtocol, RequestOptions } from '../protocol';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common';
import type { DeviceGet, DevicePut } from '../types/device';

export interface DevicesApi {
	/** `GET /resource/device` */
	list(options?: RequestOptions): Promise<ApiResponse<DeviceGet>>;
	/** `GET /resource/device/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<DeviceGet>>;
	/** `PUT /resource/device/{id}` */
	update(
		id: string,
		body: DevicePut,
		options?: RequestOptions
	): Promise<ResourceIdentifierResponse>;
	/** `DELETE /resource/device/{id}` */
	delete(id: string, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/device';

export function createDevicesApi(protocol: HueProtocol): DevicesApi {
	return {
		list: (options) => protocol.request('GET', PATH, undefined, options),
		get: (id, options) =>
			protocol.request('GET', `${PATH}/${encodeURIComponent(id)}`, undefined, options),
		update: (id, body, options) =>
			protocol.request('PUT', `${PATH}/${encodeURIComponent(id)}`, body, options),
		delete: (id, options) =>
			protocol.request('DELETE', `${PATH}/${encodeURIComponent(id)}`, undefined, options)
	};
}
