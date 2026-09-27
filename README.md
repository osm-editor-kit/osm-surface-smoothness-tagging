# Surface & Smoothness Tagging

Shared `surface` + `smoothness` tagging data and UI for OpenStreetMap editors,
initially extracted from [StreetComplete](https://github.com/streetcomplete/StreetComplete).

Part of the [`osm-editor-kit`](https://github.com/osm-editor-kit) GitHub org (same family as
[`maplibre-editor-layer-index`](https://github.com/osm-editor-kit/maplibre-editor-layer-index)).

| Path | Package | Role |
|------|---------|------|
| `packages/data` | [`@osm-editor-kit/surface-smoothness-data`](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-data) | Canonical catalogue JSON + web image assets (ESM-only) |
| `packages/id-field` | [`@osm-editor-kit/surface-smoothness-id-field`](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-id-field) | D3 inspector field for the iD editor (ESM-only) |
| `apps/demo` | — | Standalone test UI (mock iD adapters) |
| `mobile/` | — | Generated StreetComplete / GoMap asset bundles (not npm) |
| `scripts/` | — | `extract-from-streetcomplete.ts`, `build-mobile-assets.ts` |

**Live preview:** [osm-editor-kit.github.io/osm-surface-smoothness-tagging](https://osm-editor-kit.github.io/osm-surface-smoothness-tagging/)
(redeployed on every push to `main`).

## Develop

```bash
bun install
bun run lint && bun run type-check
bun run build:packages && bun run check-exports
bun run dev:demo
```

### iD worktree

- **Published path:** the sibling `iD-surface-smoothness-worktree` installs
  `@osm-editor-kit/surface-smoothness-id-field` from npm and runs
  `npm run dist:surface-smoothness-field` to populate `dist/surface-smoothness-field/`.
- **Pre-publish path:** while iterating on the field package, run `bun run dev:id-field`
  (or `bun run sync:id-worktree`) to copy a local build into that same dist folder so iD
  picks up changes without an npm publish. Details:
  [`packages/id-field/README.md`](packages/id-field/README.md#local-development-against-the-id-worktree).

## Release

Same [changesets](https://github.com/changesets/changesets) flow as
[`maplibre-editor-layer-index`](https://github.com/osm-editor-kit/maplibre-editor-layer-index),
run **manually** (no auto-publish CI yet):

1. After meaningful changes, create a changeset and commit it with your PR:
   ```bash
   bunx changeset
   ```
2. On `main`, when you want to publish:
   ```bash
   bun run version-packages   # consumes .changeset/*.md, bumps versions + CHANGELOGs
   git add -A && git commit -m "chore: release"
   bun run release            # build:packages + changeset publish
   git push && git push --tags
   ```

Both npm packages stay on the **same version** (`fixed` in `.changeset/config.json`).
Publishing is ESM-only; set `publishConfig.provenance` like the maplibre sibling (OIDC/trusted
publishing when you add a release workflow later).

## License

[MIT](LICENSE) for the code and the catalogue.

Photos and texts in `packages/data` have their own sources:

- **Reference photos** keep their own licenses (CC-BY, CC-BY-SA, CC0, public domain). They are listed per file in `catalogue.attribution`, and any UI that shows them must keep that attribution.
- **Labels and descriptions** come from [StreetComplete](https://github.com/streetcomplete/StreetComplete)'s English strings. We treat them as descriptions of OSM tag values from the shared OSM ecosystem. See [#1](https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/issues/1).
- **Vehicle icons**: StreetComplete's vehicle SVGs are GPL-3.0, so this repo does not include them. It uses the "usable by" emoji instead.
