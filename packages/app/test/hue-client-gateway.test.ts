import { createHueClient, HueApiError, HueNetworkError } from '@huxel/client';
import type { HttpClient, HttpRequest, HttpResponse } from '@huxel/client';
import { describe, expect, it } from 'vite-plus/test';
import { GAMUT_C } from '../src/color';
import { HueClientGateway } from '../src/hue-client-gateway';

interface Reply {
	status?: number;
	body: unknown;
}

function fakeHttp(reply: Reply | Error) {
	const requests: HttpRequest[] = [];
	const httpClient: HttpClient = {
		async request(request) {
			requests.push(request);
			if (reply instanceof Error) {
				throw reply;
			}
			return {
				status: reply.status ?? 200,
				headers: {} as HttpResponse['headers'],
				body: JSON.stringify(reply.body)
			};
		}
	};
	return { httpClient, requests };
}

function setup(reply: Reply | Error) {
	const { httpClient, requests } = fakeHttp(reply);
	const client = createHueClient({
		baseUrl: 'https://bridge.local',
		appKey: 'key',
		httpClient,
		throttle: false
	});
	return { gateway: new HueClientGateway(client), requests };
}

const ok = { body: { errors: [], data: [{ rid: 'light-1', rtype: 'light' }] } };

function lightFixture(
	id: string,
	name: string,
	isOn: boolean,
	dimming?: { brightness: number },
	xy?: { x: number; y: number }
) {
	return {
		id,
		type: 'light',
		metadata: { name, archetype: 'classic_bulb', function: 'functional' },
		on: { on: isOn },
		...(dimming ? { dimming } : {}),
		...(xy ? { color: { xy, gamut_type: 'C' } } : {})
	};
}

describe('HueClientGateway', () => {
	describe('listLights', () => {
		it('maps lights and returns null brightness and color for lights without them', async () => {
			const { gateway, requests } = setup({
				body: {
					errors: [],
					data: [
						lightFixture('a', 'Desk', true, { brightness: 54.7 }, { x: 0.4573, y: 0.41 }),
						{
							...lightFixture('b', 'Warm', false, { brightness: 80 }),
							color_temperature: {
								mirek: 447,
								mirek_valid: true,
								mirek_schema: { mirek_minimum: 153, mirek_maximum: 500 }
							}
						},
						lightFixture('c', 'Plug', false)
					]
				}
			});

			await expect(gateway.listLights()).resolves.toEqual([
				{
					id: 'a',
					name: 'Desk',
					isOn: true,
					brightness: 54.7,
					color: { x: 0.4573, y: 0.41 },
					temperature: null,
					gamut: GAMUT_C
				},
				{
					id: 'b',
					name: 'Warm',
					isOn: false,
					brightness: 80,
					color: null,
					temperature: { mirek: 447 },
					mirekRange: { minimum: 153, maximum: 500 }
				},
				{ id: 'c', name: 'Plug', isOn: false, brightness: null, color: null, temperature: null }
			]);
			expect(requests[0]).toMatchObject({
				method: 'GET',
				url: 'https://bridge.local/clip/v2/resource/light'
			});
		});

		it('prefers the reported gamut triangle over gamut type and keeps a narrow mirek schema', async () => {
			const triangle = {
				red: { x: 0.64, y: 0.33 },
				green: { x: 0.3, y: 0.6 },
				blue: { x: 0.15, y: 0.06 }
			};
			const { gateway } = setup({
				body: {
					errors: [],
					data: [
						{
							...lightFixture('a', 'Strip', true, { brightness: 40 }, { x: 0.4, y: 0.4 }),
							color: {
								xy: { x: 0.4, y: 0.4 },
								gamut_type: 'C',
								gamut: triangle
							},
							color_temperature: {
								mirek: null,
								mirek_valid: false,
								mirek_schema: { mirek_minimum: 200, mirek_maximum: 400 }
							}
						}
					]
				}
			});

			await expect(gateway.listLights()).resolves.toEqual([
				{
					id: 'a',
					name: 'Strip',
					isOn: true,
					brightness: 40,
					color: { x: 0.4, y: 0.4 },
					temperature: { mirek: null },
					gamut: triangle,
					mirekRange: { minimum: 200, maximum: 400 }
				}
			]);
		});

		it('rejects on HTTP errors', async () => {
			const { gateway } = setup({
				status: 401,
				body: { errors: [{ description: 'unauthorized user', error_code: 'client_error' }] }
			});

			await expect(gateway.listLights()).rejects.toBeInstanceOf(HueApiError);
		});
	});

	describe('setPower', () => {
		it('sends only the on state', async () => {
			const { gateway, requests } = setup(ok);

			await gateway.setPower('light-1', true);

			expect(requests).toHaveLength(1);
			expect(requests[0]).toMatchObject({
				method: 'PUT',
				url: 'https://bridge.local/clip/v2/resource/light/light-1'
			});
			expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ on: { on: true } });
		});

		it('rejects on HTTP errors', async () => {
			const { gateway } = setup({
				status: 404,
				body: { errors: [{ description: 'not found', error_code: 'client_error' }] }
			});

			await expect(gateway.setPower('missing', false)).rejects.toBeInstanceOf(HueApiError);
		});

		it('rejects on network failures', async () => {
			const { gateway } = setup(new Error('offline'));

			await expect(gateway.setPower('light-1', false)).rejects.toBeInstanceOf(HueNetworkError);
		});

		it('rejects when a successful response carries errors', async () => {
			const errors = [{ description: 'device unreachable', error_code: 'communication_error' }];
			const { gateway } = setup({ body: { errors, data: [] } });

			const error = await gateway.setPower('light-1', true).catch((e: unknown) => e);

			expect(error).toBeInstanceOf(HueApiError);
			expect(error).toMatchObject({ errors });
			expect((error as Error).message).toContain('device unreachable');
		});
	});

	describe('setBrightness', () => {
		it('sends only the brightness without touching power', async () => {
			const { gateway, requests } = setup(ok);

			await gateway.setBrightness('light-1', 42);

			expect(requests).toHaveLength(1);
			expect(requests[0]).toMatchObject({
				method: 'PUT',
				url: 'https://bridge.local/clip/v2/resource/light/light-1'
			});
			expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ dimming: { brightness: 42 } });
		});

		it('rejects on HTTP errors', async () => {
			const { gateway } = setup({
				status: 500,
				body: { errors: [{ description: 'boom', error_code: 'internal_error' }] }
			});

			await expect(gateway.setBrightness('light-1', 10)).rejects.toBeInstanceOf(HueApiError);
		});

		it('rejects when a successful response carries errors', async () => {
			const { gateway } = setup({
				body: {
					errors: [
						{ description: 'dimming not supported', error_code: 'attribute_may_have_no_effect' }
					],
					data: [{ rid: 'light-1', rtype: 'light' }]
				}
			});

			await expect(gateway.setBrightness('light-1', 10)).rejects.toBeInstanceOf(HueApiError);
		});
	});

	describe('setTemperature', () => {
		it('sends only the mirek value', async () => {
			const { gateway, requests } = setup(ok);

			await gateway.setTemperature('light-1', 366);

			expect(requests).toHaveLength(1);
			expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ color_temperature: { mirek: 366 } });
		});
	});

	describe('setColor', () => {
		it('sends only the xy color without touching power or brightness', async () => {
			const { gateway, requests } = setup(ok);

			await gateway.setColor('light-1', { x: 0.64, y: 0.33 });

			expect(requests).toHaveLength(1);
			expect(requests[0]).toMatchObject({
				method: 'PUT',
				url: 'https://bridge.local/clip/v2/resource/light/light-1'
			});
			expect(JSON.parse(requests[0]?.body ?? '')).toEqual({ color: { xy: { x: 0.64, y: 0.33 } } });
		});

		it('rejects on HTTP errors', async () => {
			const { gateway } = setup({
				status: 500,
				body: { errors: [{ description: 'boom', error_code: 'internal_error' }] }
			});

			await expect(gateway.setColor('light-1', { x: 0.3, y: 0.3 })).rejects.toBeInstanceOf(
				HueApiError
			);
		});

		it('rejects when a successful response carries errors', async () => {
			const { gateway } = setup({
				body: {
					errors: [
						{ description: 'color not supported', error_code: 'attribute_may_have_no_effect' }
					],
					data: [{ rid: 'light-1', rtype: 'light' }]
				}
			});

			await expect(gateway.setColor('light-1', { x: 0.3, y: 0.3 })).rejects.toBeInstanceOf(
				HueApiError
			);
		});
	});
});
