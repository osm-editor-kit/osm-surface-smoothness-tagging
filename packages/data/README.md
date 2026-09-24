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

## Catalogue preview

StreetComplete-style matrix, laid out like the [Verkehrswende meetup smoothness table](https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/smoothness): one row per `surface`, one column per `smoothness`. Empty cells have no reference photo in this catalogue. Photos link to the file on GitHub (`HEAD`) so they render in the README preview.

| Surface | `excellent` | `good` | `intermediate` | `bad` | `very_bad` | `horrible` | `very_horrible` | `impassable` |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Usable by | 🛹 | 🛴 | 🚲 | 🚗 | 🚙 | 🛻 | 🚜 | 🚶 |
| | Smooth and even | Mostly even | A little bumpy | Bumpy | Very bumpy | Very bumpy and uneven | Almost impassable | Impassable |
| [`asphalt`](https://wiki.openstreetmap.org/wiki/Tag:surface=asphalt)<br>Asphalt | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_asphalt_excellent.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_asphalt_excellent.jpg" alt="asphalt excellent" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_asphalt_good.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_asphalt_good.jpg" alt="asphalt good" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_asphalt_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_asphalt_intermediate.jpg" alt="asphalt intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_asphalt_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_asphalt_bad.jpg" alt="asphalt bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_asphalt_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_asphalt_very_bad.jpg" alt="asphalt very_bad" width="120"></a> | — | — | — |
| [`concrete`](https://wiki.openstreetmap.org/wiki/Tag:surface=concrete)<br>Concrete | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_excellent.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_excellent.jpg" alt="concrete excellent" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_good.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_good.jpg" alt="concrete good" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_intermediate.jpg" alt="concrete intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_bad.jpg" alt="concrete bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_very_bad.jpg" alt="concrete very_bad" width="120"></a> | — | — | — |
| [`concrete:plates`](https://wiki.openstreetmap.org/wiki/Tag:surface=concrete%3Aplates)<br>Concrete plates | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_excellent.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_excellent.jpg" alt="concrete:plates excellent" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_good.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_good.jpg" alt="concrete:plates good" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_intermediate.jpg" alt="concrete:plates intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_bad.jpg" alt="concrete:plates bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_concrete_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_concrete_very_bad.jpg" alt="concrete:plates very_bad" width="120"></a> | — | — | — |
| [`paving_stones`](https://wiki.openstreetmap.org/wiki/Tag:surface=paving_stones)<br>Paving stones | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_paving_stones_excellent.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_paving_stones_excellent.jpg" alt="paving_stones excellent" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_paving_stones_good.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_paving_stones_good.jpg" alt="paving_stones good" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_paving_stones_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_paving_stones_intermediate.jpg" alt="paving_stones intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_paving_stones_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_paving_stones_bad.jpg" alt="paving_stones bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_paving_stones_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_paving_stones_very_bad.jpg" alt="paving_stones very_bad" width="120"></a> | — | — | — |
| [`sett`](https://wiki.openstreetmap.org/wiki/Tag:surface=sett)<br>Sett | — | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_sett_good.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_sett_good.jpg" alt="sett good" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_sett_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_sett_intermediate.jpg" alt="sett intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_sett_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_sett_bad.jpg" alt="sett bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_sett_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_sett_very_bad.jpg" alt="sett very_bad" width="120"></a> | — | — | — |
| [`compacted`](https://wiki.openstreetmap.org/wiki/Tag:surface=compacted)<br>Compacted gravel | — | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_compacted_good.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_compacted_good.jpg" alt="compacted good" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_compacted_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_compacted_intermediate.jpg" alt="compacted intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_compacted_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_compacted_bad.jpg" alt="compacted bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_compacted_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_compacted_very_bad.jpg" alt="compacted very_bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_horrible.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_horrible.jpg" alt="compacted horrible" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_very_horrible.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_very_horrible.jpg" alt="compacted very_horrible" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_impassable.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_impassable.jpg" alt="compacted impassable" width="120"></a> |
| [`fine_gravel`](https://wiki.openstreetmap.org/wiki/Tag:surface=fine_gravel)<br>Fine gravel | — | — | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_gravel_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_gravel_intermediate.jpg" alt="fine_gravel intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_gravel_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_gravel_bad.jpg" alt="fine_gravel bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_gravel_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_gravel_very_bad.jpg" alt="fine_gravel very_bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_horrible.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_horrible.jpg" alt="fine_gravel horrible" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_very_horrible.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_very_horrible.jpg" alt="fine_gravel very_horrible" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_impassable.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_impassable.jpg" alt="fine_gravel impassable" width="120"></a> |
| [`gravel`](https://wiki.openstreetmap.org/wiki/Tag:surface=gravel)<br>Coarse gravel | — | — | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_gravel_intermediate.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_gravel_intermediate.jpg" alt="gravel intermediate" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_gravel_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_gravel_bad.jpg" alt="gravel bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_gravel_very_bad.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_gravel_very_bad.jpg" alt="gravel very_bad" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_horrible.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_horrible.jpg" alt="gravel horrible" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_very_horrible.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_very_horrible.jpg" alt="gravel very_horrible" width="120"></a> | <a href="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/blob/HEAD/packages/data/src/generated/images/surface_unpaved_impassable.jpg"><img src="https://github.com/osm-editor-kit/osm-surface-smoothness-tagging/raw/HEAD/packages/data/src/generated/images/surface_unpaved_impassable.jpg" alt="gravel impassable" width="120"></a> |

## License

GPL-3.0-or-later (StreetComplete-compatible). Individual reference photos keep
their own licenses (CC-BY-SA / CC0 / PD) — see `catalogue.attribution`.
