# huxel//client

![huxel//client, TypeScript client for the Philips Hue API](./banner.svg)

Stateless TypeScript client for a Philips Hue bridge over [CLIP API v2](https://developers.meethue.com/develop/hue-api-v2/). One runtime dependency, `lodash-es`. The same calls run in browsers, Node.js 18+, and Bun.

## Install

```bash
npm install @huxel/client
```

```bash
bun add @huxel/client
```

## Goals

One client for the Philips Hue API.

- One way to interact with the Philips Hue API. The types and the HTTP calls live here, so the next app does not start from scratch.
- A full mirror of the official API. 10 of 46 resource types are supported (22%), plus discovery, registration, and the bridge event stream (SSE).

This package stores nothing on purpose. Pass the bridge address and the application key in. `@huxel/app` keeps that session in memory and does not write the key down. Saving the key is the application's job.

## API mirror

The percent is resource types in the CLIP v2 notes stored in this repo. A type counts as supported when the client has typed methods for it.

| Area | Progress | Share |
| --- | --- | --- |
| Lights and groups | 2 of 2 · `light`, `grouped_light` | 100% |
| Rooms, zones, home | 3 of 3 · `room`, `zone`, `bridge_home` | 100% |
| Scenes | 2 of 2 · `scene`, `smart_scene` | 100% |
| Bridge and devices | 2 of 2 · `bridge`, `device` | 100% |
| Resource catalog | 1 of 1 · `/resource` | 100% |
| Sensors and input | 0 of 16 | 0% |
| Connectivity and power | 0 of 6 | 0% |
| Behavior | 0 of 3 | 0% |
| Entertainment | 0 of 2 | 0% |
| Matter and HomeKit | 0 of 3 | 0% |
| Configuration and other | 0 of 6 | 0% |
| **All resource types** | **10 of 46** | **22%** |

| Also in the client | Status |
| --- | --- |
| Bridge discovery | Supported |
| Link-button registration | Supported |
| Event stream (SSE) | Supported |
| Entertainment streaming | Not started |

## Bridge address

`discoverBridges` asks `https://discovery.meethue.com/` which bridges are registered for this public IP. It returns the list, or `[]`.

```ts
import { discoverBridges } from '@huxel/client';

const [bridge] = await discoverBridges();
if (!bridge) {
	throw new Error('No Hue bridge found on this network.');
}

const baseUrl = `https://${bridge.internalipaddress}${bridge.port ? `:${bridge.port}` : ''}`;
```

## Browser

The page must be allowed to call the bridge, and the visitor must trust the bridge certificate for that host.

```ts
import { createHueClient } from '@huxel/client';

const hue = createHueClient({
	baseUrl: 'https://192.168.1.100',
	appKey
});

const { data: lights } = await hue.lights.list();

await hue.lights.update(lights[0].id, {
	on: { on: true },
	dimming: { brightness: 80 }
});
```

## Node

Node's `fetch` rejects the bridge certificate. Pass a `fetch` that trusts the Signify Hue root CA. This package leaves that certificate to you.

```ts
import { Agent, fetch as undiciFetch } from 'undici';
import { createFetchHttpClient, createHueClient } from '@huxel/client';

const httpClient = createFetchHttpClient({
	fetch: (input, init) =>
		undiciFetch(input, {
			...init,
			dispatcher: new Agent({ connect: { ca: hueRootCa } })
		})
});

const hue = createHueClient({
	baseUrl: 'https://192.168.1.100',
	appKey,
	httpClient
});
```

On Bun, the same hook is `fetch(input, { ...init, tls: { ca: hueRootCa } })`.

Writes are throttled per resource: 100 ms, and 1 s for a grouped light. Pass `throttle: false` when the caller already sends one write at a time.

## Registration

Press the link button, then call `registerApplication`. It resolves with `{ username, clientkey }` and keeps neither. Pass `username` as `appKey` on the next run. `clientkey` is the Entertainment streaming key.

```ts
import { HueLinkButtonNotPressedError, registerApplication } from '@huxel/client';

try {
	const { username } = await registerApplication({
		baseUrl: 'https://192.168.1.100',
		applicationName: 'my-app',
		deviceName: 'my-device'
	});
	console.log(username);
} catch (error) {
	if (error instanceof HueLinkButtonNotPressedError) {
		throw new Error('Press the link button on the bridge, then try again.');
	}
	throw error;
}
```

## Non-goals

- Storing the bridge address, the application key, or the Entertainment key. `@huxel/app` holds a session in memory. The application that calls it decides where the key is saved.
- A UI, cached light state, or presets.
- Polling the link button, or retrying registration on your behalf.
- Entertainment streaming, and typed calls for sensors, buttons, Matter, and HomeKit. Those resources still show up on the event stream as plain records.

## Documentation

The CLIP v2 notes stored with this package are in [`docs/clip-v2`](./docs/clip-v2/README.md). They cover the bridge resources this client is built against, including discovery and registration.

The official reference is the [Hue CLIP API v2](https://developers.meethue.com/develop/hue-api-v2/). Philips shows that page after you sign in with a Hue developer account.

Release notes are in [CHANGELOG.md](./CHANGELOG.md).
