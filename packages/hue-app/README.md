# hue-app

Headless, framework agnostic application for controlling Philips Hue lights, built on [`hue-sdk`](../hue-sdk) and [`@preact/signals-core`](https://github.com/preactjs/signals). Runs in Node.js, browsers and browser extensions. Includes optional Svelte 5 and React adapters.

Scope: load lights, rooms and zones, read name, power, brightness and color, toggle power, change brightness and color, and follow changes made elsewhere (Hue app, switches, automations) in real time. Colors are CIE 1931 xy; color temperature, gradients and effects are not supported. No discovery or authentication. Rooms and zones are listed by name.

## Install

```bash
bun add hue-app hue-sdk
```

## CLI / Node.js

```ts
import { createHueApp, hexToXy } from 'hue-app';

const app = createHueApp({ baseUrl: 'https://192.168.1.100', appKey });

await app.initialize();

const light = app.state.lights.get('light-id');
if (!light) throw new Error('Light not found');

const unsubscribe = light.isOn.subscribe((isOn) => {
	console.log(`${light.name.value}: ${isOn ? 'ON' : 'OFF'}`);
});

await app.toggleLight(light.id);
await app.dimLight(light.id, 50);
if (light.color.value) await app.changeColor(light.id, hexToXy('#ff8000'));

unsubscribe();
app.dispose();
```

`createHueApp` creates the `hue-sdk` client itself with `throttle: false`. The SDK's default write throttling can resolve a command with a different request's response and silently drop failures. `hue-app` already limits each light property to one request in flight. Pass `httpClient` to customize the transport, for example to pin the bridge certificate.

## API

```ts
createHueApp(
	({ baseUrl: string; appKey: string; httpClient?: HttpClient } | { gateway: HueGateway }) & {
		live?: boolean;    // default true
		settleMs?: number; // default 1500
	}
): HueApp
describeError(error: unknown): string
hexToXy(hex: string): XyColor   // '#rrggbb' or 'rrggbb', throws TypeError otherwise
xyToHex(color: XyColor): string // '#rrggbb' at full brightness

app.initialize(): Promise<void>
app.toggleLight(lightId: string): Promise<void>
app.dimLight(lightId: string, brightness: number): Promise<void>
app.changeColor(lightId: string, color: XyColor): Promise<void>
app.toggleRoom(roomId: string): Promise<void>
app.dimRoom(roomId: string, brightness: number): Promise<void>
app.changeRoomColor(roomId: string, color: XyColor): Promise<void>
app.toggleZone(zoneId: string): Promise<void>
app.dimZone(zoneId: string, brightness: number): Promise<void>
app.changeZoneColor(zoneId: string, color: XyColor): Promise<void>
app.dispose(): void

app.state.lights.value          // readonly Light[]
app.state.lights.get(id)        // Light | undefined
app.state.lights.subscribe(fn)  // () => void
app.state.rooms.value           // readonly Area[]
app.state.rooms.get(id)         // Area | undefined
app.state.zones.value           // readonly Area[]
app.state.zones.get(id)         // Area | undefined
app.state.status                // ReadonlySignal<'idle' | 'loading' | 'ready' | 'error'>
app.state.error                 // ReadonlySignal<unknown>, error of the last failed initialize()
app.state.connection            // ReadonlySignal<'offline' | 'connecting' | 'live' | 'reconnecting'>

light.id                        // string
light.name                      // ReadonlySignal<string>
light.isOn                      // ReadonlySignal<boolean>
light.brightness                // ReadonlySignal<number | null>, 0–100, null when not dimmable
light.color                     // ReadonlySignal<XyColor | null>, null when the light has no color

interface XyColor { readonly x: number; readonly y: number } // CIE 1931 xy, each 0–1
```

State is read-only: signals are computed, light and color objects are frozen, and mutations only happen through `toggleLight`, `dimLight`, `changeColor` and live sync. `initialize()` loads lights once; concurrent calls share the same load and a call after a failure retries.

`hexToXy` converts an sRGB hex color to xy rounded to 4 decimals, like the bridge reports it; black maps to the D65 white point. `xyToHex` converts back at full brightness, so the result has at least one channel at `ff`. Colors outside the sRGB gamut are clamped. The bridge maps xy into each bulb's own gamut, so the light may look different from the screen.

The `gateway` option accepts any `HueGateway` implementation (`listLights`, `setPower`, `setBrightness`, `setColor` and the optional `watch`). Area commands also need `listAreas`, `setAreaPower`, `setAreaBrightness` and `setAreaColor`. `HueSdkGateway` provides them. A gateway without those methods still loads lights; room and zone collections stay empty.

`describeError` turns an error into a user-facing message, appending each `cause` in parentheses and asking the user to press the link button for `HueLinkButtonNotPressedError`.

## Rooms and zones

`initialize()` loads rooms and zones alongside lights and controls them through the grouped light service each one owns. `app.state.rooms` and `app.state.zones` are sorted by name. The React adapter does not expose the actions. A lights-only gateway makes no area requests, and `toggleRoom` rejects with `AreasUnsupportedError`.

`app.state.rooms` and `app.state.zones` use the same fields as lights, plus `colors`. `isOn` is true when any light in the group is on. Brightness is the bridge average for the lights that are on, or `null` when the group cannot be dimmed. `colors` is a `ReadonlySignal<readonly string[]>` of `#rrggbb` values, one per child light that has a color, in child order. Room children that are devices are resolved to their light services. The list follows those lights' colors. Commands use the same optimistic lanes as lights and never rewrite the individual light objects; those update from their own events.

Unknown ids reject with `RoomNotFoundError` or `ZoneNotFoundError`.

## Optimistic updates

`toggleLight`, `dimLight` and `changeColor` update state synchronously, then send the command. The returned promise resolves when the bridge accepts the command and rejects with the bridge error otherwise.

- Each light has one command lane for power, one for brightness and one for color. At most one request per lane is in flight.
- Commands issued while a request is in flight collapse into one pending command with the latest value. While dragging a slider through 40, 60 and 80, the UI shows 80 immediately and the bridge receives 40 then 80. The caller for 60 settles with the outcome of 80. A color picker behaves the same way.
- A failed command reverts to the latest value reported by the bridge while the command was outstanding, or else to the last value the bridge confirmed, unless a newer command is pending. Older responses never overwrite newer values.
- `dimLight` only changes brightness, never power. Values outside 0–100 reject with `InvalidBrightnessError`; non-dimmable lights reject with `LightNotDimmableError`; unknown ids reject with `LightNotFoundError`.
- `changeColor` only changes color, never power or brightness. Colors whose `x` or `y` is not a number between 0 and 1 reject with `InvalidColorError`; lights without color reject with `LightNotColorCapableError`; unknown ids reject with `LightNotFoundError`. A color equal to the current one, compared by `x` and `y`, does not notify subscribers.

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
- Each batch of events is applied in one signal batch. Events for unknown lights are ignored; an addition for a known light updates it in place. New lights are built from the add event itself, treating missing brightness or color as unsupported; only when the name or power is missing is the light fetched, and updates arriving meanwhile are held and applied on top of the fetched light. If that fetch fails, the light appears only after the next reconnect reload.
- Names apply immediately. Remote power, brightness and color go through the same command lanes as commands and never affect each other:
  - When a lane is idle and outside its settle window, a remote value applies immediately.
  - While a command is in flight or pending, and for `settleMs` after every response, remote values are buffered; only the latest is kept. Once the lane is idle and the window has ended, the buffered value applies if it differs from the current value.
  - The bridge echoes the app's own writes. Dragging a slider through 40, 60 and 80 may echo 40 while 80 is pending; the UI stays at 80, and when the echo of 80 arrives within the window nothing changes. Raise `settleMs` for slow bridges, or set it to `0` to apply buffered values as soon as the lane is idle.
  - A successful command discards remote values buffered before it was sent, since the bridge applied the command after them. Remote values received while it was in flight are kept and follow the settle window.
  - A failed command reverts to the buffered remote value when there is one.

## Dispose

`dispose()` stops the event stream, clears every settle timer and sets `connection` to `'offline'`. It is idempotent and terminal: afterwards `initialize()`, `toggleLight()`, `dimLight()` and `changeColor()` reject with `HueAppDisposedError`, and late events or reload results are ignored. Commands already in flight or pending still run and their promises settle normally. Disposing during the initial load discards its result, rejects that `initialize()` with `HueAppDisposedError` and never starts live sync.

## Svelte 5

```ts
import { createHueApp } from 'hue-app';
import { createSvelteHueApp } from 'hue-app/svelte';

const hue = createSvelteHueApp(createHueApp({ baseUrl, appKey }));
await hue.initialize();

hue.connection; // 'offline' | 'connecting' | 'live' | 'reconnecting'
hue.dispose();
```

```svelte
<script lang="ts">
	import { hexToXy } from 'hue-app';
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

	{#if light.color !== null}
		<button onclick={() => hue.changeColor(lightId, hexToXy('#ff3b30'))}>Red</button>
	{/if}
{/if}
```

The adapter holds no state. Its getters read the core signals and use `createSubscriber` to notify Svelte, subscribing only while a Svelte effect reads them and releasing the subscription when none does. `hue.lights.all` lists every light, `hue.rooms.all` and `hue.zones.all` list rooms and zones by name, and `light.name`, `light.isOn`, `light.brightness` and `light.color` are plain reactive values. `hue.status`, `hue.error` and `hue.connection` mirror the core state. `hue.dispose()` disposes the underlying app. Room and zone commands are `toggleRoom`, `dimRoom`, `changeRoomColor`, `toggleZone`, `dimZone` and `changeZoneColor`.

## React

```tsx
import { memo } from 'react';
import type { HueApp } from 'hue-app';
import { useHueApp, type ReactLight } from 'hue-app/react';

const LightRow = memo(function LightRow({
	light,
	onToggle
}: {
	light: ReactLight;
	onToggle: (lightId: string) => Promise<void>;
}) {
	return (
		<button onClick={() => onToggle(light.id)}>
			{light.isOn ? 'Turn off' : 'Turn on'} {light.name}
		</button>
	);
});

export function Lights({ app }: { app: HueApp }) {
	const hue = useHueApp(app);

	if (hue.status === 'loading') return <p>Loading…</p>;

	return hue.lights.map((light) => (
		<LightRow key={light.id} light={light} onToggle={hue.toggleLight} />
	));
}
```

`useHueApp` subscribes with `useSyncExternalStore` and returns an immutable snapshot of the core state: `lights` in collection order, `status`, `error`, `connection`, and the `initialize`, `toggleLight`, `dimLight`, `changeColor` and `dispose` actions. Each light snapshot includes `color`. Snapshots are derived once per app and shared by every component using it. The `lights` array and each light object keep their identity until they change, so `memo` rows re-render only when their own light changes, and the actions are stable per app. Optimistic updates and rollbacks show up on the next render. Requires React 18 or newer.

## Scripts

```bash
bun run build
bun run check
bun run test
bun run check:universal
```
