import type { HueProtocol, RequestOptions } from '../protocol.js';
import type { ApiResponse, ResourceIdentifierResponse } from '../types/common.js';
import type { RoomGet, RoomPost, RoomPut } from '../types/room.js';

export interface RoomsApi {
	/** `GET /resource/room` */
	list(options?: RequestOptions): Promise<ApiResponse<RoomGet>>;
	/** `GET /resource/room/{id}` */
	get(id: string, options?: RequestOptions): Promise<ApiResponse<RoomGet>>;
	/** `POST /resource/room` */
	create(body: RoomPost, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `PUT /resource/room/{id}` */
	update(id: string, body: RoomPut, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
	/** `DELETE /resource/room/{id}` */
	delete(id: string, options?: RequestOptions): Promise<ResourceIdentifierResponse>;
}

const PATH = '/resource/room';

export function createRoomsApi(protocol: HueProtocol): RoomsApi {
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
