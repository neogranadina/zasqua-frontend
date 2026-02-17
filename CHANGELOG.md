# Changelog

All notable changes to the Zasqua frontend will be documented in this file. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-02-17

IIIF viewer integration, metadata display expansion, and full-text search in OCR content.

### Added

- TIFY v0.31.0 IIIF viewer on description pages with deep zoom, expand/fullscreen states, and thumbnails panel
- Self-hosted TIFY assets (no external CDN dependency)
- Bibliographic information section (ISAD(G)): imprint, edition, series, uniform title, section title, pages
- Access conditions section: reproduction conditions, language
- Related materials section: location of originals, related materials
- Notes section: finding aids, notes
- Country facet in search filters
- Thumbnails in search results loaded from IIIF tile sets
- OCR full-text search — 14,331 CDIP items indexed by Pagefind at 0.5 weight, capped at 15K characters with deduplication

### Fixed

- Mobile viewer: skip expanded state, show fullscreen button directly (expanded adds no value at mobile widths)
- Pipe-delimited metadata fields (extent, language) split into separate lines for display

## [0.1.0] — 2026-02-14

First release. Static archival discovery site at zasqua.org with 104K+ descriptions across 5 repositories.

### Added

- 11ty (Eleventy) static site with Nunjucks templates, built from pre-exported JSON data
- Pagefind client-side search with faceted filtering: repository, description level, hierarchical date (century/decade/year), digital status
- Search page with sort options (date, title, reference code, relevance), text filter chips with boolean operators (AND/NOT), scoped facet counts
- Browse prompt for large filter-only queries (>10K results) with estimated count
- Description page template with breadcrumb navigation, metadata display, and collapsible children tree
- Repository landing pages with fonds-level overview
- Pre-built static JSON for tree navigation (1,602 parent files)
- OCR text indexed with reduced weight for PE-BN collection (14,272 descriptions)
- Responsive design: hamburger menu at mobile breakpoint, collapsible filter panel with touch-friendly targets
- Parent filter in search — "see all" links in children trees filter search by parent reference code
- Repository abbreviations in search filter pills (via short_name)
- GitHub Actions CI/CD: build with Eleventy + Pagefind, deploy to Netlify via netlify-cli
- Data pipeline: downloads JSON from Backblaze B2 at build time, no runtime server dependency
