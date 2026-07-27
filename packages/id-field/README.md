# [@osm-editor-kit/surface-smoothness-id-field](https://www.npmjs.com/package/@osm-editor-kit/surface-smoothness-id-field)

D3 inspector field for the [iD editor](https://github.com/openstreetmap/iD): pick
`surface` and a matching `smoothness` with StreetComplete-style reference photos.

- Choose a surface → smoothness options are filtered to that surface’s matrix.
- Each smoothness option shows a vehicle icon, emoji, reference photo, and short description.
- Emits tag patches for `surface` / `smoothness`; clears `smoothness` when it is no longer valid for the selected surface.
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
    // Map catalogue paths like "images/foo.jpg" / "icons/bar.svg" to URLs
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
| `field.focus()`                | Focus the surface input.                                              |
| `field.on('change', listener)` | Subscribe to tag patches (`TagPatch`).                                |

### Factory options

```ts
createSurfaceSmoothnessField(field?, context?, adapters?)
```

- **`field`** — `surfaceKey` / `smoothnessKey` (defaults `"surface"` / `"smoothness"`), optional `safeid`.
- **`context.assetUrl(path)`** — resolve catalogue asset paths to browser URLs. Required for photos and icons to show.
- **`adapters.t(key, fallback)`** — translate UI labels.

### Helpers

Also exported for hosts that need the same tag rules without the UI:

- `resolveKeys(field)`
- `smoothnessValuesForSurface(surface)`
- `isSmoothnessValidForSurface(surface, smoothness)`
- `surfaceChangePatch(currentSmoothness, nextSurface, keys?)`
- `smoothnessChangePatch(nextSmoothness, keys?)`

## Using with iD

This package is the field implementation. iD typically:

1. Lazy-imports the ESM bundle and injects the CSS.
2. Passes `context.asset(...)` as `assetUrl` so images/icons load from iD’s static asset tree.
3. Forwards `change` events into iD’s field `dispatch('change', tags)`.

Wire it as a custom field type (for example `surface_smoothness`) in your iD fork or
plugin, then point presets at that type instead of separate `surface` / `smoothness`
combo fields.

## License

GPL-3.0-or-later. Reference photos keep their own licenses (CC-BY-SA / CC0 / PD);
see attribution in `@osm-editor-kit/surface-smoothness-data`.
