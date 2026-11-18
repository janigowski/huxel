# What Huxel does today

Client-side recipes live in [`packages/app/src/preset.ts`](../../packages/app/src/preset.ts). `ApplyAreaPreset` and `ApplyLightPreset` write the group or the light directly. They do not recall a scene. A temperature-only device gets mirek. A device that reports color gets xy.

| Id | xy | Mirek | Brightness |
| --- | --- | --- | --- |
| `bright` | 0.4573, 0.4102 | 367 | 100% |
| `relax` | 0.5016, 0.4153 | 447 | 57% |
| `energize` | 0.3149, 0.3250 | 156 | 80% |

`PresetId` is those three names. Read, Concentrate, Dimmed, and Nightlight are absent. `findAreaPreset` matches xy plus brightness within 0.01 and 0.5, or mirek plus brightness when the device has no color.

Against the [default recipes](./default-recipes.md):

- Relax matches: 447 mirek and 57%, against 144/254 (56.7%), with xy within 0.001.
- Bright is a few mirek warmer than the app's 370, and the xy is close to the older `0.4596, 0.4105`.
- Energize is dimmer than the Hue app's 100%, and the xy sits near `0.3143, 0.3301` without matching it.

`HueApp.applyLightPreset`, `applyRoomPreset`, and `applyZonePreset` call those writers. The Svelte and React adapters expose the room and zone calls.

The terminal app opens the same three presets for a room or zone (`p` in [apps/tui-app](../../apps/tui-app/README.md)). The web deck's room and zone sheet lists them too (`ZoneRoomView`). The area card on the deck offers color and has no preset control.

`@huxel/mcp` recalls a bridge scene by name or id: `scenes.update` with `{ recall: { action: 'active' } }` in [`packages/mcp/src/session.ts`](../../packages/mcp/src/session.ts). That path plays whatever the Hue app stored, under the scene's own name.
