# How the official Hue app stores a preset

The recipes live in the Philips Hue app. The bridge has no preset catalog. When the app sets up a room or zone, it creates one [`scene`](../../packages/client/docs/clip-v2/scene.md) per recipe and ties it to that group. The same display name in two rooms is two scene resources. A room created only through the API has none of these scenes until the Hue app adds them.

Each scene stores:

- `actions`: one state per light. A state can include on, brightness, `xy`, `color_temperature.mirek`, and sometimes a gradient or an effect.
- `palette`: up to nine colors, one brightness, and one color temperature. Dynamic scenes cycle that palette. The app also uses it when a light is added later.
- `metadata.name` and `metadata.image`. The image is a `public_image`. The name follows the phone language, so a German setup stores "Entspannen" where an English setup stores "Relax".

Tapping the tile recalls the scene:

```http
PUT /clip/v2/resource/scene/{id}
{ "recall": { "action": "active" } }
```

The bridge applies every stored action together. `duration` sets the fade. `recall.dimming` overrides brightness. When `auto_dynamic` is set, playback then moves through the palette with `dynamic_palette`. Editing the scene in the Hue app rewrites that room's actions, so a later recall plays the edited version.

The seven defaults are uniform: every light gets the same white and the same brightness. Gallery scenes such as Savanna sunset and Arctic aurora assign several colors across the lights and often animate. Those need the stored scene. One color on the group will not look like the Hue app.

Older Hue apps also wrote a short catalog code into scene `appdata`. Current scenes point at a `public_image`. The display name is a weak identity: it is translated, and it is repeated once per room.

`powerup.preset` on a light (`safety`, `powerfail`, `last_on_state`, `custom`) is the bulb's behavior after a power cut. The Hue app calls that power-on behavior. It is unrelated to the scene tiles. The field is on the light resource in [`packages/client/src/types/light.ts`](../../packages/client/src/types/light.ts).

Signify does not publish the recipe list. The values in [Default scene recipes](./default-recipes.md) come from scenes the Hue app has written onto bridges: v2 palette dumps, and older xy scene lists. The app has shifted them slightly over time.
