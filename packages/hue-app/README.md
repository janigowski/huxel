# hue-app

Headless, framework agnostic application for controlling Philips Hue lights, built on [`hue-sdk`](../hue-sdk) and [`@preact/signals-core`](https://github.com/preactjs/signals). Runs in Node.js, browsers and browser extensions. Includes an optional Svelte 5 adapter.

Scope: load lights, read name, power and brightness, toggle power, change brightness, and follow changes made elsewhere (Hue app, switches, automations) in real time. No discovery, authentication, colors or rooms.

## Install

```bash
bun add hue-app hue-sdk
```

## CLI / Node.js

```ts
import { createHueClient } from 'hue-sdk';
import { createHueApp } from 'hue-app';

const client = createHueClient({ baseUrl: 'https://192.168.1.100', appKey, throttle: false });
const app = createHueApp({ client });

await app.initialize();

const light = app.state.lights.get('light-id');
if (!light) throw new Error('Light not found');

const unsubscribe = light.isOn.subscribe((isOn) => {
	console.log(`${light.name.value}: ${isOn ? 'ON' : 'OFF'}`);
});

await app.toggleLight(light.id);
await app.dimLight(light.id, 50);

unsubscribe();
app.dispose();
```

Create the `hue-sdk` client with `throttle: false`. The SDK's default write throttling can resolve a command with a different request's response and silently drop failures. `hue-app` already limits each light property to one request in flight.

## API

```ts
createHueApp(
	({ client: HueClient } | { gateway: HueGateway }) & {
		live?: boolean;    // default true
		settleMs?: number; // default 1500
	}
): HueApp

app.initialize(): Promise<void>
app.toggleLight(lightId: string): Promise<void>
app.dimLight(lightId: string, brightness: number): Promise<void>
app.dispose(): void

app.state.lights.value          // readonly Light[]
app.state.lights.get(id)        // Light | undefined
app.state.lights.subscribe(fn)  // () => void
app.state.status                // ReadonlySignal<'idle' | 'loading' | 'ready' | 'error'>
app.state.error                 // ReadonlySignal<unknown>, error of the last failed initialize()
app.state.connection            // ReadonlySignal<'offline' | 'connecting' | 'live' | 'reconnecting'>

light.id                        // string
light.name                      // ReadonlySignal<string>
light.isOn                      // ReadonlySignal<boolean>
light.brightness                // ReadonlySignal<number | null>, 0–100, null when not dimmable
```

State is read-only: signals are computed, light objects are frozen, and mutations only happen through `toggleLight`, `dimLight` and live sync. `initialize()` loads lights once; concurrent calls share the same load and a call after a failure retries.

The `gateway` option accepts any `HueGateway` implementation (`listLights`, `setPower`, `setBrightness` and the optional `watch`), which is useful for tests.

## Optimistic updates

`toggleLight` and `dimLight` update state synchronously, then send the command. The returned promise resolves when the bridge accepts the command and rejects with the bridge error otherwise.

- Each light has one command lane for power and one for brightness. At most one request per lane is in flight.
- Commands issued while a request is in flight collapse into one pending command with the latest value. While dragging a slider through 40, 60 and 80, the UI shows 80 immediately and the bridge receives 40 then 80. The caller for 60 settles with the outcome of 80.
- A failed command reverts to the latest value reported by the bridge while the command was outstanding, or else to the last value the bridge confirmed, unless a newer command is pending. Older responses never overwrite newer values.
- `dimLight` only changes brightness, never power. Values outside 0–100 reject with `InvalidBrightnessError`; non-dimmable lights reject with `LightNotDimmableError`; unknown ids reject with `LightNotFoundError`.

## Upgrading

- `light.name` is now a `ReadonlySignal<string>` instead of a `string` so renames made elsewhere show up live. Read `light.name.value`, or subscribe to it. In the Svelte adapter `light.name` stays a plain reactive string.
- Live sync is on by default. Call `app.dispose()` when the app is no longer needed, or pass `live: false` to keep the previous behaviour.

## Live sync

After the first successful `initialize()`, the app subscribes to the bridge event stream through `gateway.watch` and keeps `app.state` in sync with changes made outside the app. Live sync is on by default; pass `live: false` to disable it. Gateways without `watch` work as before and `connection` stays `'offline'`.

`app.state.connection` follows the stream:

- `'offline'` before live sync starts and after `dispose()`.
- `'connecting'` as soon as live sync starts watching, until the stream first opens.
- `'live'` while the stream is open and events flow.
- `'reconnecting'` after the stream drops; the SDK retries with backoff and the state returns to `'live'` once reconnected.
- `'offline'` again when the stream stops for good, for example when the bridge rejects the application key with 401 or 403, or when `watch` throws because the HTTP transport cannot stream.

Stream errors themselves are not exposed; a permanent failure only shows up as `connection` going `'offline'`. Recreate the app to try again.

- Every time the stream opens, including reconnects, the app reloads all lights because the bridge does not replay missed events. Existing light objects are kept and updated, new lights are added and missing lights are removed. Only the latest reload is applied, and values or additions and removals received as events while a reload is in flight win over the reloaded snapshot. A failed reload is ignored: current lights, `status` and `error` stay unchanged, events keep flowing and the next reconnect reloads again.
- Each batch of events is applied in one signal batch. Events for unknown lights are ignored; an addition for a known light updates it in place. New lights are built from the add event itself; only when it is incomplete is the light fetched, and updates arriving meanwhile are applied on top of the fetched light.
- Names apply immediately. Remote power and brightness go through the same command lanes as commands and never affect each other:
  - When a lane is idle and outside its settle window, a remote value applies immediately.
  - While a command is in flight or pending, and for `settleMs` after every response, remote values are buffered; only the latest is kept. Once the lane is idle and the window has ended, the buffered value applies if it differs from the current value.
  - The bridge echoes the app's own writes. Dragging a slider through 40, 60 and 80 may echo 40 while 80 is pending; the UI stays at 80, and when the echo of 80 arrives within the window nothing changes. Raise `settleMs` for slow bridges, or set it to `0` to apply buffered values as soon as the lane is idle.
  - A successful command discards remote values buffered before it was sent, since the bridge applied the command after them. Remote values received while it was in flight are kept and follow the settle window.
  - A failed command reverts to the buffered remote value when there is one.

## Dispose

`dispose()` stops the event stream, clears every settle timer and sets `connection` to `'offline'`. It is idempotent and terminal: afterwards `initialize()`, `toggleLight()` and `dimLight()` reject with `HueAppDisposedError`, and late events or reload results are ignored. Commands already in flight or pending still run and their promises settle normally. Disposing during the initial load discards its result, rejects that `initialize()` with `HueAppDisposedError` and never starts live sync.

## Svelte 5

```ts
import { createHueApp } from 'hue-app';
import { createSvelteHueApp } from 'hue-app/svelte';

const hue = createSvelteHueApp(createHueApp({ client }));
await hue.initialize();

hue.connection; // 'offline' | 'connecting' | 'live' | 'reconnecting'
hue.dispose();
```

```svelte
<script lang="ts">
	import type { SvelteHueApp } from 'hue-app/svelte';

	let { hue, lightId }: { hue: SvelteHueApp; lightId: string } = $props();

	const light = $derived(hue.lights.get(lightId));
</script>

{#if light}
	<button onclick={() => hue.toggleLight(lightId)}>
		{light.isOn ? 'Turn off' : 'Turn on'} {light.name}
	</button>

	{#if light.brightness !== null}
		<input
			type="range"
			min="0"
			max="100"
			value={light.brightness}
			oninput={(event) => hue.dimLight(lightId, Number(event.currentTarget.value))}
		/>
	{/if}
{/if}
```

The adapter holds no state. Its getters read the core signals and use `createSubscriber` to notify Svelte, subscribing only while a Svelte effect reads them and releasing the subscription when none does. `hue.lights.all` lists every light, `light.name`, `light.isOn` and `light.brightness` are plain reactive values, and `hue.status`, `hue.error` and `hue.connection` mirror the core state. `hue.dispose()` disposes the underlying app.

## Scripts

```bash
bun run build
bun run check
bun run test
bun run check:universal
```
