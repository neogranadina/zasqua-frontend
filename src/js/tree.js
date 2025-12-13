/**
 * Miller Columns Tree Navigation
 *
 * Displays hierarchical data in columns where clicking an item
 * reveals its children in the next column.
 */

class MillerColumnsTree {
  constructor(container, options = {}) {
    this.container = container;
    this.apiUrl = options.apiUrl || 'http://localhost:8000/api/v1';
    this.repoCode = options.repoCode || '';
    this.levelLabels = options.levelLabels || {};
    this.columns = [];
    this.cache = new Map(); // Cache fetched children

    this.init();
  }

  init() {
    this.container.classList.add('miller-columns');
    this.container.innerHTML = '<div class="miller-columns-wrapper"></div>';
    this.wrapper = this.container.querySelector('.miller-columns-wrapper');
  }

  /**
   * Load initial data (root items)
   */
  async loadRoot(rootDescriptions) {
    this.clearColumns();
    const column = this.createColumn(rootDescriptions, 0, 'Contenido');
    this.wrapper.appendChild(column);
    this.columns.push(column);
  }

  /**
   * Create a column with items
   */
  createColumn(items, depth, title = '') {
    const column = document.createElement('div');
    column.className = 'miller-column';
    column.dataset.depth = depth;

    if (title) {
      const header = document.createElement('div');
      header.className = 'miller-column-header';
      header.textContent = title;
      column.appendChild(header);
    }

    const list = document.createElement('ul');
    list.className = 'miller-column-list';

    for (const item of items) {
      const li = document.createElement('li');
      li.className = 'miller-item';
      li.dataset.id = item.id;
      li.dataset.refCode = item.reference_code;
      li.dataset.hasChildren = item.child_count > 0;

      // Item content
      const content = document.createElement('div');
      content.className = 'miller-item-content';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'miller-item-title';
      titleSpan.textContent = item.title;
      content.appendChild(titleSpan);

      // Show child count if has children
      if (item.child_count > 0) {
        const countSpan = document.createElement('span');
        countSpan.className = 'miller-item-count';
        const levelLabel = this.levelLabels[item.children_level] || 'items';
        countSpan.textContent = `(${item.child_count.toLocaleString('es-ES')} ${levelLabel})`;
        content.appendChild(countSpan);
      }

      li.appendChild(content);

      // Arrow indicator for items with children
      if (item.child_count > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'miller-item-arrow';
        arrow.textContent = '›';
        li.appendChild(arrow);
      }

      // Click handler
      li.addEventListener('click', () => this.handleItemClick(li, item, depth));

      list.appendChild(li);
    }

    column.appendChild(list);
    return column;
  }

  /**
   * Handle clicking on an item
   */
  async handleItemClick(element, item, depth) {
    // Remove selection from siblings
    const column = element.closest('.miller-column');
    column.querySelectorAll('.miller-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Remove columns to the right
    this.removeColumnsAfter(depth);

    // If item has children, load them
    if (item.child_count > 0) {
      element.classList.add('loading');

      try {
        const children = await this.fetchChildren(item.id);
        const newColumn = this.createColumn(children, depth + 1, item.title);
        this.wrapper.appendChild(newColumn);
        this.columns.push(newColumn);

        // Scroll to show new column
        this.scrollToColumn(newColumn);
      } catch (error) {
        console.error('Error fetching children:', error);
      } finally {
        element.classList.remove('loading');
      }
    } else {
      // Leaf node - navigate to the item page
      const url = `/${this.repoCode}/${item.reference_code}/`;
      window.location.href = url;
    }
  }

  /**
   * Fetch children from API
   */
  async fetchChildren(parentId) {
    // Check cache first
    if (this.cache.has(parentId)) {
      return this.cache.get(parentId);
    }

    const response = await fetch(`${this.apiUrl}/descriptions/${parentId}/children/`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const children = data.results || data;

    // Cache the result
    this.cache.set(parentId, children);

    return children;
  }

  /**
   * Remove all columns after a given depth
   */
  removeColumnsAfter(depth) {
    while (this.columns.length > depth + 1) {
      const column = this.columns.pop();
      column.remove();
    }
  }

  /**
   * Clear all columns
   */
  clearColumns() {
    this.columns = [];
    this.wrapper.innerHTML = '';
  }

  /**
   * Scroll to show a column
   */
  scrollToColumn(column) {
    setTimeout(() => {
      column.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
    }, 100);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const treeContainer = document.getElementById('collection-tree');
  if (treeContainer) {
    const repoCode = treeContainer.dataset.repoCode;
    const apiUrl = treeContainer.dataset.apiUrl || 'http://localhost:8000/api/v1';

    // Get level labels from data attribute (JSON)
    let levelLabels = {};
    try {
      levelLabels = JSON.parse(treeContainer.dataset.levelLabels || '{}');
    } catch (e) {
      console.warn('Could not parse level labels');
    }

    const tree = new MillerColumnsTree(treeContainer, {
      apiUrl,
      repoCode,
      levelLabels
    });

    // Load root data from embedded JSON
    const rootDataEl = document.getElementById('root-descriptions-data');
    if (rootDataEl) {
      try {
        const rootData = JSON.parse(rootDataEl.textContent);
        tree.loadRoot(rootData);
      } catch (e) {
        console.error('Could not parse root descriptions:', e);
      }
    }
  }
});
