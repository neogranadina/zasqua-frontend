const site = require('./site.js');

// Set DEV_MODE=true to limit fetch for faster builds during development
const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_LIMIT = 100; // Number of descriptions to fetch in dev mode

// Fetch all descriptions from API with pagination
async function fetchAllDescriptions() {
  const descriptions = [];
  let url = `${site.apiUrl}/descriptions/?page_size=1000`;

  while (url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      descriptions.push(...(data.results || []));
      url = data.next;

      if (descriptions.length % 10000 === 0) {
        console.log(`Fetched ${descriptions.length} descriptions...`);
      }

      // In dev mode, stop after DEV_LIMIT
      if (DEV_MODE && descriptions.length >= DEV_LIMIT) {
        console.log(`DEV_MODE: Stopping at ${descriptions.length} descriptions`);
        break;
      }
    } catch (error) {
      console.error('Error fetching descriptions:', error.message);
      break;
    }
  }

  console.log(`Total descriptions fetched: ${descriptions.length}`);
  return descriptions;
}

module.exports = async function() {
  return await fetchAllDescriptions();
};
