# @huxel/ui

React components for the Huxel design system. Color, type, space, radius, elevation, and motion come from `@huxel/tokens`. Icons come from `@huxel/icons`. Keyboard, focus, and overlays come from `react-aria-components`.

Storybook is the catalog. From this package:

```bash
bun run storybook
```

Product code imports each component from its own entry, for example `@huxel/ui/button`, `@huxel/ui/dialog`, and `@huxel/ui/table`. The package root exports shared types only.
