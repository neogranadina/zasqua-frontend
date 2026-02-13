#!/bin/bash
set -e

# Zasqua frontend build script for Netlify.
# Downloads exported data from B2, builds the site with Eleventy,
# then indexes with Pagefind.
#
# Required environment variables:
#   B2_APPLICATION_KEY_ID  — read-only key ID for zasqua-export bucket
#   B2_APPLICATION_KEY     — read-only application key

# Increase Node heap for large Eleventy builds (free tier has 8 GB)
export NODE_OPTIONS="--max-old-space-size=7168"

echo "=== Installing B2 CLI ==="
pip install b2[full] --quiet

echo "=== Authenticating with B2 ==="
b2 account authorize "$B2_APPLICATION_KEY_ID" "$B2_APPLICATION_KEY"

echo "=== Downloading export data ==="
mkdir -p data/children

b2 file download b2://zasqua-export/descriptions.json data/descriptions.json
b2 file download b2://zasqua-export/repositories.json data/repositories.json
b2 sync b2://zasqua-export/children/ data/children/

echo "=== Data downloaded ==="
ls -lh data/descriptions.json data/repositories.json
echo "Children files: $(ls data/children/ | wc -l)"

echo "=== Installing npm dependencies ==="
npm ci

echo "=== Building site ==="
npx eleventy

echo "=== Indexing with Pagefind ==="
npx pagefind --site _site

echo "=== Build complete ==="
echo "Pages: $(find _site -name 'index.html' | wc -l)"
echo "Site size: $(du -sh _site | cut -f1)"
