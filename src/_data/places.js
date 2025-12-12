const site = require('./site.js');

module.exports = async function() {
  try {
    const response = await fetch(`${site.apiUrl}/places/?page_size=1000`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Total places fetched: ${(data.results || data).length}`);
    return data.results || data;
  } catch (error) {
    console.error('Error fetching places:', error.message);
    return [];
  }
};
