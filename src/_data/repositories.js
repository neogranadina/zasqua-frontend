const site = require('./site.js');

module.exports = async function() {
  try {
    const response = await fetch(`${site.apiUrl}/repositories/`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    return data.results || data;
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    return [];
  }
};
