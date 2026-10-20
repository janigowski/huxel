# hue-app

Headless, framework agnostic application for controlling Philips Hue lights, built on [`hue-sdk`](../hue-sdk) and [`@preact/signals-core`](https://github.com/preactjs/signals). Runs in Node.js, browsers and browser extensions. Includes optional Svelte 5 and React adapters.

Scope: load lights, read power and brightness, toggle power, change brightness. No discovery, authentication, colors, rooms or real-time events.

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
	console.log(`${light.name}: ${isOn ? 'ON' : 'OFF'}`);
});

await app.toggleLight(light.id);
await app.dimLight(light.id, 50);

unsubscribe();
```

Create the `hue-sdk` client with `throttle: false`. The SDK's default write throttling can resolve a command with a different request's response and silently drop failures. `hue-app` already limits each light property to one request in flight.

## API

```ts
createHueApp({ client: HueClient } | { gateway: HueGateway }): HueApp

app.initialize(): Promise<void>
app.toggleLight(lightId: string): Promise<void>
app.dimLight(lightId: string, brightness: number): Promise<void>

app.state.lights.value          // readonly Light[]
app.state.lights.get(id)        // Light | undefined
app.state.lights.subscribe(fn)  // () => void
app.state.status                // ReadonlySignal<'idle' | 'loading' | 'ready' | 'error'>
app.state.error                 // ReadonlySignal<unknown>, error of the last failed initialize()

light.id                        // string
light.name                      // string
light.isOn                      // ReadonlySignal<boolean>
light.brightness                // ReadonlySignal<number | null>, 0–100, null when not dimmable
```

State is read-only: signals are computed, light objects are frozen, and mutations only happen through `toggleLight` and `dimLight`. `initialize()` loads lights once; concurrent calls share the same load and a call after a failure retries.

The `gateway` option accepts any `HueGateway` implementation (`listLights`, `setPower`, `setBrightness`), which is useful for tests.

## Optimistic updates

`toggleLight` and `dimLight` update state synchronously, then send the command. The returned promise resolves when the bridge accepts the command and rejects with the bridge error otherwise.

- Each light has one command lane for power and one for brightness. At most one request per lane is in flight.
- Commands issued while a request is in flight collapse into one pending command with the latest value. While dragging a slider through 40, 60 and 80, the UI shows 80 immediately and the bridge receives 40 then 80. The caller for 60 settles with the outcome of 80.
- A failed command reverts to the last value the bridge confirmed, unless a newer command is pending. Older responses never overwrite newer values.
- `dimLight` only changes brightness, never power. Values outside 0–100 reject with `InvalidBrightnessError`; non-dimmable lights reject with `LightNotDimmableError`; unknown ids reject with `LightNotFoundError`.

## Svelte 5

```ts
import { createHueApp } from 'hue-app';
import { createSvelteHueApp } from 'hue-app/svelte';

const hue = createSvelteHueApp(createHueApp({ client }));
await hue.initialize();
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

The adapter holds no state. Its getters read the core signals and use `createSubscriber` to notify Svelte, subscribing only while a Svelte effect reads them and releasing the subscription when none does. `hue.lights.all` lists every light, and `hue.status` and `hue.error` mirror the core state.

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

`useHueApp` subscribes with `useSyncExternalStore` and returns an immutable snapshot of the core state: `lights` in collection order, `status`, `error`, and the `initialize`, `toggleLight` and `dimLight` actions. Snapshots are derived once per app and shared by every component using it. The `lights` array and each light object keep their identity until they change, so `memo` rows re-render only when their own light changes, and the actions are stable per app. Optimistic updates and rollbacks show up on the next render. Requires React 18 or newer.

## Scripts

```bash
bun run build
bun run check
bun run test
bun run check:universal
```
