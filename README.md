# Zasqua Frontend

Static site frontend for the Zasqua archival platform, built with 11ty (Eleventy).

## Overview

This frontend provides:
- Static HTML pages for repository and description browsing
- Meilisearch-powered search interface
- Responsive design with Neogranadina styling
- Pre-built pages fetched from the API at build time

## Requirements

- Node.js 18+
- npm or yarn

## Setup

```bash
# Install dependencies
npm install

# Development server (fetches mock data)
npm run dev

# Production build (fetches from API)
npm run build
```

## Project Structure

```
src/
  _data/           # Data fetchers for API
  _includes/       # Nunjucks partials (header, footer, etc.)
  _layouts/        # Page layouts
  css/             # Stylesheets
  img/             # Static images
  js/              # JavaScript files
  index.njk        # Home page
  repository.njk   # Repository pages
```

## Development

### DEV_MODE

Set `DEV_MODE=true` to use mock data instead of fetching from the API:

```bash
DEV_MODE=true npm run dev
```

### Build

```bash
# Development build with mock data
npm run build:dev

# Production build
npm run build
```

The built site is output to `_site/`.

## Pages

| Page | URL Pattern | Description |
|------|-------------|-------------|
| Home | `/` | Repository grid with cards |
| Repository | `/{repo-code}/` | Root descriptions for a repository |
| Description | `/{repo-code}/{ref-code}/` | Description detail with hierarchy |
| Search | `/search/` | Full-text search with facets |

## Styling

The frontend uses custom CSS based on Neogranadina design:
- Masonry grid layout for repository cards
- Collapsible tree navigation for hierarchy
- Responsive breakpoints for mobile/tablet/desktop

## API Integration

Data is fetched at build time from the backend API:
- `src/_data/repositories.js` - Fetches all repositories
- `src/_data/descriptions.js` - Fetches descriptions for pages

Configure the API URL in `eleventy.config.js`.
