# data-bus

Named values for talking between an app layer and a UI layer. A value behaves like a signal: you keep it in a `const` or on an object, and you read and write `.value`. The name you give it is the event other modules subscribe to. They do not need the original reference.

Plain objects are proxies, so nested writes publish too. Arrays and class instances are stored as they are: replacing them publishes, mutating them in place does not.

## Install

```bash
bun add data-bus
```

Svelte apps that want reactive reads also install `svelte` (peer dependency, optional for everyone else).

## Define, write, subscribe

```ts
import { data, on, read } from 'data-bus';

const status = data('app.status', 'idle');

const stop = on('app.status', (value) => {
	console.log(value);
});

status.value = 'ready';
read('app.status');

const app = {
	status
};

app.status.value = 'idle';
stop();
```

The first `data(name, initial)` creates the slot. A later `data(name, initial)` throws. `data(name)` returns the existing handle. `on` and `read` throw when the name has not been defined yet.

`data()`, `on()`, and `read()` share one bus for the whole process. `new DataBus()` is a separate bus, useful in tests. `resetDataBus()` clears the shared bus.

## Objects

```ts
const color = data('light.color', { xy: { x: 0.3, y: 0.3 } });

color.value.xy.x = 0.4;
```

Subscribers of `'light.color'` run. The object you passed in is the stored object, so write through `.value` (or through `read`) if something is listening. Assigning the same primitive, or the same property value, does not publish.

## Types

Augment `DataMap` so a name carries its value type everywhere:

```ts
declare module 'data-bus' {
	interface DataMap {
		'app.status': 'idle' | 'loading' | 'ready' | 'error';
		'light.color': { xy: { x: number; y: number } };
	}
}
```

Names that are not in the map are inferred from the initial value.

## Svelte

`data` wraps `on` with Svelte's `createSubscriber`. One call gives a reactive `.value`.

```svelte
<script>
	import { data } from 'data-bus/svelte';

	const status = data('app.status');
</script>

<p>{status.value}</p>
```
