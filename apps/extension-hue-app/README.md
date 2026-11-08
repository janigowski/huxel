# extension-hue-app

Chromium browser extension (Arc, Chrome) for Philips Hue lights: link a bridge on the local network, then toggle, dim and recolor lights from the toolbar popup. It is a Svelte 5 + Vite app built from the shared [`design-system`](../../packages/design-system) components on top of [`hue-app`](../../packages/hue-app) and [`@huxel/client`](../../packages/client). The extension is not published to a store. You load it unpacked.

## Setup

Workspace dependencies resolve to their `dist/` builds, so build them first from the repository root:

```bash
bun install
bun run --filter @huxel/client --filter hue-app --filter design-system build
```

## Mock preview

```bash
bun run dev
```

This opens the popup in a normal browser tab, in a popup-sized frame with hot reload. It needs no extension and no bridge. Storage and host access are in memory (every request is granted), and the simulated bridge has a few lights. Click **Find** to discover `192.168.1.2`, then **Allow access**. The first **Connect bridge** shows the link button message and the second one links. Any other address simulates an unreachable bridge, so you can see the certificate hint.

## Load in Arc

```bash
bun run watch
```

1. Open `arc://extensions` (`chrome://extensions` in Chrome) and turn on **Developer mode**.
2. Click **Load unpacked** and select `apps/extension-hue-app/dist`.
3. Pin **Hue Remote**. `watch` rebuilds on every change, and you see the result when you reopen the popup. Click reload on the extensions page only after changing `public/manifest.json`.

To develop from several git worktrees without reloading the extension from a different folder each time, run `bun run watch:shared` instead and load `~/Documents/Extensions/hue-remote` once. It builds into that fixed folder from whichever worktree runs it, so run it in only one worktree at a time.

## Linking a bridge

1. The bridge uses a certificate the browser does not trust. Open `https://<bridge address>` in a tab, choose **Advanced** and then **Proceed**, and close the tab. If you skip this, the popup links to the bridge when it cannot reach it.
2. Open the popup, click **Find** or type the bridge address (an IPv4 address or hostname, for example `192.168.1.10`), then click **Allow access to …** and accept the browser prompt. If the prompt closes the popup, reopen it: it remembers the address and continues at the next step. You can also grant access under the extension's **Details** → **Site access**.
3. Press the link button on the bridge, then click **Connect bridge** within 30 seconds.

The application key is stored in `chrome.storage.local`. **Forget bridge** removes it. If the bridge later becomes unreachable (the certificate exception expired or the address changed), the popup shows the certificate hint with **Retry**. If site access was removed, it offers **Allow access** again.

## Scripts

```bash
bun run build
bun run check
bun run lint
bun run test
bun run test:e2e
HUE_BRIDGE_HOST=192.168.1.10 bun run test:e2e
```

## Testing

App logic never calls `chrome.*` directly. It talks to small ports in `src/ports.ts` (storage, host access, discovery, registration, opening a `HueApp`), so the component tests render the real `App` in Chromium with in-memory implementations, and node tests cover the parsing logic. The `e2e` project builds the extension, loads it unpacked into real Chromium through Playwright and checks the popup without any chrome mocks. Playwright cannot answer the native permission prompt, so tests that need granted site access grant it through `chrome://extensions` (the private `developerPrivate.addHostPermission` behind **Site access**). That call lives only in `test/e2e/extension.ts`. With `HUE_BRIDGE_HOST` set, the suite also accepts the bridge certificate and expects the link button message from a real bridge, which changes nothing on the bridge.
