# @osm-editor-kit/surface-smoothness-id-field

D3-based [iD editor](https://github.com/openstreetmap/iD) inspector widget for
combined `surface` + `smoothness` selection with reference photos.

- Surface picker → filters smoothness options via `smoothnessMatrix[surface]`.
- Each option shows vehicle icon + emoji + reference photo + description.
- Emits `surface=…` / `smoothness=…`; clears `smoothness` when it becomes invalid.

Built with Vite to `dist/surface-smoothness-field.{esm.js,js,css}` and synced into
the iD worktree via `bun run sync:id-worktree`.

**Status:** scaffold only — see `../../../WORK_PLAN.md` Phase 4.
