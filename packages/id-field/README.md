# [@osm-editor-kit/surface-smoothness-id-field](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-id-field)

D3 inspector field for the [iD editor](https://github.com/openstreetmap/iD): pick
`surface` and a matching `smoothness` with StreetComplete-style reference photos.

- Two tiles side by side: the surface and its smoothness, each with its photo and label (an empty frame while not set). The tags are in the tooltip.
- Clicking a tile opens its picker below: all surface photos first; choosing a surface opens the smoothness photos for that surface (or every level with its "usable by" emoji where StreetComplete has no photos).
- Below the photos, a label | input row takes any value, also one without a photo. A host can render its own input there (`adapters.renderInput`, e.g. iD's combo field with its translated dropdown); otherwise the field draws a simple dropdown.
- Emits tag patches for `surface` / `smoothness`; clears `smoothness` when it is no longer valid for the selected surface. Choosing the current value again removes it.
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
- **`adapters.options(key)`** — more values for the fallback dropdown (e.g. the schema's options); they follow the catalogue's values.
- **`adapters.renderInput(cell, key, value, choose)`** — render the host's own input into the row below the photos; called on every render, call `choose(value)` with a new value.

### Helpers

Also exported for hosts that need the same tag rules without the UI:

- `resolveKeys(field)`
- `smoothnessValuesForSurface(surface)`
- `isSmoothnessValidForSurface(surface, smoothness)`
- `surfaceChangePatch(currentSmoothness, nextSurface, keys?)`
- `smoothnessChangePatch(nextSmoothness, keys?)`
- `orderedSurfaces()` — all catalogue surfaces, the common ones (`COMMON_SURFACES`) first
- `smoothnessChoices(surface)` — smoothness values to offer, with photos where there are some
- `photoCredit(path)` — source and license of a catalogue photo

## Using with iD

**Published workflow (normal):** the iD worktree depends on this package from npm and
copies runtime assets into `dist/surface-smoothness-field/` via
`npm run dist:surface-smoothness-field` (ESM/IIFE/CSS from this package, images/icons
from `@osm-editor-kit/surface-smoothness-data`). iD lazy-imports that ESM bundle, injects
the CSS, and passes `context.asset('surface-smoothness-field/' + path)` as `assetUrl`.

Wire it as a custom field type (for example `surfaceSmoothness`) in your iD fork or
plugin, then point presets at that type instead of separate `surface` / `smoothness`
combo fields.

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
