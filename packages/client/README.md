# @huxel/client

![Banner: huxel//client, TypeScript client for the Philips Hue API](./banner.jpg)

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
- A one-to-one mirror of the official API, including streaming from the Hue Bridge (SSE).

This package stores nothing on purpose. The bridge address, the application key, and the session belong to `@huxel/app`. `createHueClient` only sends the `baseUrl` and `appKey` you pass in.

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

- Storing the bridge address, the application key, or the Entertainment key. That is `@huxel/app`'s job.
- A UI, cached light state, or presets.
- Polling the link button, or retrying registration on your behalf.
- Entertainment streaming, and typed calls for sensors, buttons, Matter, and HomeKit. Those resources still show up on the event stream as plain records.

## Documentation

The CLIP v2 notes stored with this package are in [`docs/clip-v2`](./docs/clip-v2/README.md). They cover the bridge resources this client is built against, including discovery and registration.

The official reference is the [Hue CLIP API v2](https://developers.meethue.com/develop/hue-api-v2/). Philips shows that page after you sign in with a Hue developer account.

Release notes are in [CHANGELOG.md](./CHANGELOG.md).
