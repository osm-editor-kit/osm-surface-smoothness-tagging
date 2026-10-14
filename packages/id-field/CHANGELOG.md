# @osm-editor-kit/surface-smoothness-id-field

## 0.2.0

### Minor Changes

- 8e2fb36: Easier to fit into a host, tested in our iD fork:

  - **Styling:** every rule is scoped to `.surface-smoothness-field`, so iD's `.ideditor button` and `span` rules no longer override it. New `--ssf-*` custom properties for colors, sizes, columns, label lines and the picker's height; the `ssf-*` class names are stable for overrides.
  - **Headless entry** `@osm-editor-kit/surface-smoothness-id-field/logic`: the tag rules and picker choices without DOM or d3, for hosts that draw their own UI.
  - **Tooltips:** they show the full label, so long translated labels that are cut off on the cards can be read. New adapters `optionDescription` and `tooltip` to translate or replace the tooltip text.
  - **Keyboard:** each photo grid is one tab stop with arrow keys, Home and End; Escape closes the picker. Focus moves on to the smoothness photos after a surface and back to the tile after a smoothness, instead of being lost.
  - **Changing the surface** keeps the smoothness when the new surface has no reference photos (all levels are offered there), when the surface is removed, and for values the catalogue does not know. It still clears a smoothness the new surface cannot have, like `excellent` on `sett`.
  - `isSmoothnessValidForSurface` follows the same rule, so it now returns `true` for no surface, a surface without reference photos and unknown values. `smoothnessValuesForSurface` still lists only the values with a reference photo; `smoothnessChoices` is what the picker offers. `TooltipInfo`, `SmoothnessChoice` and `FieldKeys` are exported as types.
  - Mixed values ("Multiple values") are shown in italic muted text.

### Patch Changes

- @osm-editor-kit/surface-smoothness-data@0.2.0

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
