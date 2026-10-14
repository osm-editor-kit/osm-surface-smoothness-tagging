# [@osm-editor-kit/surface-smoothness-id-field](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-id-field)

D3 inspector field for the [iD editor](https://github.com/openstreetmap/iD): pick
`surface` and a matching `smoothness` with StreetComplete-style reference photos.

**Made for road-like ways:** roads, cycleways, footways and paths, and road-like areas such as
pedestrian squares (`highway=pedestrian` areas). The photos show road surfaces and the
smoothness levels describe how well wheels roll on them. Sport pitches, parking areas or
playgrounds are not what the photos show, and conveyors like `highway=footway` +
`conveying=*` are road-like but not something this field handles; keep the plain `surface` /
`smoothness` fields there. In iD, use the field on presets that also offer `smoothness`.

- Two tiles side by side: the surface and its smoothness, each with its photo and label (an empty frame while not set). The tags are in the tooltip.
- Clicking a tile opens its picker below: all surface photos first; choosing a surface opens the smoothness photos for that surface (or every level with its "usable by" emoji where StreetComplete has no photos).
- Below the photos, a label | input row takes any value, also one without a photo. A host can render its own input there (`adapters.renderInput`, e.g. iD's combo field with its translated dropdown); otherwise the field draws a simple dropdown.
- Emits tag patches for `surface` / `smoothness`. Changing the surface clears a smoothness the new surface cannot have (e.g. `excellent` on `sett`); it keeps the smoothness when the surface is removed, when the new surface has no reference photos (every level is offered there), and when the value is not one the catalogue knows. Choosing the current value again removes it.
- Keyboard: each photo grid is one tab stop; arrow keys, Home and End move inside it, Enter or Space chooses, Escape closes the picker. After a surface, focus moves to the smoothness photos; after a smoothness, back to its tile.
- Tooltips on tiles and cards show the full label (the visible one may be cut off), the tag, the description and the photo credit.
- **ESM-only** (`type: module`). Import the CSS side effect separately.

Live demo: [osm-editor-kit.github.io/osm-surface-smoothness-tagging](https://osm-editor-kit.github.io/osm-surface-smoothness-tagging/)

## Install

```bash
npm install @osm-editor-kit/surface-smoothness-id-field
```

Peer data and photos come from
[`@osm-editor-kit/surface-smoothness-data`](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-data)
(declared as a dependency).

## Usage

```ts
import { createSurfaceSmoothnessField } from '@osm-editor-kit/surface-smoothness-id-field'
import '@osm-editor-kit/surface-smoothness-id-field/surface-smoothness-field.css'
import { select } from 'd3-selection'

const field = createSurfaceSmoothnessField(
  { surfaceKey: 'surface', smoothnessKey: 'smoothness' },
  {
    // Map catalogue paths like "images/foo.jpg" to URLs
    // your host can serve (iD: context.asset(...), Vite: import.meta.glob, …).
    assetUrl: (path) => `/assets/surface-smoothness/${path}`,
  },
  {
    // Optional i18n hook; falls back to built-in English strings.
    t: (key, fallback) => fallback,
  },
)

field.on('change', (patch) => {
  // patch is { surface?: string, smoothness?: string | undefined }
  // undefined values mean “clear this key”.
})

select('#field').call(field)
field.tags({ surface: 'asphalt' })
```

### Instance API

| Method                         | Description                                                           |
| ------------------------------ | --------------------------------------------------------------------- |
| `field(selection)`             | Mount / update into a d3 selection (call as `selection.call(field)`). |
| `field.tags(tags)`             | Push current OSM tags into the widget.                                |
| `field.entityIDs(ids)`         | Optional entity ids (iD multi-edit context).                          |
| `field.focus()`                | Focus the first tile.                                                 |
| `field.on('change', listener)` | Subscribe to tag patches (`TagPatch`).                                |

### Factory options

```ts
createSurfaceSmoothnessField(field?, context?, adapters?)
```

- **`field`** — `surfaceKey` / `smoothnessKey` (defaults `"surface"` / `"smoothness"`), optional `safeid`.
- **`context.assetUrl(path)`** — resolve catalogue asset paths to browser URLs. Required for photos to show.
- **`adapters.t(key, fallback)`** — translate UI labels (`surface`, `smoothness`, `surface_placeholder`, `smoothness_placeholder`, `photo`, `multiple_values`).
- **`adapters.optionLabel(key, value)`** — label of a tag value, e.g. from the host's translated tagging schema; `undefined` falls back to the catalogue's English title.
- **`adapters.optionDescription(key, value, surface?)`** — description of a tag value for its tooltip; `undefined` falls back to the catalogue's English description of the photo.
- **`adapters.tooltip(info)`** — the whole tooltip of a tile or card. `info` has `key`, `value`, `tag`, `label`, `description` and `credit`. Return a string to replace the built-in text, `null` for no tooltip, `undefined` to keep it.
- **`adapters.options(key)`** — more values for the fallback dropdown (e.g. the schema's options); they follow the catalogue's values.
- **`adapters.renderInput(cell, key, value, choose)`** — render the host's own input into the row below the photos; called on every render, call `choose(value)` with a new value.

## Styling

The CSS is plain and scoped: rules are `.surface-smoothness-field .ssf-…` (two classes or
more), so they win over a host's element rules like iD's `.ideditor button` and
`.ideditor button:focus` without `!important`, wherever the stylesheet is loaded.

**Custom properties.** Set them on the field or any ancestor (`:root` works). Unset ones fall
back to iD's theme variables, then to standalone values.

| Property | Default | What |
| --- | --- | --- |
| `--ssf-bg` | `--bg-color`, `#fff` | Tiles, cards, dropdown |
| `--ssf-photo-bg` | `--bg-color-2`, `#f6f6f6` | Behind photos, empty photo areas |
| `--ssf-hover-bg` | `--bg-color-3`, `#eee` | Hover and keyboard focus |
| `--ssf-border` | `--border-color`, `#ccc` | Empty tile frame, dropdown border |
| `--ssf-text` | `--text-color`, `#333` | Text |
| `--ssf-muted` | `--muted-text-color`, `#767676` | Placeholders, mixed values, tag codes |
| `--ssf-accent` | `--link-color`, `#1e90ff` | Value labels, chosen and open rings |
| `--ssf-focus` | `--ssf-text` | Keyboard focus ring |
| `--ssf-radius` | `4px` | Corner radius |
| `--ssf-gap` | `3px` | Gap between tiles and cards |
| `--ssf-font-size` | `12px` | Base font size |
| `--ssf-label-font-size` | `10px` | Labels under photos in the pickers |
| `--ssf-label-lines` | `2` | Lines a picker label may take before it is cut off |
| `--ssf-photo-ratio` | `4 / 3` | Photo shape in the pickers |
| `--ssf-value-photo-height` | `48px` | Photo height in the two tiles |
| `--ssf-tile-min-width` | `56px` | Minimum width of a surface tile (sets the columns) |
| `--ssf-card-min-width` | `72px` | Minimum width of a smoothness card |
| `--ssf-picker-max-height` | `none` | Cap the picker's height; it scrolls inside |

```css
.my-editor {
  --ssf-accent: rebeccapurple;
  --ssf-label-lines: 3;
  --ssf-picker-max-height: 320px;
}
```

**Overrides.** The `ssf-*` class names are stable. A host rule of the same weight that comes
after the package CSS wins, e.g. `.surface-smoothness-field .ssf-card-title { … }`. State
classes: `.empty`, `.mixed`, `.open` on the two tiles (`.ssf-value-surface`,
`.ssf-value-smoothness`), `.selected` on the chosen tile or card.

**Your own UI.** If the look is not enough, build your own UI on the headless entry below.

## Headless: `./logic`

The tag rules and the picker choices, without DOM, d3 or CSS. Use it with
[`@osm-editor-kit/surface-smoothness-data`](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-data)
to draw your own picker (React, Svelte, a native app, …) that behaves like this field:

```ts
import {
  orderedSurfaces,
  smoothnessChoices,
  surfaceChangePatch,
} from '@osm-editor-kit/surface-smoothness-id-field/logic'

orderedSurfaces() // ['asphalt', 'paving_stones', …] — the common ones first
smoothnessChoices('sett') // [{ smoothness: 'good', level, cell: { photo, description } }, …]
surfaceChangePatch('excellent', 'sett') // { surface: 'sett', smoothness: undefined }
```

### Helpers

Exported from `./logic` and from the main entry:

- `resolveKeys(field)`
- `smoothnessValuesForSurface(surface)` — the values with a reference photo for this surface (`[]` if none)
- `isSmoothnessValidForSurface(surface, smoothness)` — whether a smoothness may stay when the surface changes (see the rule above)
- `surfaceChangePatch(currentSmoothness, nextSurface, keys?)`
- `smoothnessChangePatch(nextSmoothness, keys?)`
- `orderedSurfaces()` — all catalogue surfaces, the common ones (`COMMON_SURFACES`) first
- `smoothnessChoices(surface)` — smoothness values to offer, with photos where there are some
- `photoCredit(path)` — source and license of a catalogue photo

## Using with iD

**Published workflow (normal):** the iD fork depends on this package from npm and copies
the runtime files into `dist/surface-smoothness-field/` with its
`npm run dist:surface-smoothness-field` script:

- `dist/index.js` from this package, saved as `surface-smoothness-field.esm.js` (one
  self-contained file: d3 and the catalogue are bundled in)
- `dist/surface-smoothness-field.css` from this package
- `dist/generated/images/*` from `@osm-editor-kit/surface-smoothness-data` into `images/`

iD lazy-imports that ESM file, adds the CSS with a `<link>`, and passes
`context.asset('surface-smoothness-field/' + path)` as `assetUrl`.

Wire it as a custom field type (for example `surfaceSmoothness`) in your iD fork, on the
presets that also offer `smoothness` (see the top of this README for where the field fits),
and drop the separate `smoothness` field there. Useful adapters in iD:

- `t`: the schema's `surface` / `smoothness` field titles and `inspector.multiple_values`
- `optionLabel`: the schema's translated option labels; long ones are cut off on the cards
  and readable in full in the tooltip
- `renderInput`: iD's own `uiFieldCombo` in the row below the photos

### Local development against the iD worktree

Use this when you are editing the field package and want to try changes in iD **before**
publishing a new npm version.

```bash
# terminal 1 — watch-build + copy into the worktree on every rebuild
bun run dev:id-field
# or once: bun run sync:id-worktree

# terminal 2
cd ../iD-surface-smoothness-worktree && npm start
```

`sync:id-worktree` (and the `dev` watcher) copy the local build into
`<iD-worktree>/dist/surface-smoothness-field/`, same paths iD’s lazy import expects.
Override the target with `ID_WORKTREE=/path/to/iD`.

After you publish, bump the worktree’s `@osm-editor-kit/surface-smoothness-*` versions and
run `npm run dist:surface-smoothness-field` again so the worktree tracks the registry,
not a one-off sync.

## License

[MIT](LICENSE). Reference photos keep their own licenses (CC-BY, CC-BY-SA, CC0, public domain);
see `catalogue.attribution` in `@osm-editor-kit/surface-smoothness-data`.
