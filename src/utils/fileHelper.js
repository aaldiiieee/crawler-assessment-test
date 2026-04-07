'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Save content to a file, creating parent directories if needed.
 * @param {string} filePath  - absolute or relative path
 * @param {string} content   - file content
 */
function saveFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Convert a URL to a safe file name.
 * e.g. https://cmlabs.co  →  cmlabs_co
 */
function urlToFilename(url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

module.exports = { saveFile, urlToFilename };
