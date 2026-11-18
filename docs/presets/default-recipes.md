# Default scene recipes

Uniform scenes the Hue app installs for a room or zone. Mirek is the v2 palette value where a dump recorded one. The xy column is the older single-color scene list used on color bulbs. Kelvin is `1000000 / mirek`, rounded.

| Scene | Mirek | Kelvin | Brightness | Typical xy |
| --- | --- | --- | --- | --- |
| Bright | 370 | 2703 K | 100% | 0.460, 0.411 |
| Relax | 447 | 2237 K | ~57% (144/254) | 0.502, 0.415 |
| Read | 346 | 2890 K | 100% | 0.445, 0.407 |
| Concentrate | 233 | 4292 K | 100% | 0.369, 0.372 |
| Energize | ~153 | 6536 K | 100% | 0.314, 0.330 |
| Dimmed | ~370 | 2703 K | ~30% (77/254) | same white as Bright |
| Nightlight | very warm |  | minimum | 0.561, 0.404 |

On a color bulb the Hue app usually writes `color_temperature` for these, so the bulb stays in white mode. Read, Concentrate, and Bright palettes from one bridge dump contained mirek and brightness with an empty color list. Nightlight was stored as xy `0.561, 0.4042` at the lowest brightness. Energize is full-brightness cool white in the older scene list (xy `0.3143, 0.3301`, brightness 254, about 153 mirek). One v2 palette dump recorded only its brightness entry.

Dimmed uses the Bright white at about 30%. Bright's older xy dump is `0.4596, 0.4105` at brightness 254, next to the later 370 mirek palette.

Gallery scenes are a different shape. Arctic aurora and Tropical twilight, among others, store about five xy points at one brightness, plus a single mirek fallback for temperature-only lights. The app distributes those points across the lights. Recalling the scene is what reproduces that layout. See [Using the same presets here](./adoption.md).

Sources, none of them a Signify specification:

- Palette dumps: [Hue default Scene Light Values](https://community.home-assistant.io/t/hue-default-scene-light-values/238861)
- Older xy scenes: [Philips Hue Scenes](https://gist.github.com/Hypfer/a0a8b5b9429831a7306ec4300077eaaa)
- White-ambiance ct list (Relax 447/144, Read 343/254, Concentrate 230/254, Energize 153/254, Bright 367/254, Dimmed 366/77, Nightlight 433/1): [Circadian Lighting for Philips Hue White Ambiance](https://community.home-assistant.io/t/circadian-lighting-for-philips-hue-white-ambiance/84926)

The white-ambiance list and the later v2 palettes disagree by a few mirek on Read, Concentrate, Bright, and Dimmed. Treat the table as the later palette dump, with the xy column filled from the older color scenes.
