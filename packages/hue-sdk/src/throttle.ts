import { throttle } from 'lodash-es';
import type { HttpClient, HttpRequest, HttpResponse } from './http.js';

const LIGHT_WAIT_MS = 100;
const GROUP_WAIT_MS = 1000;

type Send = (request: HttpRequest) => Promise<HttpResponse>;

export function createThrottledHttpClient(inner: HttpClient): HttpClient {
	const senders = new Map<string, Send>();

	return {
		request(request) {
			if (request.method !== 'PUT') {
				return inner.request(request);
			}
			let send = senders.get(request.url);
			if (!send) {
				const wait = request.url.includes('/resource/grouped_light')
					? GROUP_WAIT_MS
					: LIGHT_WAIT_MS;
				send = throttle((next: HttpRequest) => inner.request(next), wait) as Send;
				senders.set(request.url, send);
			}
			return send(request);
		}
	};
}
