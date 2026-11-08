# @huxel/mcp

Local [MCP](https://modelcontextprotocol.io) server for Philips Hue. It speaks stdio, links to a bridge on the same network, and exposes a few tools for an agent. [Hermes](https://hermes-agent.nousresearch.com/) can run it and reach it from Telegram. The server does not know about Telegram.

Requires [Bun](https://bun.sh). `@huxel/client` and `@huxel/app` resolve to their `dist/` builds, so build them first from the repository root:

```bash
bun install
bun run --filter @huxel/client --filter @huxel/app build
```

## Tools

| Tool             | What it does                                          |
| ---------------- | ----------------------------------------------------- |
| `bridge_status`  | Whether a key is stored and the bridge answers        |
| `link_bridge`    | One registration attempt. Press the link button first |
| `get_home`       | Rooms, zones, lights, and scenes                      |
| `set_light`      | On, brightness (0–100), or `#rrggbb` for one light    |
| `set_area`       | The same for a room or zone                           |
| `activate_scene` | Recall a scene                                        |

Brightness or color turns the target on. `on: false` only turns it off. Names match exactly, ignoring case. If several resources share a name, the tool returns their ids and changes nothing.

The application key is stored in `~/.config/hue-mcp/config.json` (or `$XDG_CONFIG_HOME/hue-mcp/config.json`) and is never returned by a tool. `HUE_BRIDGE_IP` and `HUE_BRIDGE_ID` override the bridge address. Set them together.

## Commands

```bash
bun run src/index.ts status
bun run src/index.ts link
bun run src/index.ts
```

`link` retries for about 30 seconds while you press the button. With no command, the process is the stdio MCP server. Logs go to stderr.

## Hermes and Telegram

Run Hermes on the machine that can reach the bridge. In `~/.hermes/.env`:

```bash
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_ALLOWED_USERS=123456789
```

The user id comes from `@userinfobot`. Hermes denies every sender when `TELEGRAM_ALLOWED_USERS` is unset.

In `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  hue:
    command: bun
    args: ['run', '/absolute/path/to/packages/mcp/src/index.ts']
    cwd: /absolute/path/to/huxel
    timeout: 30
    supports_parallel_tool_calls: false
```

`supports_parallel_tool_calls` stays off so two writes do not hit the bridge at once. If discovery cannot see the bridge, add `env` with `HUE_BRIDGE_IP` and `HUE_BRIDGE_ID`. Do not put the application key in that file.

Start the gateway with `hermes gateway`, then tell the bot to link the bridge. Press the button and say so. The bot calls `link_bridge` again within 30 seconds.
