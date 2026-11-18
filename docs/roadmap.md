# Roadmap

## Presets

The Bright, Relax, Read, and related tiles in the Philips Hue app are scenes the app saves on the bridge, one copy per room or zone. Huxel can recall those scenes, and it can keep applying the plain white recipes itself. Gallery scenes only match the Hue app when the stored scene is recalled.

- [How the official app stores a preset](./presets/official-app.md)
- [Default scene recipes](./presets/default-recipes.md)
- [What Huxel does today](./presets/current-behavior.md)
- [Using the same presets here](./presets/adoption.md)

Follow-up from those notes:

1. Recall the scene the Hue app already saved for that room or zone. That plays per-light actions, later edits, and gallery scenes. Scene recall already exists in `@huxel/mcp`.
2. Align the client-side white recipes with the seven defaults, and send mirek on color bulbs so they stay on the white track. That path works when the bridge has no scene, including a single light.
