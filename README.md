# Philips Hue Remote

Libraries and apps for controlling Philips Hue lights over the CLIP API v2.

| Workspace                                      | Description                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [`packages/hue-sdk`](./packages/hue-sdk)       | Typed, environment agnostic SDK for the Hue CLIP API v2           |
| [`packages/hue-app`](./packages/hue-app)       | Headless app state for Hue lights, with Svelte and React adapters |
| [`apps/svelte-hue-app`](./apps/svelte-hue-app) | SvelteKit web dashboard                                           |
| [`apps/tui-hue-app`](./apps/tui-hue-app)       | Terminal remote built with OpenTUI and React                      |

Libraries in `packages/` are meant to be published to npm. Apps in `apps/` are private.

## Development

Requires [Bun](https://bun.sh).

```bash
bun install
bun run build
bun run check
bun run lint
bun run test
```

Root scripts run in every workspace in dependency order, so `hue-sdk` builds before `hue-app`, and both before the apps. Apps consume the libraries' `dist/` builds, so build the libraries before running an app. Run a script in a single workspace with `bun run --filter <name> <script>`.

Formatting is shared across the repository: `bun run format`.
