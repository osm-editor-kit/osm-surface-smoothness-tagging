# Surface & Smoothness Tagging

Shared `surface` + `smoothness` tagging data and UI for OpenStreetMap editors,
initially extracted from [StreetComplete](https://github.com/streetcomplete/StreetComplete).

Part of the [`osm-editor-kit`](https://github.com/osm-editor-kit) GitHub org (same family as
[`maplibre-editor-layer-index`](https://github.com/osm-editor-kit/maplibre-editor-layer-index)).

| Path | Package | Role |
|------|---------|------|
| `packages/data` | [`@osm-editor-kit/surface-smoothness-data`](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-data) | Canonical catalogue JSON + web image/icon assets (ESM-only) |
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

GPL-3.0-or-later (StreetComplete-compatible). Reference photos carry their own
licenses (CC-BY-SA / CC0 / PD) tracked in the data package attribution.
