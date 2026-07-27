# [@osm-editor-kit/surface-smoothness-data](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-data)

Standalone catalogue of OpenStreetMap `surface` / `smoothness` values, with
lookup helpers and web-ready reference photos and vehicle icons.

Originally extracted from [StreetComplete](https://github.com/streetcomplete/StreetComplete);
usable from any editor, app, or tooling that needs the same matrix and assets.

- **ESM-only** (`type: module`), zero runtime dependencies.
- Typed `catalogue` object plus small helpers.
- Subpath exports for raw JSON and static assets (`./catalogue.json`, `./images/*`, `./icons/*`).

Consumed by
[`@osm-editor-kit/surface-smoothness-id-field`](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-id-field)
and the [live demo](https://osm-editor-kit.github.io/osm-surface-smoothness-tagging/).

## Install

```bash
npm install @osm-editor-kit/surface-smoothness-data
```

## Usage

```ts
import {
  catalogue,
  getSmoothnessOptionsForSurface,
  getSurfaceInfo,
  hasSmoothnessQuest,
  normalizeSurface,
} from '@osm-editor-kit/surface-smoothness-data'

normalizeSurface('concrete:plates') // → "concrete"

const surface = getSurfaceInfo('asphalt')
// { osmValue: "asphalt", title: "Asphalt", icon: "images/surface_asphalt.jpg", smoothnessQuest: true }

hasSmoothnessQuest('grass') // → false

for (const option of getSmoothnessOptionsForSurface('asphalt')) {
  option.smoothness // "excellent" | "good" | …
  option.level?.emoji // vehicle emoji
  option.level?.vehicleIcon // "icons/…"
  option.cell.photo // "images/…"
  option.cell.description
}
```

### Catalogue shape

`catalogue` includes:

| Field                        | Description                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `smoothnessLevels`           | OSM `smoothness` values → title, emoji, vehicle icon path                     |
| `surfaces`                   | OSM `surface` values → title, icon path, whether a smoothness quest applies   |
| `surfaceAliases`             | Tag aliases → canonical surface (e.g. `concrete:plates` → `concrete`)         |
| `surfacesForSmoothnessQuest` | Surfaces StreetComplete asks smoothness for                                   |
| `smoothnessMatrix`           | `surface` → `smoothness` → `{ photo, description }` (cells with a photo only) |
| `attribution`                | Per-file license and source for reference photos                              |

Asset paths in the catalogue are package-relative (`images/…`, `icons/…`). Resolve
them with your bundler or copy the files from the package:

```ts
import asphaltUrl from '@osm-editor-kit/surface-smoothness-data/images/surface_asphalt.jpg'
```

```ts
import catalogueJson from '@osm-editor-kit/surface-smoothness-data/catalogue.json'
```

### Helpers

| Function                                  | Description                                                    |
| ----------------------------------------- | -------------------------------------------------------------- |
| `normalizeSurface(value)`                 | Follow `surfaceAliases` (identity if unknown).                 |
| `getSurfaceInfo(surface)`                 | Surface metadata, following aliases.                           |
| `getSmoothnessOptionsForSurface(surface)` | Ordered options (best → worst) for that surface; `[]` if none. |
| `hasSmoothnessQuest(surface)`             | Whether StreetComplete asks smoothness for this surface.       |

## License

GPL-3.0-or-later (StreetComplete-compatible). Individual reference photos keep
their own licenses (CC-BY-SA / CC0 / PD) — see `catalogue.attribution`.
