import { describe, expect, it } from 'vitest';
import {
	createHueClient,
	HueApiError,
	HueError,
	HueForbiddenError,
	HueNetworkError,
	HueNotFoundError,
	HueRateLimitError,
	HueResponseError,
	HueUnauthorizedError
} from '../src/index.js';
import type { HttpClient } from '../src/index.js';
import { envelope, failingHttpClient, mockHttpClient } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const APP_KEY = 'secret-app-key';

function client(httpClient: HttpClient, baseUrl = BASE_URL) {
	return createHueClient({ baseUrl, appKey: APP_KEY, httpClient });
}

const apiError = { description: 'device (light) is "soft off"', error_code: 'client_error' };

describe('protocol', () => {
	it('strips trailing slashes from the base URL', async () => {
		const httpClient = mockHttpClient({ body: envelope([]) });

		await client(httpClient, `${BASE_URL}//`).lights.list();

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/clip/v2/resource/light`);
	});

	it('does not send a content-type header without a body', async () => {
		const httpClient = mockHttpClient({ body: envelope([]) });

		await client(httpClient).lights.list();

		expect(httpClient.lastRequest.headers).not.toHaveProperty('content-type');
	});

	it('resolves HTTP 207 partial success with both data and errors', async () => {
		const data = [{ rid: '3f2f5bd8-7d9a-4b5e-9c1e-6a1b2c3d4e5f', rtype: 'light' }];
		const httpClient = mockHttpClient({ status: 207, body: { errors: [apiError], data } });

		const response = await client(httpClient).lights.update('id', { on: { on: true } });

		expect(response).toEqual({ errors: [apiError], data });
	});

	it('preserves errors inside HTTP 200 responses', async () => {
		const httpClient = mockHttpClient({ body: { errors: [apiError], data: [] } });

		const response = await client(httpClient).lights.list();

		expect(response.errors).toEqual([apiError]);
	});

	it.each([
		[401, HueUnauthorizedError],
		[403, HueForbiddenError],
		[404, HueNotFoundError],
		[429, HueRateLimitError],
		[400, HueApiError],
		[409, HueApiError],
		[500, HueApiError],
		[503, HueApiError],
		[507, HueApiError]
	])('maps HTTP %i to %o', async (status, ErrorClass) => {
		const httpClient = mockHttpClient({ status, body: { errors: [apiError] } });

		const error = await client(httpClient)
			.lights.list()
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ErrorClass);
		expect(error).toBeInstanceOf(HueApiError);
		expect(error).toBeInstanceOf(HueError);
		expect(error).toMatchObject({ status, errors: [apiError] });
		expect((error as Error).name).toBe(ErrorClass.name);
		expect((error as Error).message).toContain(apiError.description);
	});

	it('keeps the raw body when an error response is not JSON', async () => {
		const httpClient = mockHttpClient({ status: 503, rawBody: '<html>Busy</html>' });

		const error = await client(httpClient)
			.lights.list()
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(HueApiError);
		expect(error).toMatchObject({ status: 503, errors: [], body: '<html>Busy</html>' });
	});

	it('throws HueResponseError for a non-JSON success body', async () => {
		const httpClient = mockHttpClient({ status: 200, rawBody: 'not json' });

		const error = await client(httpClient)
			.lights.list()
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(HueResponseError);
		expect(error).toMatchObject({ status: 200, body: 'not json' });
		expect((error as Error).cause).toBeInstanceOf(SyntaxError);
	});

	it.each([[{ data: [] }], [{ errors: [] }], [[]], [{ errors: [{}], data: [] }]])(
		'throws HueResponseError for an invalid envelope %j',
		async (body) => {
			const httpClient = mockHttpClient({ body });

			await expect(client(httpClient).lights.list()).rejects.toBeInstanceOf(HueResponseError);
		}
	);

	it('wraps transport failures in HueNetworkError with the original cause', async () => {
		const cause = new TypeError('fetch failed');

		const error = await client(failingHttpClient(cause))
			.lights.list()
			.catch((e: unknown) => e);

		expect(error).toBeInstanceOf(HueNetworkError);
		expect(error).not.toBeInstanceOf(HueApiError);
		expect((error as Error).cause).toBe(cause);
	});

	it('rethrows abort errors unchanged', async () => {
		const abort = new DOMException('The operation was aborted.', 'AbortError');

		await expect(client(failingHttpClient(abort)).lights.list()).rejects.toBe(abort);
	});

	it('rethrows any error once the signal is aborted', async () => {
		const controller = new AbortController();
		const reason = new Error('custom reason');
		controller.abort(reason);

		await expect(
			client(failingHttpClient(reason)).lights.list({ signal: controller.signal })
		).rejects.toBe(reason);
	});

	it('never exposes the application key in error messages', async () => {
		const errors = await Promise.all([
			client(mockHttpClient({ status: 401, body: { errors: [] } }))
				.lights.list()
				.catch((e: unknown) => e),
			client(failingHttpClient(new TypeError('fetch failed')))
				.lights.list()
				.catch((e: unknown) => e),
			client(mockHttpClient({ rawBody: 'x' }))
				.lights.list()
				.catch((e: unknown) => e)
		]);

		for (const error of errors) {
			expect(JSON.stringify(error)).not.toContain(APP_KEY);
			expect(String(error)).not.toContain(APP_KEY);
		}
	});

	it('uses the injected transport instead of fetch', async () => {
		const httpClient = mockHttpClient({ body: envelope([]) });

		await client(httpClient).lights.list();

		expect(httpClient.requests).toHaveLength(1);
	});
});
