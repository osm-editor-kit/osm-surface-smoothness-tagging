# @osm-editor-kit/surface-smoothness-data

## 1.0.0

### Major Changes

- e9b6fce: - The stable API is the typed `catalogue` of OSM `surface` / `smoothness` values (with photos and attribution), the helpers `normalizeSurface`, `getSurfaceInfo`, `getSmoothnessOptionsForSurface` and `hasSmoothnessQuest`, and the subpath exports `./catalogue.json` and `./images/*`. From 1.0.0 these follow semver.
  - Breaking changes: none. No name was removed or renamed.
  - The types are now exported by name instead of `export type *`: `Attribution`, `Catalogue`, `CatalogueMeta`, `MatrixCell`, `SmoothnessLevel`, `SurfaceInfo` and, from the helpers, `SmoothnessOption`. The set is the same as before.
  - npm provenance is no longer set in `publishConfig`; releases are published from a terminal.

## 0.2.0

## 0.1.1

## 0.1.0

### Minor Changes

- 0d55e45: Relicense to MIT. Remove StreetComplete's GPL vehicle SVGs: `SmoothnessLevel.vehicleIcon`, the `./icons/*` export, and their attribution entries are gone. Use `SmoothnessLevel.emoji` instead (see #1).

### Patch Changes

- 2d78866: Align npm packages with maplibre-editor-layer-index: ESM-only publish (IIFE kept local for iD sync), exports/provenance/attw/prepublishOnly, and changesets release flow.
