# Zasqua Frontend

Static site frontend for the [Zasqua](https://zasqua.org) archival platform, built with [Eleventy](https://www.11ty.dev/) (11ty) and [Pagefind](https://pagefind.app/).

## Overview

Zasqua provides public access to 104,000+ archival descriptions from four Colombian and one Peruvian repository. The entire public site is static — no server required at runtime. Search runs client-side via Pagefind's WASM engine; tree navigation loads pre-built JSON files on demand.

**Key features:**

- Static HTML pages for every archival description
- Client-side search with faceting, accent tolerance, and hierarchical date filtering
- Collapsible tree navigation for browsing archival hierarchies
- OCR full-text search for digitized PE-BN materials (hidden from display, indexed for search)
- Responsive design with mobile filter panel

## Requirements

- Node.js 18+
- npm

## Data

The frontend reads pre-exported JSON data at build time. This data is produced by the Django backend's `export_frontend_data` management command and placed in a `data/` directory (gitignored):

```
data/
  descriptions.json   # All descriptions with metadata + OCR text (~150 MB)
  repositories.json   # Repository records (~8 KB)
  children/           # Tree children per parent (1,602 files, ~40 MB)
```

The `DATA_DIR` environment variable overrides the default `./data/` path.

## Build

```bash
# Install dependencies
npm install

# Full build (Eleventy + Pagefind index)
npm run build

# Development build (limited to 100 descriptions for speed)
npm run build:dev

# Development server with live reload
npm run dev
```

The built site is output to `_site/`.

### Build stages

`npm run build` runs two stages:

1. **Eleventy** generates static HTML from the JSON data and Nunjucks templates
2. **Pagefind** indexes the built pages for client-side search

Tree children JSON files are copied to `_site/data/children/` via Eleventy's passthrough copy — no separate build step required.

### Build performance

| Stage | Full build | Dev build (100 pages) |
|-------|-----------|----------------------|
| Eleventy | ~15 min | ~1 sec |
| Pagefind | ~3 min | ~1 sec |
| **Total** | **~18 min** | **~2 sec** |

## Project Structure

```
src/
  _data/            Data layer (reads local JSON files)
    descriptions.js   104K descriptions (with OCR text)
    repositories.js   5 repositories (with root descriptions)
    entities.js       Stub (templates use denormalized fields)
    places.js         Stub (templates use denormalized fields)
    site.js           Site metadata (title, URL, language)
    ui.js             UI strings (Spanish)
  _includes/        Nunjucks partials
    header.njk        Site header with responsive hamburger menu
    footer.njk        Site footer
    breadcrumb.njk    Breadcrumb navigation
    children-tree.njk Collapsible children tree for description pages
  _layouts/         Page layouts
    base.njk          Base HTML layout
  css/
    main.css          All styles (Neogranadina visual identity)
  img/              Static images
  js/               Client-side JavaScript
    search.js         Pagefind search with facets, filters, pagination
    tree.js           Miller columns tree navigation (lazy-loads children JSON)
    description.js    Description page interactions
    header.js         Responsive header toggle
  index.njk         Home page (repository grid)
  repository.njk    Repository landing pages
  description.njk   Description detail pages (104K+)
  buscar.njk        Search page (/buscar/)
eleventy.config.js  Eleventy configuration and custom filters
```

## Pages

| Page | URL | Template |
|------|-----|----------|
| Home | `/` | `index.njk` |
| Repository | `/{repo-code}/` | `repository.njk` |
| Description | `/{reference-code}/` | `description.njk` |
| Search | `/buscar/` | `buscar.njk` |

## Search

Search uses [Pagefind](https://pagefind.app/) — a static search library that runs entirely in the browser via WebAssembly. No search server is required.

**Indexed content per page:**
- Title and metadata (default weight)
- OCR full text for PE-BN digitized materials (weight 0.5 — metadata matches rank higher)

**Search features:**
- Multi-word AND queries
- Quoted phrase search
- Accent-insensitive matching (García finds Garcia)
- Spanish stemming
- Faceted filtering: repository, description level, digital status, date (century/decade/year)
- Sorting by date, title, reference code, or relevance

## Data Pipeline

The full publish workflow:

1. **Catalog** in Django admin (backend running locally)
2. **Export** data with `manage.py export_frontend_data`
3. **Upload** JSON to Backblaze B2 private bucket
4. **Build** triggered manually via GitHub Actions — downloads data from B2, runs Eleventy + Pagefind
5. **Deploy** to Netlify CDN

The Django backend is only needed during cataloging and export — not at runtime.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATA_DIR` | `./data/` | Path to exported JSON data |
| `DEV_MODE` | `false` | Limit descriptions to 100 for faster builds |
| `SITE_URL` | `http://localhost:8080` | Base URL for the site |

## License

GPL-3.0. See [LICENSE](LICENSE) for details.

---

Zasqua is developed by [Neogranadina](https://neogranadina.org) and the [Archives, Memory, and Preservation Lab](https://ampl.clair.ucsb.edu) of the University of California, Santa Barbara.
