const fs = require('fs');
const path = require('path');

const DEV_MODE = process.env.DEV_MODE === 'true';
const DEV_LIMIT = 100;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');

module.exports = async function() {
  const filePath = path.join(DATA_DIR, 'descriptions.json');
  console.log(`[descriptions] Reading ${filePath}`);

  const raw = fs.readFileSync(filePath, 'utf8');
  const descriptions = JSON.parse(raw);

  if (DEV_MODE && descriptions.length > DEV_LIMIT) {
    console.log(`[descriptions] DEV_MODE: Limiting to ${DEV_LIMIT} of ${descriptions.length}`);
    return descriptions.slice(0, DEV_LIMIT);
  }

  console.log(`[descriptions] Loaded ${descriptions.length} descriptions`);
  return descriptions;
};
