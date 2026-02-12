/**
 * Generate static JSON files for tree navigation.
 *
 * For each description that has children, writes a JSON file at
 * _site/data/children/{id}.json containing the children sorted
 * by reference_code. This replaces the runtime API call in tree.js.
 *
 * Usage: node scripts/generate-tree-json.js
 * Expects the Django API to be running (API_URL env var or default).
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:8000/api/v1';
const OUTPUT_DIR = path.join(__dirname, '..', '_site', 'data', 'children');

async function fetchAllDescriptions() {
  const descriptions = [];
  let url = `${API_URL}/descriptions/?page_size=1000`;
  let page = 0;
  const startTime = Date.now();

  console.log(`[tree-json] Fetching descriptions from ${API_URL}/descriptions/`);

  while (url) {
    page++;
    const pageStart = Date.now();
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    const pageItems = data.results || [];
    descriptions.push(...pageItems);
    url = data.next;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pageTime = ((Date.now() - pageStart) / 1000).toFixed(1);
    const total = data.count || '?';
    const pct = data.count ? ((descriptions.length / data.count) * 100).toFixed(1) : '?';
    console.log(`[tree-json] Page ${page}: +${pageItems.length} (${pageTime}s) | ${descriptions.length}/${total} (${pct}%) | ${elapsed}s`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[tree-json] Fetched ${descriptions.length} descriptions in ${totalTime}s`);
  return descriptions;
}

function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength) + '...';
}

function generateTreeJson(descriptions) {
  // Group children by parent_id
  const childrenByParent = new Map();
  for (const desc of descriptions) {
    if (desc.parent_id) {
      if (!childrenByParent.has(desc.parent_id)) {
        childrenByParent.set(desc.parent_id, []);
      }
      childrenByParent.get(desc.parent_id).push(desc);
    }
  }

  console.log(`[tree-json] Found ${childrenByParent.size} parents with children`);

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let filesWritten = 0;
  let totalSize = 0;

  for (const [parentId, children] of childrenByParent) {
    // Sort by reference_code
    children.sort((a, b) => (a.reference_code || '').localeCompare(b.reference_code || ''));

    // Build minimal child records (only fields tree.js needs)
    const results = children.map(child => ({
      id: child.id,
      reference_code: child.reference_code,
      title: child.title,
      description_level: child.description_level,
      date_expression: child.date_expression || '',
      scope_content: truncate(child.scope_content, 150),
      child_count: child.child_count || 0,
      children_level: child.children_level || null,
      has_digital: child.has_digital || false
    }));

    const output = { count: results.length, results };
    const json = JSON.stringify(output);
    const filePath = path.join(OUTPUT_DIR, `${parentId}.json`);

    fs.writeFileSync(filePath, json);
    filesWritten++;
    totalSize += json.length;
  }

  console.log(`[tree-json] Wrote ${filesWritten} JSON files`);
  console.log(`[tree-json] Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  const startTime = Date.now();

  const descriptions = await fetchAllDescriptions();
  generateTreeJson(descriptions);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[tree-json] Done in ${totalTime}s`);
}

main().catch(err => {
  console.error('[tree-json] Fatal error:', err);
  process.exit(1);
});
