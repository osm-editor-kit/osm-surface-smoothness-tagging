---
'@osm-editor-kit/surface-smoothness-id-field': minor
---

Easier to fit into a host, tested in our iD fork:

- **Styling:** every rule is scoped to `.surface-smoothness-field`, so iD's `.ideditor button` and `span` rules no longer override it. New `--ssf-*` custom properties for colors, sizes, columns, label lines and the picker's height; the `ssf-*` class names are stable for overrides.
- **Headless entry** `@osm-editor-kit/surface-smoothness-id-field/logic`: the tag rules and picker choices without DOM or d3, for hosts that draw their own UI.
- **Tooltips:** they show the full label, so long translated labels that are cut off on the cards can be read. New adapters `optionDescription` and `tooltip` to translate or replace the tooltip text.
- **Keyboard:** each photo grid is one tab stop with arrow keys, Home and End; Escape closes the picker. Focus moves on to the smoothness photos after a surface and back to the tile after a smoothness, instead of being lost.
- **Changing the surface** keeps the smoothness when the new surface has no reference photos (all levels are offered there), when the surface is removed, and for values the catalogue does not know. It still clears a smoothness the new surface cannot have, like `excellent` on `sett`.
- `isSmoothnessValidForSurface` follows the same rule, so it now returns `true` for no surface, a surface without reference photos and unknown values. `smoothnessValuesForSurface` still lists only the values with a reference photo; `smoothnessChoices` is what the picker offers. `TooltipInfo`, `SmoothnessChoice` and `FieldKeys` are exported as types.
- Mixed values ("Multiple values") are shown in italic muted text.
