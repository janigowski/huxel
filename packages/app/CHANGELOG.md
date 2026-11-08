# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-08

### Added

- `createHueApp` loads lights, rooms, and zones and keeps their name, power, brightness, color, and color temperature in signals.
- Commands for a light, a room, or a zone: power, brightness, color, color temperature, and the Bright, Relax, and Energize presets.
- Optimistic updates. Each property has one command in flight, and a failed command rolls back to the last value the bridge confirmed.
- Live updates from the bridge event stream, on by default. `app.state.connection` reports `offline`, `connecting`, `live`, and `reconnecting`.
- Optional Svelte 5 and React adapters.
- `hexToXy`, `xyToHex`, `mirekToHex`, and `describeError`.

The application key stays in memory for the life of the `HueApp`. This package does not write it down.

[Unreleased]: https://github.com/janigowski/huxel/compare/app-v0.1.0...HEAD
[0.1.0]: https://github.com/janigowski/huxel/releases/tag/app-v0.1.0
