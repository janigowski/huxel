# Repository guidelines

Mechanical syntax in this repo is owned by the codemods in `scripts/codemods` and the Cursor rules in `.cursor/rules`.

- Relative imports of TypeScript omit `.js`. Keep the suffix when the file on disk is JavaScript.
- Class state uses TypeScript `private` / `private readonly`, not `#private` fields.
- `bun run codemod` applies both transforms. `bun run check` rejects a tree that still has either pattern.

`@huxel/client` and `@huxel/app` typecheck with `moduleResolution: bundler`. Published `dist` output still uses `.js` extensions; `vp pack` adds them.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `janigowski/huxel`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles, each label equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.
