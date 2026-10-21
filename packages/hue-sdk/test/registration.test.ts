import { describe, expect, it } from 'vite-plus/test';
import {
	HueApiError,
	HueError,
	HueLinkButtonNotPressedError,
	HueNetworkError,
	HueRateLimitError,
	HueRegistrationError,
	HueResponseError
} from '../src/errors.js';
import { registerApplication } from '../src/registration.js';
import { failingHttpClient, mockHttpClient, parseBody } from './mock-http.js';

const BASE_URL = 'https://192.168.1.100';
const USERNAME = 'secret-username-1028d66426293e821ecfd9ef1a0731df';
const CLIENT_KEY = 'secret-clientkey-8C7F2F7EEFB54B899B54AAC797040EA4';
const success = { success: { username: USERNAME, clientkey: CLIENT_KEY } };
const linkButton = {
	error: { type: 101, address: '', description: 'link button not pressed' }
};

function register(httpClient = mockHttpClient({ body: [success] }), baseUrl = BASE_URL) {
	return registerApplication({
		baseUrl,
		applicationName: 'my_app',
		deviceName: 'laptop',
		httpClient
	});
}

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

function expectNoSecrets(error: Error) {
	const text = [
		String(error),
		JSON.stringify(error),
		error.message,
		error.stack ?? '',
		String(error.cause)
	].join('\n');
	expect(text).not.toContain(USERNAME);
	expect(text).not.toContain(CLIENT_KEY);
}

describe('registerApplication', () => {
	it('sends one unauthenticated POST /api with devicetype and generateclientkey', async () => {
		const httpClient = mockHttpClient({ body: [success] });

		await register(httpClient);

		expect(httpClient.requests).toHaveLength(1);
		expect(httpClient.lastRequest.method).toBe('POST');
		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/api`);
		expect(httpClient.lastRequest.headers).toMatchObject({ 'content-type': 'application/json' });
		expect(httpClient.lastRequest.headers).not.toHaveProperty('hue-application-key');
		expect(parseBody(httpClient.lastRequest)).toEqual({
			devicetype: 'my_app#laptop',
			generateclientkey: true
		});
	});

	it('sends only the application name when deviceName is omitted', async () => {
		const httpClient = mockHttpClient({ body: [success] });

		await registerApplication({ baseUrl: BASE_URL, applicationName: 'my_app', httpClient });

		expect(parseBody(httpClient.lastRequest)).toEqual({
			devicetype: 'my_app',
			generateclientkey: true
		});
	});

	it('does not validate or truncate the device type client-side', async () => {
		const httpClient = mockHttpClient({ body: [success] });
		const applicationName = 'a'.repeat(30);
		const deviceName = 'd'.repeat(30);

		await registerApplication({ baseUrl: BASE_URL, applicationName, deviceName, httpClient });

		expect(parseBody(httpClient.lastRequest)).toMatchObject({
			devicetype: `${applicationName}#${deviceName}`
		});
	});

	it('strips trailing slashes from the base URL', async () => {
		const httpClient = mockHttpClient({ body: [success] });

		await register(httpClient, `${BASE_URL}//`);

		expect(httpClient.lastRequest.url).toBe(`${BASE_URL}/api`);
	});

	it('passes the abort signal to the transport', async () => {
		const httpClient = mockHttpClient({ body: [success] });
		const controller = new AbortController();

		await registerApplication({
			baseUrl: BASE_URL,
			applicationName: 'my_app',
			httpClient,
			signal: controller.signal
		});

		expect(httpClient.lastRequest.signal).toBe(controller.signal);
	});

	it('resolves with username and clientkey', async () => {
		await expect(register()).resolves.toEqual({ username: USERNAME, clientkey: CLIENT_KEY });
	});

	it('does not copy unknown success fields', async () => {
		const httpClient = mockHttpClient({
			body: [{ success: { username: USERNAME, clientkey: CLIENT_KEY, extra: 1 } }]
		});

		await expect(register(httpClient)).resolves.toEqual({
			username: USERNAME,
			clientkey: CLIENT_KEY
		});
	});

	it('throws HueLinkButtonNotPressedError for V1 error 101 returned with HTTP 200', async () => {
		const httpClient = mockHttpClient({ status: 200, body: [linkButton] });

		const error = await caught(register(httpClient));

		expect(error).toBeInstanceOf(HueLinkButtonNotPressedError);
		expect(error).toBeInstanceOf(HueRegistrationError);
		expect(error).toBeInstanceOf(HueError);
		expect(error).toMatchObject({ error: linkButton.error });
	});

	it('does not poll after a link-button error', async () => {
		const httpClient = mockHttpClient({ body: [linkButton] }, { body: [success] });

		await expect(register(httpClient)).rejects.toBeInstanceOf(HueLinkButtonNotPressedError);

		expect(httpClient.requests).toHaveLength(1);
	});

	it('allows the caller to retry with a fresh request', async () => {
		const httpClient = mockHttpClient({ body: [linkButton] }, { body: [success] });

		await expect(register(httpClient)).rejects.toBeInstanceOf(HueLinkButtonNotPressedError);
		await expect(register(httpClient)).resolves.toEqual({
			username: USERNAME,
			clientkey: CLIENT_KEY
		});

		expect(httpClient.requests).toHaveLength(2);
	});

	it('throws HueRegistrationError with the detail for other V1 errors', async () => {
		const detail = { type: 2, address: '/', description: 'body contains invalid json' };
		const httpClient = mockHttpClient({ body: [{ error: detail }] });

		const error = await caught(register(httpClient));

		expect(error).toBeInstanceOf(HueRegistrationError);
		expect(error).not.toBeInstanceOf(HueLinkButtonNotPressedError);
		expect(error).toMatchObject({ error: detail });
		expect(error.message).toContain(detail.description);
	});

	it('reports the first error when several are returned', async () => {
		const first = { type: 7, address: '/devicetype', description: 'invalid value' };
		const second = { type: 2, address: '/', description: 'body contains invalid json' };
		const httpClient = mockHttpClient({ body: [{ error: first }, { error: second }] });

		await expect(register(httpClient)).rejects.toMatchObject({ error: first });
	});

	it('maps HTTP 429 to HueRateLimitError', async () => {
		const httpClient = mockHttpClient({ status: 429, rawBody: 'slow down' });

		const error = await caught(register(httpClient));

		expect(error).toBeInstanceOf(HueRateLimitError);
		expect(error).toMatchObject({ status: 429 });
	});

	it('maps other non-2xx statuses to HueApiError', async () => {
		const httpClient = mockHttpClient({ status: 503, rawBody: 'busy' });

		const error = await caught(register(httpClient));

		expect(error).toBeInstanceOf(HueApiError);
		expect(error).toMatchObject({ status: 503, body: 'busy' });
	});

	it('wraps transport failures in HueNetworkError', async () => {
		const cause = new TypeError('fetch failed');

		const error = await caught(register(failingHttpClient(cause)));

		expect(error).toBeInstanceOf(HueNetworkError);
		expect(error.cause).toBe(cause);
	});

	it('rethrows abort errors unchanged', async () => {
		const abort = new DOMException('The operation was aborted.', 'AbortError');

		await expect(register(failingHttpClient(abort))).rejects.toBe(abort);
	});

	it('rethrows any error once the signal is aborted', async () => {
		const controller = new AbortController();
		const reason = new Error('custom reason');
		controller.abort(reason);

		await expect(
			registerApplication({
				baseUrl: BASE_URL,
				applicationName: 'my_app',
				httpClient: failingHttpClient(reason),
				signal: controller.signal
			})
		).rejects.toBe(reason);
	});

	it.each([
		['non-JSON', { rawBody: 'not json' }],
		['an object', { body: success }],
		['an empty array', { body: [] }],
		['null', { rawBody: 'null' }],
		['an unknown item', { body: [{ other: 1 }] }],
		['a non-object item', { body: ['x'] }],
		['a success without username', { body: [{ success: { clientkey: CLIENT_KEY } }] }],
		['a success without clientkey', { body: [{ success: { username: USERNAME } }] }],
		['a success with non-string values', { body: [{ success: { username: 1, clientkey: 2 } }] }],
		['an error without type', { body: [{ error: { address: '', description: 'x' } }] }],
		['an error without description', { body: [{ error: { type: 1, address: '' } }] }],
		['an error without address', { body: [{ error: { type: 1, description: 'x' } }] }]
	])('throws HueResponseError for %s', async (_name, reply) => {
		const error = await caught(register(mockHttpClient(reply)));

		expect(error).toBeInstanceOf(HueResponseError);
		expect(error).toMatchObject({ status: 200 });
	});

	it('never exposes secrets in errors from malformed success bodies', async () => {
		const errors = await Promise.all([
			caught(register(mockHttpClient({ body: [{ success: { username: USERNAME } }] }))),
			caught(register(mockHttpClient({ rawBody: `{"success":{"username":"${USERNAME}"` }))),
			caught(register(mockHttpClient({ body: { success: { username: USERNAME, clientkey: 5 } } })))
		]);

		for (const error of errors) {
			expect(error).toBeInstanceOf(HueResponseError);
			expect(error).toMatchObject({ body: '' });
			expectNoSecrets(error);
		}
	});

	it('never exposes secrets in other errors', async () => {
		const errors = await Promise.all([
			caught(register(mockHttpClient({ body: [linkButton] }))),
			caught(register(mockHttpClient({ status: 500, rawBody: 'oops' }))),
			caught(register(failingHttpClient(new TypeError('fetch failed'))))
		]);

		for (const error of errors) {
			expectNoSecrets(error);
		}
	});
});
