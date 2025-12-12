const site = require('./site.js');

// Set DEV_MODE=true to limit fetch for faster builds during development
const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_LIMIT = 100; // Number of entities to fetch in dev mode

// Fetch all entities from API with pagination
async function fetchAllEntities() {
  const entities = [];
  let url = `${site.apiUrl}/entities/?page_size=1000`;

  while (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      entities.push(...(data.results || []));
      url = data.next;

      if (entities.length % 10000 === 0) {
        console.log(`Fetched ${entities.length} entities...`);
      }

      // In dev mode, stop after DEV_LIMIT
      if (DEV_MODE && entities.length >= DEV_LIMIT) {
        console.log(`DEV_MODE: Stopping at ${entities.length} entities`);
        break;
      }
    } catch (error) {
      console.error('Error fetching entities:', error.message);
      break;
    }
  }

  console.log(`Total entities fetched: ${entities.length}`);
  return entities;
}

module.exports = async function() {
  return await fetchAllEntities();
};
