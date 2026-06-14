# OSM Surface & Smoothness Tagging

Monorepo providing shared `surface` + `smoothness` tagging data and UI, initially
extracted from [StreetComplete](https://github.com/streetcomplete/StreetComplete).

| Path | Package | Role |
|------|---------|------|
| `packages/data` | `@osm-surface-smoothness/data` | Canonical catalogue JSON + web image/icon assets |
| `packages/id-field` | `@osm-surface-smoothness/id-field` | D3 inspector field for the iD editor |
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
