---
"@osm-editor-kit/surface-smoothness-id-field": major
---

- The stable API is `createSurfaceSmoothnessField` (the d3 field with its `tags`, `entityIDs`, `focus` and `on('change')` instance), the stylesheet `./surface-smoothness-field.css` with its `--ssf-*` custom properties, and the headless tag rules and picker choices (`resolveKeys`, `surfaceChangePatch`, `smoothnessChangePatch`, `isSmoothnessValidForSurface`, `smoothnessValuesForSurface`, `smoothnessChoices`, `orderedSurfaces`, `COMMON_SURFACES`, `photoCredit`) from the main entry and from `./logic`. From 1.0.0 these follow semver.
- Breaking: `SurfaceSmoothnessFieldDefinition.safeid` is removed. The field never used it. Remove `safeid` from the first argument of `createSurfaceSmoothnessField`.
- Breaking: `DEFAULT_KEYS` is no longer exported from `./logic`. Use `resolveKeys()`, which returns the keys with the defaults `surface` / `smoothness` filled in.
- `d3-dispatch` and `d3-selection` are no longer listed as dependencies. They are bundled into `dist/index.js`, so nothing for you to install. `@osm-editor-kit/surface-smoothness-data` stays a dependency (the `./logic` entry imports it).
- The main entry lists its exports by name (no `export *`). The names are the same as before, except those removed above.
- npm provenance is no longer set in `publishConfig`; releases are published from a terminal.
