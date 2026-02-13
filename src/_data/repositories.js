const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

module.exports = async function() {
  const filePath = path.join(DATA_DIR, 'repositories.json');
  console.log(`[repositories] Reading ${filePath}`);

  const raw = fs.readFileSync(filePath, 'utf8');
  const repos = JSON.parse(raw);

  console.log(`[repositories] Loaded ${repos.length} repositories`);
  return repos;
};
