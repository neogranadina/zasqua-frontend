const site = require('./site.js');

module.exports = async function() {
  try {
    // First fetch the list of repositories
    const listResponse = await fetch(`${site.apiUrl}/repositories/`);
    if (!listResponse.ok) {
      throw new Error(`API error: ${listResponse.status}`);
    }
    const listData = await listResponse.json();
    const repos = listData.results || listData;

    // Then fetch detail for each repository (includes root_descriptions)
    const detailedRepos = await Promise.all(
      repos.map(async (repo) => {
        try {
          const detailResponse = await fetch(`${site.apiUrl}/repositories/${repo.id}/`);
          if (detailResponse.ok) {
            return await detailResponse.json();
          }
          return repo; // Fall back to list data if detail fails
        } catch (err) {
          console.warn(`Failed to fetch detail for ${repo.code}:`, err.message);
          return repo;
        }
      })
    );

    console.log(`Fetched ${detailedRepos.length} repositories with root_descriptions`);
    return detailedRepos;
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    return [];
  }
};
