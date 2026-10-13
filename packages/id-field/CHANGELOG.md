# @osm-editor-kit/surface-smoothness-id-field

## 0.1.1

### Patch Changes

- Depend on the MIT `@osm-editor-kit/surface-smoothness-data` release. 0.1.0 still pointed at the deprecated 0.0.0.
  - @osm-editor-kit/surface-smoothness-data@0.1.1

## 0.1.0

### Minor Changes

- b16daeb: Photos first: two tiles side by side, the surface and its smoothness (photo and label, or an empty frame while not set). Clicking a tile opens its picker below: all surface photos first, then the smoothness photos for that surface (or every level with its emoji where there are none). Below the photos, a label | input row takes any value, also one without a photo; the new `options` adapter adds the host's values to its suggestions, and `optionLabel` lets the host pass translated value labels.
- 0d55e45: Relicense to MIT. Remove StreetComplete's GPL vehicle SVGs: `SmoothnessLevel.vehicleIcon`, the `./icons/*` export, and their attribution entries are gone. Use `SmoothnessLevel.emoji` instead (see #1).

### Patch Changes

- 2d78866: Align npm packages with maplibre-editor-layer-index: ESM-only publish (IIFE kept local for iD sync), exports/provenance/attw/prepublishOnly, and changesets release flow.
- Updated dependencies [2d78866]
- Updated dependencies [0d55e45]
  - @osm-editor-kit/surface-smoothness-data@0.1.0
