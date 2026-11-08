# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-08

### Added

- `PUT` requests are throttled per resource URL with lodash `throttle` (100 ms, 1 s for `grouped_light`), last call wins. Disable with `throttle: false`.
- `client.events.subscribe` for the CLIP v2 event stream (`/eventstream/clip/v2`): typed `HueEvent` batches, runtime validation of every message, `connecting` / `open` / `reconnecting` / `closed` states, automatic reconnection with exponential backoff (1 s doubling, 30 s cap, jitter, reset after 30 s of stable connection, `Retry-After` honored for 429/503 up to 5 minutes), permanent stop on 401/403, cancellation via `close()` or `AbortSignal`.
- Optional `HttpClient.stream()` returning `HttpStreamResponse`, implemented by `createFetchHttpClient` with `getReader()` and `TextDecoder` for Node 18+, browsers and extensions.
- Spec-compliant incremental Server-Sent Events parser used by the event stream.

## [0.1.0] - 2026-10-20

### Added

- `createHueClient` with CLIP v2 resource APIs: `lights`, `groupedLights`, `rooms`, `zones`, `scenes`, `smartScenes`, `devices`, `bridges`, `bridgeHomes`, and `resources.list({ type? })`.
- Full `{ errors, data }` response envelopes (including HTTP 207 partial success).
- Typed errors (`HueApiError` hierarchy, `HueNetworkError`, `HueResponseError`, registration errors).
- Pluggable `HttpClient` and default `createFetchHttpClient`.
- `discoverBridges` (Meet Hue discovery) and `registerApplication` (V1 link-button pairing).
- TypeScript types for covered resources (`*Get`, `*Put`, `*Post`) and shared CLIP types.

### Known gaps

- Many CLIP v2 resource types (sensors, connectivity, entertainment, Matter/HomeKit, behavior, geofence, etc.) are not implemented.
- `/eventstream` and Entertainment streaming are not supported.

[Unreleased]: https://github.com/janigowski/huxel/compare/client-v0.2.0...HEAD
[0.2.0]: https://github.com/janigowski/huxel/compare/client-v0.1.0...client-v0.2.0
[0.1.0]: https://github.com/janigowski/huxel/releases/tag/client-v0.1.0
