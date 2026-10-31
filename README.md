# Surface & Smoothness Tagging

Shared `surface` + `smoothness` tagging data and UI for OpenStreetMap editors, extracted from [StreetComplete](https://github.com/streetcomplete/StreetComplete). Part of the [`osm-editor-kit`](https://github.com/osm-editor-kit) GitHub org.

> [!NOTE]
> Claude Opus 5.5 wrote and reviewed the code of these packages. [@tordans](https://github.com/tordans) specified what it should do and tested and verified its user-facing behavior.

Made for road-like ways: roads, cycleways, footways, paths and road-like areas such as pedestrian squares.
The photos show road surfaces, so the picker does not fit sport pitches, parking areas or playgrounds.

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
bun run check        # builds the packages, then format, lint, types, tests and attw
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

Versions and changelogs use [changesets](https://github.com/changesets/changesets), see [`.changeset/README.md`](.changeset/README.md). Releases run from a terminal with npm 2FA:

```bash
bun run release
```

## License

[MIT](LICENSE) for the code and the catalogue.

Photos and texts in `packages/data` have their own sources:

- **Reference photos** keep their own licenses (CC-BY, CC-BY-SA, CC0, public domain). They are listed per file in `catalogue.attribution`, and any UI that shows them must keep that attribution.
  Two photos have no public source page and are credited the way StreetComplete credits them: `surface_unpaved_impassable.jpg` (public domain, Tobias Zwick) and `surface_paving_stones.jpg` (CC-BY-SA 4.0, Tobias Zwick with modifications by Mateusz Konieczny).
- **Labels and descriptions** come from [StreetComplete](https://github.com/streetcomplete/StreetComplete)'s English strings. We treat them as descriptions of OSM tag values from the shared OSM ecosystem. See [#1](https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/issues/1).
- **Vehicle icons**: StreetComplete's vehicle SVGs are GPL-3.0, so this repo does not include them. It uses the "usable by" emoji instead.
