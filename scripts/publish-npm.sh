#!/usr/bin/env bash
# Publish both packages to npm from local tarballs. `bun pm pack` replaces `workspace:*` with
# the real version; `npm publish` handles the npm login in the browser. Run from the repo root
# after `changeset version` and a commit.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf .release
bun run build:packages
(cd packages/data && bun pm pack --quiet --destination ../../.release)
(cd packages/id-field && bun pm pack --quiet --destination ../../.release)
for tarball in .release/*-data-*.tgz .release/*-id-field-*.tgz; do
  npm publish "$tarball" --access public --provenance=false
done
rm -rf .release
