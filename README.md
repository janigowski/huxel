# huxel

Libraries and apps for controlling Philips Hue lights over the CLIP API v2.

| Workspace                                            | Description                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------- |
| [`packages/client`](./packages/client)               | Typed, environment agnostic client for the Hue CLIP API v2        |
| [`packages/app`](./packages/app)                     | Headless app state for Hue lights, with Svelte and React adapters |
| [`packages/design-system`](./packages/design-system) | Svelte components and design tokens shared by the Svelte apps     |
| [`apps/svelte-hue-app`](./apps/svelte-hue-app)       | SvelteKit web dashboard                                           |
| [`apps/extension-hue-app`](./apps/extension-hue-app) | Browser extension for Arc and other Chromium browsers             |
| [`apps/tui-hue-app`](./apps/tui-hue-app)             | Terminal remote built with OpenTUI and React                      |
| [`apps/hue-mcp`](./apps/hue-mcp)                     | Local stdio MCP server for an agent on the same network           |

Libraries in `packages/` are meant to be published to npm, except the private `design-system`. Apps in `apps/` are private.

## Development

Requires [Bun](https://bun.sh) and Node.js `^22.18`, `^24.11` or `>=26` (CI uses `.node-version`). Tooling comes from [Vite+](https://viteplus.dev): `vp pack` builds the libraries, `vp test` runs Vitest, and `vp fmt` formats the code.

```bash
bun install
bun run build
bun run check
bun run lint
bun run test
```

Root scripts run in every workspace in dependency order, so `@huxel/client` builds before `@huxel/app`, `@huxel/app` before `design-system`, and all of them before the apps. Apps consume the libraries' `dist/` builds, so build the libraries before running an app. Run a script in a single workspace with `bunx vp run --filter <name> <script>`.

Formatting settings are shared across the repository in the root `vite.config.ts`: `bun run format`.
