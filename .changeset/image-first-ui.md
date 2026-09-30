---
'@osm-editor-kit/surface-smoothness-id-field': minor
---

Photos first: two tiles side by side, the surface and its smoothness (photo and label, or an empty frame while not set). Clicking a tile opens its picker below: the surface first (the usual surfaces, the rest behind "More"), then the smoothness photos for that surface (or every level with its emoji where there are none). New `mode('text')` shows plain inputs instead, and the `optionLabel` adapter lets the host pass translated value labels. Each open picker also has a dropdown below the photos (the catalogue's values plus the host's, via the new `options` adapter; any typed value works). The grid shows 12 common surfaces before "More".
