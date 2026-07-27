# Changesets

This folder holds [changesets](https://github.com/changesets/changesets). Each changeset is a
markdown file describing a version bump for the published packages:

- `@osm-editor-kit/surface-smoothness-data`
- `@osm-editor-kit/surface-smoothness-id-field`

(Those two are **fixed** together — same version on every release.)

For code/data changes, run `bunx changeset` and commit the result. When you are ready to
publish, follow the **Release** section in the root README (same flow as
[`maplibre-editor-layer-index`](https://github.com/osm-editor-kit/maplibre-editor-layer-index),
but run locally — this repo does not auto-publish from CI yet).
