import { describe, expect, it } from 'vite-plus/test';
import {
	HueApiError,
	HueNetworkError,
	HueRateLimitError,
	HueResponseError
} from '../src/errors.js';
import { discoverBridges } from '../src/discovery.js';
import { failingHttpClient, mockHttpClient } from './mock-http.js';

const bridge = { id: '001788fffe100491', internalipaddress: '192.168.2.23', port: 443 };

async function caught(promise: Promise<unknown>): Promise<Error> {
	try {
		await promise;
	} catch (error) {
		if (error instanceof Error) {
			return error;
		}
		throw error;
	}
	throw new Error('Expected promise to reject');
}

describe('discoverBridges', () => {
	it('sends a single unauthenticated GET to the official discovery service', async () => {
		const httpClient = mockHttpClient({ body: [bridge] });

		await discoverBridges({ httpClient });

		expect(httpClient.requests).toHaveLength(1);
		expect(httpClient.lastRequest.method).toBe('GET');
		expect(httpClient.lastRequest.url).toBe('https://discovery.meethue.com/');
		expect(httpClient.lastRequest.body).toBeUndefined();
		expect(httpClient.lastRequest.headers).not.toHaveProperty('hue-application-key');
	});

	it('uses a custom url', async () => {
		const httpClient = mockHttpClient({ body: [] });

		await discoverBridges({ httpClient, url: 'https://example.test/discover' });

		expect(httpClient.lastRequest.url).toBe('https://example.test/discover');
	});

	it('passes the abort signal to the transport', async () => {
		const httpClient = mockHttpClient({ body: [] });
		const controller = new AbortController();

		await discoverBridges({ httpClient, signal: controller.signal });

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});

	it('parses bridges with official field names', async () => {
		const httpClient = mockHttpClient({
			body: [bridge, { id: '001788fffe200492', internalipaddress: '192.168.2.24' }]
		});

		await expect(discoverBridges({ httpClient })).resolves.toEqual([
			bridge,
			{ id: '001788fffe200492', internalipaddress: '192.168.2.24' }
		]);
	});

	it('omits port when the service does not report it', async () => {
		const httpClient = mockHttpClient({
			body: [{ id: 'a', internalipaddress: '10.0.0.2' }]
		});

		const [result] = await discoverBridges({ httpClient });

		expect(result).not.toHaveProperty('port');
	});

	it('does not copy unknown fields', async () => {
		const httpClient = mockHttpClient({ body: [{ ...bridge, name: 'Hue', macaddress: 'x' }] });

		await expect(discoverBridges({ httpClient })).resolves.toEqual([bridge]);
	});

	it('resolves an empty array when no bridges are found', async () => {
		const httpClient = mockHttpClient({ body: [] });

		await expect(discoverBridges({ httpClient })).resolves.toEqual([]);
	});

	it('maps HTTP 429 to HueRateLimitError', async () => {
		const httpClient = mockHttpClient({ status: 429, rawBody: 'Too Many Requests' });

		const error = await caught(discoverBridges({ httpClient }));

		expect(error).toBeInstanceOf(HueRateLimitError);
		expect(error).toMatchObject({ status: 429, errors: [], body: 'Too Many Requests' });
	});

	it('maps other non-2xx statuses to HueApiError', async () => {
		const httpClient = mockHttpClient({ status: 503, rawBody: 'down' });

		const error = await caught(discoverBridges({ httpClient }));

		expect(error).toBeInstanceOf(HueApiError);
		expect(error).not.toBeInstanceOf(HueRateLimitError);
		expect(error).toMatchObject({ status: 503 });
	});

	it('wraps transport failures in HueNetworkError', async () => {
		const cause = new TypeError('fetch failed');

		const error = await caught(discoverBridges({ httpClient: failingHttpClient(cause) }));

		expect(error).toBeInstanceOf(HueNetworkError);
		expect(error.cause).toBe(cause);
	});

	it('rethrows abort errors unchanged', async () => {
		const abort = new DOMException('The operation was aborted.', 'AbortError');

		await expect(discoverBridges({ httpClient: failingHttpClient(abort) })).rejects.toBe(abort);
	});

	it('rethrows any error once the signal is aborted', async () => {
		const controller = new AbortController();
		const reason = new Error('custom reason');
		controller.abort(reason);

		await expect(
			discoverBridges({ httpClient: failingHttpClient(reason), signal: controller.signal })
		).rejects.toBe(reason);
	});

	it('throws HueResponseError for a non-JSON body', async () => {
		const httpClient = mockHttpClient({ rawBody: '<html></html>' });

		const error = await caught(discoverBridges({ httpClient }));

		expect(error).toBeInstanceOf(HueResponseError);
		expect(error).toMatchObject({ status: 200, body: '<html></html>' });
	});

	it.each([
		[{ id: 'a', internalipaddress: '10.0.0.2' }],
		['text'],
		[null],
		[[null]],
		[[{ internalipaddress: '10.0.0.2' }]],
		[[{ id: 'a' }]],
		[[{ id: 1, internalipaddress: '10.0.0.2' }]],
		[[{ id: 'a', internalipaddress: 10 }]],
		[[{ id: 'a', internalipaddress: '10.0.0.2', port: '443' }]],
		[[bridge, { id: 'b' }]]
	])('throws HueResponseError for invalid body %j', async (body) => {
		const httpClient = mockHttpClient({ body });

		await expect(discoverBridges({ httpClient })).rejects.toBeInstanceOf(HueResponseError);
	});
});
