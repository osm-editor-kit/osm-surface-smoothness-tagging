---
"@osm-editor-kit/surface-smoothness-data": major
---

- The stable API is the typed `catalogue` of OSM `surface` / `smoothness` values (with photos and attribution), the helpers `normalizeSurface`, `getSurfaceInfo`, `getSmoothnessOptionsForSurface` and `hasSmoothnessQuest`, and the subpath exports `./catalogue.json` and `./images/*`. From 1.0.0 these follow semver.
- Breaking changes: none. No name was removed or renamed.
- The types are now exported by name instead of `export type *`: `Attribution`, `Catalogue`, `CatalogueMeta`, `MatrixCell`, `SmoothnessLevel`, `SurfaceInfo` and, from the helpers, `SmoothnessOption`. The set is the same as before.
- npm provenance is no longer set in `publishConfig`; releases are published from a terminal.
