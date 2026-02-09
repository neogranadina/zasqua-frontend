/**
 * Search Page
 *
 * Connects to the Meilisearch API via Django proxy to provide
 * full-text search with facets, pagination, and URL-driven state.
 */

class SearchPage {
  constructor(container) {
    this.container = container;
    this.apiUrl = container.dataset.apiUrl || 'http://localhost:8000/api/v1';
    this.levelLabels = {};
    try {
      this.levelLabels = JSON.parse(container.dataset.levelLabels || '{}');
    } catch (e) {
      console.warn('Could not parse level labels');
    }

    this.state = {
      q: '',
      textFilters: [],
      repository: [],
      level: [],
      has_digital: false,
      date_from: '',
      date_to: '',
      sort: '',
      page: 1
    };

    this.abortController = null;
    this.repoNameMap = {};
    this.dateDebounceTimer = null;
    this.facetGroupState = { repository: true, level: true, dateRange: false };

    this.init();
  }

  init() {
    this.parseUrlParams();

    window.addEventListener('popstate', () => {
      this.parseUrlParams();
      this.search();
    });

    this.search();
  }

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const qValues = params.getAll('q');
    this.state.q = qValues[0] || '';
    this.state.textFilters = qValues.slice(1).map(v => {
      if (v.startsWith('-')) {
        return { term: v.slice(1), op: 'NOT' };
      }
      return { term: v, op: 'AND' };
    });
    this.state.repository = params.getAll('repository');
    this.state.level = params.getAll('level');
    this.state.has_digital = params.get('has_digital') === 'true';
    this.state.date_from = params.get('date_from') || '';
    this.state.date_to = params.get('date_to') || '';
    this.state.sort = params.get('sort') || '';
    this.state.page = parseInt(params.get('page'), 10) || 1;
  }

  updateUrl() {
    const params = new URLSearchParams();
    if (this.state.q) params.append('q', this.state.q);
    for (const f of this.state.textFilters) {
      params.append('q', f.op === 'NOT' ? `-${f.term}` : f.term);
    }
    for (const repo of this.state.repository) {
      params.append('repository', repo);
    }
    for (const level of this.state.level) {
      params.append('level', level);
    }
    if (this.state.has_digital) params.set('has_digital', 'true');
    if (this.state.date_from) params.set('date_from', this.state.date_from);
    if (this.state.date_to) params.set('date_to', this.state.date_to);
    if (this.state.sort) params.set('sort', this.state.sort);
    if (this.state.page > 1) params.set('page', this.state.page);

    const qs = params.toString();
    const url = qs ? `/buscar/?${qs}` : '/buscar/';
    history.pushState(null, '', url);
  }

  buildApiUrl() {
    const params = new URLSearchParams();
    const andTerms = this.state.textFilters.filter(f => f.op === 'AND').map(f => f.term);
    const combinedQuery = [this.state.q, ...andTerms].filter(Boolean).join(' ');
    params.set('q', combinedQuery);
    for (const repo of this.state.repository) {
      params.append('repository', repo);
    }
    for (const level of this.state.level) {
      params.append('level', level);
    }
    if (this.state.has_digital) params.set('has_digital', 'true');
    if (this.state.date_from) params.set('date_from', this.state.date_from);
    if (this.state.date_to) params.set('date_to', this.state.date_to);
    if (this.state.sort) params.set('sort', this.state.sort);
    if (this.state.page > 1) params.set('page', this.state.page);

    return `${this.apiUrl}/search/?${params.toString()}`;
  }

  async search() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    this.showLoading();

    try {
      const response = await fetch(this.buildApiUrl(), {
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this.cacheRepoNames(data.hits);
      this.renderSearchResults(data);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Search error:', error);
      this.showError();
    }
  }

  cacheRepoNames(hits) {
    for (const hit of hits) {
      if (hit.repository_code && hit.repository_name) {
        this.repoNameMap[hit.repository_code] = hit.repository_name;
      }
    }
  }

  // --- Rendering ---

  renderSearchResults(data) {
    this.container.innerHTML = '';

    const layout = document.createElement('div');
    layout.className = 'search-layout';

    // Results column (left)
    const resultsCol = document.createElement('div');
    resultsCol.className = 'search-results';
    resultsCol.setAttribute('aria-live', 'polite');

    // Mobile filter toggle
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-filter-toggle';
    mobileToggle.type = 'button';
    mobileToggle.innerHTML = 'Filtros <span class="toggle-chevron">&#9660;</span>';
    mobileToggle.addEventListener('click', () => {
      const sidebar = this.container.querySelector('.search-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('sidebar-open');
        mobileToggle.classList.toggle('toggle-open');
      }
    });
    resultsCol.appendChild(mobileToggle);

    // Results info bar
    resultsCol.appendChild(this.renderResultsInfo(data));

    // Active filter pills
    const pills = this.renderPills();
    if (pills) resultsCol.appendChild(pills);

    // Result items
    if (data.hits.length === 0) {
      resultsCol.appendChild(this.renderNoResults());
    } else {
      const resultsList = document.createElement('div');
      resultsList.className = 'search-results-list';
      const notTerms = this.state.textFilters
        .filter(f => f.op === 'NOT')
        .map(f => f.term.toLowerCase());
      for (const hit of data.hits) {
        const card = this.renderResultCard(hit);
        if (notTerms.length > 0) {
          const text = card.textContent.toLowerCase();
          if (notTerms.some(t => text.includes(t))) {
            card.style.display = 'none';
          }
        }
        resultsList.appendChild(card);
      }
      resultsCol.appendChild(resultsList);
    }

    // Pagination
    if (data.total_pages > 1) {
      resultsCol.appendChild(this.renderPagination(data));
    }

    layout.appendChild(resultsCol);

    // Sidebar (right)
    const sidebar = this.renderFacets(data);
    layout.appendChild(sidebar);

    this.container.appendChild(layout);
  }

  renderResultsInfo(data) {
    const info = document.createElement('div');
    info.className = 'results-info search-results-info';

    const count = document.createElement('span');
    count.className = 'results-count';
    const totalText = data.total >= 1000
      ? 'M\u00E1s de ' + data.total.toLocaleString('es-ES')
      : data.total.toLocaleString('es-ES');
    count.textContent = totalText + ' resultados';
    info.appendChild(count);

    // Sort buttons (Telar style)
    const sortWrap = document.createElement('div');
    sortWrap.className = 'sort-wrap';

    const sortLabel = document.createElement('span');
    sortLabel.className = 'sort-label';
    sortLabel.textContent = 'Ordenar por:';
    sortWrap.appendChild(sortLabel);

    const sortOptions = [
      { field: 'date_start_year', label: 'Fecha' },
      { field: 'title', label: 'Título' },
      { field: 'reference_code', label: 'Código' },
      { field: '', label: 'Relevancia' }
    ];

    sortOptions.forEach((opt, i) => {
      if (i > 0) {
        const divider = document.createElement('span');
        divider.className = 'sort-divider';
        divider.textContent = '|';
        sortWrap.appendChild(divider);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sort-btn';

      // Determine if this button is active and its direction
      const currentField = this.state.sort ? this.state.sort.split(':')[0] : '';
      const currentDir = this.state.sort ? this.state.sort.split(':')[1] : '';
      const isActive = opt.field === '' ? !this.state.sort : currentField === opt.field;

      if (isActive) btn.classList.add('active');

      btn.textContent = opt.label;

      // Arrow for sortable fields (not relevance)
      if (opt.field) {
        const arrow = document.createElement('span');
        arrow.className = 'sort-arrow';
        if (isActive) {
          arrow.textContent = currentDir === 'desc' ? ' \u2193' : ' \u2191';
        } else {
          arrow.textContent = ' \u2191';
        }
        btn.appendChild(arrow);
      }

      btn.addEventListener('click', () => {
        if (opt.field === '') {
          // Relevance — clear sort
          this.handleSort('');
        } else if (isActive) {
          // Toggle direction
          const newDir = currentDir === 'asc' ? 'desc' : 'asc';
          this.handleSort(`${opt.field}:${newDir}`);
        } else {
          // Activate with asc default
          this.handleSort(`${opt.field}:asc`);
        }
      });

      sortWrap.appendChild(btn);
    });

    info.appendChild(sortWrap);

    return info;
  }

  renderRefineInput() {
    const wrap = document.createElement('div');
    wrap.className = 'refine-search';

    // Input (first)
    let currentOp = 'AND';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Buscar en resultados...';

    const addTerm = () => {
      const term = input.value.trim();
      if (!term) return;
      const exists = this.state.textFilters.some(f => f.term === term && f.op === currentOp);
      if (!exists) {
        this.state.textFilters.push({ term, op: currentOp });
        this.state.page = 1;
        input.value = '';
        this.updateUrl();
        this.search();
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTerm();
      }
    });
    wrap.appendChild(input);

    // Divider
    const divider = document.createElement('span');
    divider.className = 'refine-divider';
    wrap.appendChild(divider);

    // Operator selector
    const opWrap = document.createElement('div');
    opWrap.className = 'refine-op';

    const opBtn = document.createElement('button');
    opBtn.type = 'button';
    opBtn.className = 'refine-op-btn';
    opBtn.innerHTML = 'S\u00ED <span class="refine-op-caret">\u25BE</span>';

    const opMenu = document.createElement('div');
    opMenu.className = 'refine-op-menu';
    opMenu.style.display = 'none';

    const options = [
      { value: 'AND', label: 'S\u00ED' },
      { value: 'NOT', label: 'No' }
    ];
    for (const opt of options) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'refine-op-option';
      item.textContent = opt.label;
      item.addEventListener('click', () => {
        currentOp = opt.value;
        opBtn.innerHTML = `${opt.label} <span class="refine-op-caret">\u25BE</span>`;
        opMenu.style.display = 'none';
      });
      opMenu.appendChild(item);
    }

    opBtn.addEventListener('click', () => {
      opMenu.style.display = opMenu.style.display === 'none' ? '' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (!opWrap.contains(e.target)) {
        opMenu.style.display = 'none';
      }
    });

    opWrap.appendChild(opBtn);
    opWrap.appendChild(opMenu);
    wrap.appendChild(opWrap);

    // Divider
    const divider2 = document.createElement('span');
    divider2.className = 'refine-divider';
    wrap.appendChild(divider2);

    // Add button (last)
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'refine-add-btn';
    addBtn.innerHTML = '+';
    addBtn.setAttribute('aria-label', 'Agregar filtro de texto');
    addBtn.addEventListener('click', addTerm);
    wrap.appendChild(addBtn);

    return wrap;
  }

  renderResultCard(hit) {
    const item = document.createElement('div');
    item.className = 'result-item';

    // Title
    const title = document.createElement('h3');
    title.className = 'result-title';
    const link = document.createElement('a');
    link.href = `/${hit.reference_code}/`;
    link.innerHTML = (hit._formatted && hit._formatted.title) || this.escapeHtml(hit.title);
    title.appendChild(link);
    item.appendChild(title);

    // Meta line: level badge + reference code + date
    const meta = document.createElement('div');
    meta.className = 'result-meta';

    const levelLabel = this.levelLabels[hit.description_level] || hit.description_level;
    const badge = document.createElement('span');
    badge.className = 'level-badge';
    badge.textContent = levelLabel;
    meta.appendChild(badge);

    if (hit.reference_code) {
      const sep1 = document.createTextNode(' \u00B7 ');
      meta.appendChild(sep1);
      const refCode = document.createElement('span');
      refCode.textContent = hit.reference_code;
      meta.appendChild(refCode);
    }

    if (hit.date_expression) {
      const sep2 = document.createTextNode(' \u00B7 ');
      meta.appendChild(sep2);
      const date = document.createElement('span');
      date.textContent = hit.date_expression;
      meta.appendChild(date);
    }

    item.appendChild(meta);

    // Snippet
    const snippetContent = hit._formatted && hit._formatted.scope_content;
    if (snippetContent) {
      const snippet = document.createElement('div');
      snippet.className = 'result-snippet';
      snippet.innerHTML = this.truncateHtml(snippetContent, 200);
      item.appendChild(snippet);
    }

    // Path
    if (hit.path_cache) {
      const path = document.createElement('div');
      path.className = 'result-path';
      path.textContent = hit.path_cache;
      item.appendChild(path);
    }

    // Repository name
    if (hit.repository_name) {
      const repo = document.createElement('div');
      repo.className = 'result-repo';
      repo.textContent = hit.repository_name;
      item.appendChild(repo);
    }

    return item;
  }

  renderFacets(data) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'search-sidebar';

    // Heading
    const heading = document.createElement('h3');
    heading.className = 'search-sidebar-heading';
    heading.textContent = 'Filtrar por:';
    sidebar.appendChild(heading);

    // Refine search input
    sidebar.appendChild(this.renderRefineInput());

    const facets = data.facets || {};

    // Repository facet
    if (facets.repository_code) {
      sidebar.appendChild(this.renderFacetGroup(
        'Repositorio',
        'repository',
        facets.repository_code,
        this.state.repository,
        (code) => this.repoNameMap[code] || code
      ));
    }

    // Level facet
    if (facets.description_level) {
      sidebar.appendChild(this.renderFacetGroup(
        'Nivel de descripción',
        'level',
        facets.description_level,
        this.state.level,
        (key) => this.levelLabels[key] || key
      ));
    }

    // Date range
    sidebar.appendChild(this.renderDateRange());

    // Has digital checkbox
    if (facets.has_digital) {
      const digitalCount = facets.has_digital['true'] || 0;
      if (digitalCount > 0) {
        const digitalWrap = document.createElement('div');
        digitalWrap.className = 'facet-digital';

        const label = document.createElement('label');
        label.className = 'facet-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.state.has_digital;
        checkbox.addEventListener('change', () => {
          this.state.has_digital = checkbox.checked;
          this.state.page = 1;
          this.updateUrl();
          this.search();
        });
        label.appendChild(checkbox);

        const text = document.createElement('span');
        text.className = 'facet-label-text';
        text.textContent = 'Copia digitalizada disponible';
        label.appendChild(text);

        const count = document.createElement('span');
        count.className = 'facet-count';
        count.textContent = `(${digitalCount.toLocaleString('es-ES')})`;
        label.appendChild(count);

        digitalWrap.appendChild(label);
        sidebar.appendChild(digitalWrap);
      }
    }

    return sidebar;
  }

  renderFacetGroup(title, stateKey, facetData, activeValues, labelFn) {
    const group = document.createElement('div');
    group.className = 'facet-group';

    const isOpen = this.facetGroupState[stateKey] !== false;

    // Toggle button
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'facet-group-toggle';
    toggle.innerHTML = `<span class="facet-group-title">${this.escapeHtml(title)}</span><span class="facet-group-indicator">${isOpen ? '\u2212' : '+'}</span>`;
    toggle.addEventListener('click', () => {
      this.facetGroupState[stateKey] = !this.facetGroupState[stateKey];
      const content = group.querySelector('.facet-group-content');
      const indicator = toggle.querySelector('.facet-group-indicator');
      if (content) {
        content.style.display = this.facetGroupState[stateKey] ? '' : 'none';
        indicator.textContent = this.facetGroupState[stateKey] ? '\u2212' : '+';
      }
    });
    group.appendChild(toggle);

    // Content
    const content = document.createElement('div');
    content.className = 'facet-group-content';
    content.style.display = isOpen ? '' : 'none';

    // Sort facet entries: active first, then by count descending
    const entries = Object.entries(facetData).sort((a, b) => {
      const aActive = activeValues.includes(a[0]) ? 1 : 0;
      const bActive = activeValues.includes(b[0]) ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return b[1] - a[1];
    });

    for (const [value, count] of entries) {
      const label = document.createElement('label');
      label.className = 'facet-option';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = value;
      checkbox.checked = activeValues.includes(value);
      checkbox.addEventListener('change', () => {
        this.handleFilterChange(stateKey, value, checkbox.checked);
      });
      label.appendChild(checkbox);

      const text = document.createElement('span');
      text.className = 'facet-label-text';
      text.textContent = labelFn(value);
      label.appendChild(text);

      const countSpan = document.createElement('span');
      countSpan.className = 'facet-count';
      countSpan.textContent = `(${count.toLocaleString('es-ES')})`;
      label.appendChild(countSpan);

      content.appendChild(label);
    }

    group.appendChild(content);
    return group;
  }

  renderDateRange() {
    const group = document.createElement('div');
    group.className = 'facet-group';

    const isOpen = this.facetGroupState.dateRange !== false;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'facet-group-toggle';
    toggle.innerHTML = '<span class="facet-group-title">Rango de fechas</span><span class="facet-group-indicator">' + (isOpen ? '\u2212' : '+') + '</span>';
    toggle.addEventListener('click', () => {
      this.facetGroupState.dateRange = !this.facetGroupState.dateRange;
      const content = group.querySelector('.facet-group-content');
      const indicator = toggle.querySelector('.facet-group-indicator');
      if (content) {
        content.style.display = this.facetGroupState.dateRange ? '' : 'none';
        indicator.textContent = this.facetGroupState.dateRange ? '\u2212' : '+';
      }
    });
    group.appendChild(toggle);

    const content = document.createElement('div');
    content.className = 'facet-group-content';
    content.style.display = isOpen ? '' : 'none';

    const row = document.createElement('div');
    row.className = 'date-range-inputs';

    const fromInput = document.createElement('input');
    fromInput.type = 'number';
    fromInput.className = 'date-input';
    fromInput.placeholder = 'Desde';
    fromInput.min = '1500';
    fromInput.max = '2025';
    fromInput.step = '1';
    fromInput.value = this.state.date_from;
    fromInput.addEventListener('input', () => {
      clearTimeout(this.dateDebounceTimer);
      this.dateDebounceTimer = setTimeout(() => {
        this.state.date_from = fromInput.value;
        this.state.page = 1;
        this.updateUrl();
        this.search();
      }, 300);
    });
    row.appendChild(fromInput);

    const dash = document.createElement('span');
    dash.className = 'date-range-dash';
    dash.textContent = '\u2014';
    row.appendChild(dash);

    const toInput = document.createElement('input');
    toInput.type = 'number';
    toInput.className = 'date-input';
    toInput.placeholder = 'Hasta';
    toInput.min = '1500';
    toInput.max = '2025';
    toInput.step = '1';
    toInput.value = this.state.date_to;
    toInput.addEventListener('input', () => {
      clearTimeout(this.dateDebounceTimer);
      this.dateDebounceTimer = setTimeout(() => {
        this.state.date_to = toInput.value;
        this.state.page = 1;
        this.updateUrl();
        this.search();
      }, 300);
    });
    row.appendChild(toInput);

    content.appendChild(row);
    group.appendChild(content);
    return group;
  }

  renderPills() {
    const hasFilters = this.state.textFilters.length > 0 ||
      this.state.repository.length > 0 ||
      this.state.level.length > 0 ||
      this.state.has_digital ||
      this.state.date_from ||
      this.state.date_to;

    if (!hasFilters) return null;

    const container = document.createElement('div');
    container.className = 'active-filters';

    // Text filter chips (with quoted label, like Telar)
    for (const f of this.state.textFilters) {
      const prefix = f.op === 'NOT' ? 'No: ' : '';
      container.appendChild(this.createPill(
        `${prefix}\u201C${f.term}\u201D`,
        () => {
          this.state.textFilters = this.state.textFilters.filter(t => t !== f);
          this.state.page = 1;
          this.updateUrl();
          this.search();
        }
      ));
    }

    for (const repo of this.state.repository) {
      container.appendChild(this.createPill(
        this.repoNameMap[repo] || repo,
        () => this.handlePillRemove('repository', repo)
      ));
    }

    for (const level of this.state.level) {
      container.appendChild(this.createPill(
        this.levelLabels[level] || level,
        () => this.handlePillRemove('level', level)
      ));
    }

    if (this.state.has_digital) {
      container.appendChild(this.createPill(
        'Digitalizado',
        () => {
          this.state.has_digital = false;
          this.state.page = 1;
          this.updateUrl();
          this.search();
        }
      ));
    }

    if (this.state.date_from || this.state.date_to) {
      const dateLabel = (this.state.date_from || '...') + ' \u2013 ' + (this.state.date_to || '...');
      container.appendChild(this.createPill(
        dateLabel,
        () => {
          this.state.date_from = '';
          this.state.date_to = '';
          this.state.page = 1;
          this.updateUrl();
          this.search();
        }
      ));
    }

    // Clear all button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'clear-filters-btn';
    clearBtn.textContent = 'Limpiar filtros';
    clearBtn.addEventListener('click', () => this.handleClearAll());
    container.appendChild(clearBtn);

    return container;
  }

  createPill(label, onRemove) {
    const pill = document.createElement('span');
    pill.className = 'filter-pill';

    const text = document.createElement('span');
    text.textContent = label;
    pill.appendChild(text);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'filter-pill-remove';
    removeBtn.innerHTML = '&times;';
    removeBtn.setAttribute('aria-label', `Eliminar filtro: ${label}`);
    removeBtn.addEventListener('click', onRemove);
    pill.appendChild(removeBtn);

    return pill;
  }

  renderPagination(data) {
    const nav = document.createElement('nav');
    nav.className = 'search-pagination';
    nav.setAttribute('aria-label', 'Paginación');

    const currentPage = data.page;
    const totalPages = data.total_pages;

    // Previous
    if (currentPage > 1) {
      nav.appendChild(this.createPageLink('\u00AB', currentPage - 1));
    } else {
      nav.appendChild(this.createPageSpan('\u00AB', true));
    }

    // Page numbers with ellipsis
    const pages = this.getPageRange(currentPage, totalPages);
    for (const p of pages) {
      if (p === '...') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'pagination-ellipsis';
        ellipsis.textContent = '...';
        nav.appendChild(ellipsis);
      } else if (p === currentPage) {
        nav.appendChild(this.createPageSpan(p, false, true));
      } else {
        nav.appendChild(this.createPageLink(p, p));
      }
    }

    // Next
    if (currentPage < totalPages) {
      nav.appendChild(this.createPageLink('\u00BB', currentPage + 1));
    } else {
      nav.appendChild(this.createPageSpan('\u00BB', true));
    }

    return nav;
  }

  getPageRange(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    pages.push(1);

    if (current > 3) {
      pages.push('...');
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) {
      pages.push('...');
    }

    pages.push(total);

    return pages;
  }

  createPageLink(label, page) {
    const a = document.createElement('a');
    a.className = 'pagination-link';
    a.href = '#';
    a.textContent = label;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      this.handlePageChange(page);
    });
    return a;
  }

  createPageSpan(label, disabled, active) {
    const span = document.createElement('span');
    span.className = 'pagination-link';
    if (disabled) span.classList.add('disabled');
    if (active) span.classList.add('active');
    span.textContent = label;
    return span;
  }

  renderNoResults() {
    const div = document.createElement('div');
    div.className = 'search-no-results';

    const msg = document.createElement('p');
    msg.textContent = 'No se encontraron resultados';
    div.appendChild(msg);

    const hasFilters = this.state.repository.length > 0 ||
      this.state.level.length > 0 ||
      this.state.has_digital ||
      this.state.date_from ||
      this.state.date_to;

    if (hasFilters) {
      const suggestion = document.createElement('p');
      suggestion.className = 'no-results-suggestion';
      suggestion.textContent = 'Intenta limpiar los filtros o modificar la consulta.';
      div.appendChild(suggestion);

      const clearLink = document.createElement('a');
      clearLink.href = '#';
      clearLink.textContent = 'Limpiar filtros';
      clearLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleClearAll();
      });
      div.appendChild(clearLink);
    }

    return div;
  }

  // --- State displays ---

  showLoading() {
    this.container.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'search-loading';
    div.setAttribute('aria-busy', 'true');
    div.textContent = 'Cargando...';
    this.container.appendChild(div);
  }

  showError() {
    this.container.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'search-error';

    const msg = document.createElement('p');
    msg.textContent = 'Ha ocurrido un error';
    div.appendChild(msg);

    const retry = document.createElement('a');
    retry.href = '#';
    retry.textContent = 'Intentar de nuevo';
    retry.addEventListener('click', (e) => {
      e.preventDefault();
      this.search();
    });
    div.appendChild(retry);

    this.container.appendChild(div);
  }

  // --- Event handlers ---

  handleFilterChange(stateKey, value, checked) {
    if (checked) {
      if (!this.state[stateKey].includes(value)) {
        this.state[stateKey].push(value);
      }
    } else {
      this.state[stateKey] = this.state[stateKey].filter(v => v !== value);
    }
    this.state.page = 1;
    this.updateUrl();
    this.search();
  }

  handlePillRemove(stateKey, value) {
    this.state[stateKey] = this.state[stateKey].filter(v => v !== value);
    this.state.page = 1;
    this.updateUrl();
    this.search();
  }

  handleClearAll() {
    this.state.textFilters = [];
    this.state.repository = [];
    this.state.level = [];
    this.state.has_digital = false;
    this.state.date_from = '';
    this.state.date_to = '';
    this.state.page = 1;
    this.updateUrl();
    this.search();
  }

  handleSort(value) {
    this.state.sort = value;
    this.state.page = 1;
    this.updateUrl();
    this.search();
  }

  handlePageChange(page) {
    this.state.page = page;
    this.updateUrl();
    this.search();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Utilities ---

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  truncateHtml(html, maxLength) {
    // Strip tags to measure text length, then truncate the HTML carefully
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || '';

    if (text.length <= maxLength) return html;

    // Walk through the HTML and truncate, preserving <mark> tags
    let charCount = 0;
    let result = '';
    let inTag = false;
    let tagBuffer = '';

    for (let i = 0; i < html.length; i++) {
      const ch = html[i];

      if (ch === '<') {
        inTag = true;
        tagBuffer = '<';
        continue;
      }

      if (inTag) {
        tagBuffer += ch;
        if (ch === '>') {
          inTag = false;
          result += tagBuffer;
          tagBuffer = '';
        }
        continue;
      }

      charCount++;
      result += ch;

      if (charCount >= maxLength) {
        result += '...';
        break;
      }
    }

    // Close any unclosed <mark> tags
    const openMarks = (result.match(/<mark>/gi) || []).length;
    const closeMarks = (result.match(/<\/mark>/gi) || []).length;
    for (let i = 0; i < openMarks - closeMarks; i++) {
      result += '</mark>';
    }

    return result;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('search-page');
  if (container) {
    new SearchPage(container);
  }
});
