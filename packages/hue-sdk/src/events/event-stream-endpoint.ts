import { HueError, HueNetworkError } from '../errors';
import type { HttpRequest, HttpStreamResponse } from '../http';
import { trimTrailingSlashes } from '../protocol';
import type { EventsApiConfig } from './events-api';

const EVENT_STREAM_PATH = '/eventstream/clip/v2';

export class EventStreamEndpoint {
	readonly label = `GET ${EVENT_STREAM_PATH}`;
	private readonly url: string;
	private readonly appKey: string;
	private readonly stream: (request: HttpRequest) => Promise<HttpStreamResponse>;

	constructor({ baseUrl, appKey, httpClient }: EventsApiConfig) {
		const stream = httpClient.stream;

		if (!stream) {
			throw new HueError('client.events requires an HttpClient that implements stream()');
		}

		this.url = `${trimTrailingSlashes(baseUrl)}${EVENT_STREAM_PATH}`;
		this.appKey = appKey;
		this.stream = (request) => stream.call(httpClient, request);
	}

	async open(signal: AbortSignal): Promise<HttpStreamResponse> {
		try {
			return await this.stream({
				method: 'GET',
				url: this.url,
				headers: { accept: 'text/event-stream', 'hue-application-key': this.appKey },
				signal
			});
		} catch (error) {
			throw new HueNetworkError(`Network request failed: ${this.label}`, { cause: error });
		}
	}
}
