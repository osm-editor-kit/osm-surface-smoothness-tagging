# Surface & Smoothness Tagging

Shared `surface` + `smoothness` tagging data and UI for OpenStreetMap editors,
initially extracted from [StreetComplete](https://github.com/streetcomplete/StreetComplete).

Part of the [`osm-editor-kit`](https://github.com/osm-editor-kit) GitHub org /
[`@osm-editor-kit`](https://www.npmjs.com/org/osm-editor-kit) npm org (sibling of
[`maplibre-editor-layer-index`](https://github.com/osm-editor-kit/maplibre-editor-layer-index)).

| Path | Package | Role |
|------|---------|------|
| `packages/data` | `@osm-editor-kit/surface-smoothness-data` | Canonical catalogue JSON + web image/icon assets |
| `packages/id-field` | `@osm-editor-kit/surface-smoothness-id-field` | D3 inspector field for the iD editor |
| `apps/demo` | — | Standalone test UI (mock iD adapters) |
| `mobile/` | — | Generated StreetComplete / GoMap asset bundles (not npm) |
| `scripts/` | — | `extract-from-streetcomplete.ts`, `build-mobile-assets.ts` |

Built with Bun workspaces, following the
[`osm-traffic-sign-tools-id-field`](https://github.com/osmberlin/osm-traffic-sign-tool) template.

## Setup

```bash
bun install
bun run lint && bun run type-check
```

## Status

**Phase 1 (scaffold) complete.** The extract / data / id-field / demo / mobile
pipelines are stubs. See `../WORK_PLAN.md` and
`../.cursor/plans/surface_smoothness_monorepo_92c1a383.plan.md` for the roadmap.

## License

GPL-3.0-or-later (StreetComplete-compatible). Reference photos carry their own
licenses (CC-BY-SA / CC0 / PD) tracked in `packages/data/dist/attribution.json`.
