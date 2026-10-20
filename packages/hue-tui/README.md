# hue-tui

Terminal remote for Philips Hue lights: link to a bridge, list all lights, toggle and dim them. Built with [OpenTUI](https://opentui.com) and React on top of [`hue-app`](../hue-app) and [`hue-sdk`](../hue-sdk). Requires [Bun](https://bun.sh).

## Setup

`hue-app` and `hue-sdk` are local `file:` dependencies that resolve to their `dist/` builds, so build them first:

```bash
(cd ../hue-sdk && bun install && bun run build)
(cd ../hue-app && bun install && bun run build)
bun install
```

Installed files are symlinks into those packages, so a rebuild is picked up directly. Re-run `bun install` here only when the set of built files changes, for example when a new module is added to `dist/`.

## Run

```bash
bun start
bun run dev
```

The bridge is resolved in this order:

1. `HUE_BRIDGE_IP` and `HUE_BRIDGE_ID` environment variables
2. The config file
3. The Hue discovery service (`https://discovery.meethue.com/`), first bridge found

```bash
HUE_BRIDGE_IP=192.168.1.10 HUE_BRIDGE_ID=001788fffe7d45eb bun start
```

On first run the app asks you to press the link button on the bridge and then Enter within 30 seconds.

## Keys

| Key                | Action                    |
| ------------------ | ------------------------- |
| `↑` `↓` / `k` `j`  | Select light              |
| `space` / `enter`  | Toggle selected light     |
| `←` `→` / `h` `l`  | Dim selected light by 10% |
| `q` / `esc` / `^C` | Quit                      |

## Config

Stored at `$XDG_CONFIG_HOME/hue-remote/config.json`, or `~/.config/hue-remote/config.json`, with mode `0600` because it contains the application key:

```json
{ "bridge": { "id": "001788fffe7d45eb", "ip": "192.168.1.10" }, "appKey": "…" }
```

Delete the file to link again or to forget a discovered bridge.

## TLS

Bridges serve HTTPS with a certificate whose common name is the bridge id, issued by the Signify Hue root CA (embedded in `src/bridge/hue-root-ca.ts`). The bridge HTTP client trusts only that CA and accepts the certificate only when its common name matches the bridge id, so the IP address is never trusted on its own. Certificate verification is never disabled.

Requests use `keepalive: false` because Bun skips `checkServerIdentity` on reused pooled sockets; every request opens a verified connection. Requests time out after 10 seconds so an unreachable bridge fails instead of hanging.

## Limitations

- Bridges with self-signed certificates (older firmware) are not supported and fail with a certificate error.
- No live updates: changes made by other apps are not shown until restart.
- Only the first discovered bridge is used; set the environment variables to choose another.
- `src/dedupe-react.ts` redirects other copies of `react` to this package's copy. A `file:` install of `hue-app` brings its own development `react`, and two React copies break hooks.

## Scripts

```bash
bun run check
bun test
bun run lint
bun run format
HUE_BRIDGE_IP=192.168.1.10 HUE_BRIDGE_ID=001788fffe7d45eb bun scripts/smoke-tls.ts
```
