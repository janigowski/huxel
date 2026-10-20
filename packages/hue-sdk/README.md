# hue-sdk

Typed, environment-agnostic TypeScript SDK for the Philips Hue [CLIP API v2](https://developers.meethue.com/). ESM-only, zero runtime dependencies. Runs in browsers, Node.js 18+, and Bun.

## Install

```bash
bun add hue-sdk
```

```bash
npm install hue-sdk
```

## Quick start

Discovery is optional; you can always pass a bridge address you already know.

```ts
import {
	createHueClient,
	createFetchHttpClient,
	discoverBridges,
	HueLinkButtonNotPressedError,
	registerApplication
} from 'hue-sdk';

const [bridge] = await discoverBridges();
const baseUrl = bridge
	? `https://${bridge.internalipaddress}${bridge.port ? `:${bridge.port}` : ''}`
	: 'https://192.168.1.100';

let username: string;
try {
	({ username } = await registerApplication({
		baseUrl,
		applicationName: 'my-app',
		deviceName: 'my-device'
	}));
} catch (error) {
	if (error instanceof HueLinkButtonNotPressedError) {
		throw new Error('Press the link button on the bridge, then try again.');
	}
	throw error;
}

const hue = createHueClient({ baseUrl, appKey: username });

const { data: lights } = await hue.lights.list();
console.log(lights.map((l) => l.metadata.name));

await hue.lights.update(lights[0].id, {
	on: { on: true },
	dimming: { brightness: 80 },
	color: { xy: { x: 0.369, y: 0.445 } }
});
```

Press the bridge link button before calling `registerApplication`. The SDK performs a single registration request (no polling), never stores credentials, and expects you to pass the returned `username` as `appKey`.

## Client

```ts
createHueClient({ baseUrl, appKey, httpClient? }) => HueClient
```

| Property        | Methods                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `lights`        | `list`, `get`, `update`, `updateMany`                                    |
| `groupedLights` | `list`, `get`, `update`                                                  |
| `rooms`         | `list`, `get`, `create`, `update`, `delete`                              |
| `zones`         | `list`, `get`, `create`, `update`, `delete`                              |
| `scenes`        | `list`, `get`, `create`, `update`, `delete`                              |
| `smartScenes`   | `list`, `get`, `create`, `update`, `delete`                              |
| `devices`       | `list`, `get`, `update`, `delete`                                        |
| `bridges`       | `list`, `get`, `update`                                                  |
| `bridgeHomes`   | `list`, `get`                                                            |
| `resources`     | `list({ type? })` — `GET /resource`, optional comma-joined `type` filter |

- `baseUrl` is the bridge origin (e.g. `https://192.168.1.100`); `/clip/v2` is appended automatically.
- Every method accepts an optional last argument `{ signal?: AbortSignal }`.

### Response shape

All CLIP v2 calls resolve to the full envelope `{ errors: ApiError[]; data: T[] }`. The SDK does not unwrap `data`. HTTP **207** partial success still resolves; inspect `response.errors`. Non-fatal errors returned inside **200** responses are preserved in `errors`.

### Types

Resource representations follow Hue naming: `<Name>Get` for GET bodies, `<Name>Put` / `<Name>Post` for writes. Shared types include `ApiResponse`, `ApiError`, `ResourceIdentifier`, `ResourceIdentifierResponse`, and `XYColor`.

## Discovery and registration

```ts
discoverBridges({ httpClient?, signal? }) => Promise<DiscoveredBridge[]>
```

Queries `https://discovery.meethue.com/` (rate-limited). Returns `{ id, internalipaddress, port? }[]`, or `[]` when no bridges are reported.

```ts
registerApplication({ baseUrl, applicationName, deviceName?, httpClient?, signal? })
  => Promise<{ username: string; clientkey: string }>
```

Uses V1 `POST /api` on the bridge origin (not `/clip/v2`). Catch `HueLinkButtonNotPressedError` to prompt the user and retry after pressing the link button.

## Error handling

All SDK errors extend `HueError`.

| Class                          | When                                                       |
| ------------------------------ | ---------------------------------------------------------- |
| `HueApiError`                  | Non-2xx HTTP (`status`, `errors`, optional `body`)         |
| `HueUnauthorizedError`         | 401                                                        |
| `HueForbiddenError`            | 403                                                        |
| `HueNotFoundError`             | 404                                                        |
| `HueRateLimitError`            | 429                                                        |
| `HueNetworkError`              | Transport failure; original error on `cause`               |
| `HueResponseError`             | 2xx but non-JSON or unexpected envelope (`status`, `body`) |
| `HueRegistrationError`         | V1 registration failed                                     |
| `HueLinkButtonNotPressedError` | V1 error type **101** (link button not pressed)            |

`AbortError` from cancelled requests is rethrown unchanged.

```ts
import { HueApiError, HueNotFoundError } from 'hue-sdk';

try {
	await hue.lights.get('unknown-id');
} catch (error) {
	if (error instanceof HueNotFoundError) {
		// 404 from the bridge
	}
	if (error instanceof HueApiError) {
		console.error(error.status, error.errors);
	}
}
```

### Partial success

```ts
const response = await hue.lights.updateMany([
	{ id: 'a', on: { on: true } },
	{ id: 'bad', on: { on: true } }
]);
if (response.errors.length > 0) {
	console.warn('Some updates failed:', response.errors);
}
console.log('Applied:', response.data);
```

## Cancellation

Pass `AbortSignal` as the last argument:

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 5_000);
await hue.lights.list({ signal: controller.signal });
```

## Custom transport

```ts
interface HttpClient {
	request(req: HttpRequest): Promise<HttpResponse>;
}

interface HttpRequest {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE';
	url: string;
	headers?: Record<string, string>;
	body?: string;
	signal?: AbortSignal;
}

interface HttpResponse {
	status: number;
	headers: Headers;
	body: string;
}
```

Implementations must **resolve** for every HTTP status and **reject** only on network failure or abort. Default: `createFetchHttpClient({ fetch? })`.

Logging wrapper (illustrative):

```ts
import { createFetchHttpClient, createHueClient, type HttpClient } from 'hue-sdk';

function withLogging(inner: HttpClient): HttpClient {
	return {
		async request(req) {
			console.log(req.method, req.url);
			const res = await inner.request(req);
			console.log(res.status);
			return res;
		}
	};
}

const hue = createHueClient({
	baseUrl: 'https://192.168.1.100',
	appKey: '…',
	httpClient: withLogging(createFetchHttpClient())
});
```

In Node, you can pass a custom `fetch` (e.g. undici with a `dispatcher` that trusts the Hue root CA). This is environment-specific; the SDK does not ship CA bundles or disable TLS verification.

## Resource coverage

| Covered in this package                                                                                                 | Not covered yet                                                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `light`, `grouped_light`, `room`, `zone`, `scene`, `smart_scene`, `device`, `bridge`, `bridge_home`, generic `resource` | `motion`, `temperature`, `light_level`, `button`, `relative_rotary`, `device_power`, `zigbee_connectivity`, `entertainment`, `entertainment_configuration`, `behavior_script`, `behavior_instance`, `geofence_client`, `geolocation`, `homekit`, `matter`, `service_group`, and other CLIP v2 resource types |
|                                                                                                                         | `/eventstream` (SSE)                                                                                                                                                                                                                                                                                         |
|                                                                                                                         | Entertainment streaming                                                                                                                                                                                                                                                                                      |

## Networking limitations

- The bridge serves **HTTPS** with a certificate signed by Signify’s private CA. Browsers require the user to trust or accept that certificate for the bridge host. Node and Bun need a custom transport configured with the Hue root CA. The SDK never disables TLS verification.
- Browser **CORS** policies apply to requests to the bridge and to `discovery.meethue.com`; behavior depends on the environment (e.g. extensions with host permissions can avoid some restrictions).

## Validation

There is no runtime schema validation of request bodies or `data` items. The SDK checks that responses match the CLIP v2 envelope shape (`errors` + `data`). Field constraints are enforced by the bridge; JSDoc on types documents Hue-documented limits where applicable.

## Versioning

This package uses [semantic versioning](https://semver.org/) independently of Hue’s API version. It targets **CLIP v2 only**.

- **Minor**: new optional fields or endpoints.
- **Patch**: internal fixes, no breaking change to the public SDK contract.
- **Major**: breaking changes to exported APIs or behavior guaranteed by this package.

See [CHANGELOG.md](./CHANGELOG.md).
