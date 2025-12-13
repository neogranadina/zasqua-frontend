const site = require('./site.js');

// Set DEV_MODE=true to limit fetch for faster builds during development
const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_LIMIT = 100; // Number of descriptions to fetch in dev mode

// Fetch all descriptions from API with pagination
async function fetchAllDescriptions() {
  const descriptions = [];
  let url = `${site.apiUrl}/descriptions/?page_size=1000`;
  let page = 0;
  const startTime = Date.now();

  console.log(`[descriptions] Starting fetch from ${site.apiUrl}/descriptions/`);

  while (url) {
    try {
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
      console.log(`[descriptions] Page ${page}: +${pageItems.length} items (${pageTime}s) | Total: ${descriptions.length}/${total} (${pct}%) | Elapsed: ${elapsed}s`);

      // In dev mode, stop after DEV_LIMIT
      if (DEV_MODE && descriptions.length >= DEV_LIMIT) {
        console.log(`[descriptions] DEV_MODE: Stopping at ${descriptions.length} descriptions`);
        break;
      }
    } catch (error) {
      console.error('[descriptions] Error fetching:', error.message);
      break;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[descriptions] Complete: ${descriptions.length} items in ${totalTime}s`);
  return descriptions;
}

module.exports = async function() {
  return await fetchAllDescriptions();
};
