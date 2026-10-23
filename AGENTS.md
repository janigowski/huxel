# Repository guidelines

Mechanical syntax in this repo is owned by the codemods in `scripts/codemods` and the Cursor rules in `.cursor/rules`.

- Relative imports of TypeScript omit `.js`. Keep the suffix when the file on disk is JavaScript.
- Class state uses TypeScript `private` / `private readonly`, not `#private` fields.
- `bun run codemod` applies both transforms. `bun run check` rejects a tree that still has either pattern.

`hue-sdk` and `hue-app` typecheck with `moduleResolution: bundler`. Published `dist` output still uses `.js` extensions; `vp pack` adds them.
