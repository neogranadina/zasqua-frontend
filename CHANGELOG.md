# Changelog

All notable changes to the Zasqua frontend will be documented in this file. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
