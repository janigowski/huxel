# Using the same presets here

Two mechanisms, for two kinds of scene.

## Recall the bridge scene

List `scene`, take the one whose `group` is that room or zone, and recall it:

```http
PUT /clip/v2/resource/scene/{id}
{ "recall": { "action": "active" } }
```

This is the Hue app's behavior. It includes per-light actions, edits made in the Hue app, gallery scenes, and dynamic playback when `auto_dynamic` is set. `@huxel/client` already models the scene resource. `@huxel/mcp` already recalls by name or id.

The scene exists only for a group the Hue app has provisioned. The stored name may be translated, and the same name exists once per room, so a recall has to pick the scene for that group. See [How the official app stores a preset](./official-app.md).

## Apply the white recipes in the client

This is what [`areaPresets`](../../packages/app/src/preset.ts) does. It works with no scene on the bridge, and it works for a single light. Bright, Relax, Read, Concentrate, Energize, Dimmed, and Nightlight are each one mirek (or one xy) plus one brightness, so a grouped-light write matches a fresh default.

Sending mirek on color bulbs keeps them on the white track, which is what the Hue app does for these scenes. Huxel sends xy whenever the device reports a color, and mirek only when it has a temperature and no color. After an xy write, `color_temperature.mirek` may be null and preset matching uses the xy path.

Gallery scenes stay on the recall path. Their palettes have several colors. Flattening one of them onto the whole room will not match the Hue app.

Scene thumbnail images from the Hue gallery are Signify assets. A swatch for a white recipe can be drawn from its mirek, which `mirekToHex` already does.
