# Zasqua Frontend

Static site frontend for the Zasqua archival platform, built with 11ty (Eleventy).

## Overview

This frontend provides:
- Static HTML pages for 104K+ archival descriptions
- Pagefind static search with faceting, accent tolerance, and hierarchical date filtering
- Miller columns tree navigation from pre-built JSON files
- Repository browsing pages

The entire public site is static — no server required. Search runs client-side via Pagefind's WASM engine; tree navigation loads pre-built JSON files on demand.

## Requirements

- Node.js 18+
- npm

## Build

The full build has three stages:

```bash
# 1. Build HTML pages from Django API data
npx eleventy

# 2. Generate tree navigation JSON (1,602 parent files)
node scripts/generate-tree-json.js

# 3. Index pages for search
npx pagefind --site _site
```

Or all at once:

```bash
npx eleventy && node scripts/generate-tree-json.js && npx pagefind --site _site
```

For quick iteration with a small dataset:

```bash
DEV_MODE=true npx eleventy && npx pagefind --site _site
```

The built site is output to `_site/`.

## Project Structure

```
src/
  _data/           # Build-time data fetchers (Django API)
  _includes/       # Nunjucks partials (header, footer, breadcrumb)
  _layouts/        # Page layouts
  css/             # Stylesheets
  img/             # Static images
  js/              # Client-side JavaScript (search, tree, description)
  index.njk        # Home page
  repository.njk   # Repository pages
  description.njk  # Description pages (104K+)
  buscar.njk       # Search page
scripts/
  generate-tree-json.js  # Build script for tree navigation data
```

## Pages

| Page | URL Pattern | Description |
|------|-------------|-------------|
| Home | `/` | Repository grid with cards |
| Repository | `/{repo-code}/` | Miller columns tree for browsing |
| Description | `/{reference-code}/` | Description detail with metadata |
| Search | `/buscar/` | Faceted search with Pagefind |

## Data Pipeline

At build time, 11ty fetches all descriptions from the Django REST API. Pagefind indexes the built pages. The tree JSON script generates children files for hierarchical navigation. Once built, the site is fully self-contained.

The Django backend is only needed during builds — not at runtime.
