# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-20

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

[Unreleased]: https://github.com/dawidjaniga/philips-hue-remote/compare/hue-sdk-v0.1.0...HEAD
[0.1.0]: https://github.com/dawidjaniga/philips-hue-remote/releases/tag/hue-sdk-v0.1.0
