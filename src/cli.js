'use strict';

/**
 * CLI — crawl the 3 target websites and save results to ./output/
 *
 * Usage:
 *   node src/cli.js
 *   node src/cli.js --http-only      # skip browser, use HTTP fallback
 */

const CrawlerService = require('./services/crawlerService');
const logger         = require('./utils/logger');

// ---------------------------------------------------------------------------
// Target list
// ---------------------------------------------------------------------------
const TARGETS = [
  { url: 'https://cmlabs.co',    filename: 'cmlabs_co'    },
  { url: 'https://sequence.day', filename: 'sequence_day' },
  { url: 'https://github.com',   filename: 'github_com'   },  // free-choice site
];

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
async function main() {
  const httpOnly = process.argv.includes('--http-only');

  logger.info('=== Web Crawler CLI ===');
  logger.info(`Mode: ${httpOnly ? 'HTTP only (axios)' : 'Browser (Puppeteer) with HTTP fallback'}`);
  logger.info(`Targets: ${TARGETS.length}`);

  const crawler = new CrawlerService();
  const summary = [];

  for (const target of TARGETS) {
    logger.info(`\n--- Crawling: ${target.url} ---`);
    try {
      const result = await crawler.crawlOne(target.url, {
        filename: target.filename,
        httpOnly,
      });
      summary.push({ ...result, status: 'ok' });
    } catch (err) {
      logger.error(`Failed: ${target.url}`, { err: err.message });
      summary.push({ url: target.url, status: 'error', error: err.message });
    }
  }

  await crawler.shutdown();

  // Print summary table
  console.log('\n\n=== SUMMARY ===');
  console.log('─'.repeat(80));
  console.log(
    'URL'.padEnd(30),
    'Status'.padEnd(10),
    'Method'.padEnd(16),
    'Size'.padEnd(12),
    'Duration'
  );
  console.log('─'.repeat(80));

  for (const r of summary) {
    const size = r.bytes ? `${(r.bytes / 1024).toFixed(1)} KB` : '-';
    const dur  = r.duration ? `${r.duration}ms` : '-';
    console.log(
      r.url.padEnd(30),
      (r.status || '-').padEnd(10),
      (r.method || '-').padEnd(16),
      size.padEnd(12),
      dur
    );
  }

  console.log('─'.repeat(80));
  const ok    = summary.filter(r => r.status === 'ok').length;
  const fail  = summary.filter(r => r.status === 'error').length;
  console.log(`\nDone. ✅ ${ok} succeeded  ❌ ${fail} failed`);

  if (ok > 0) {
    console.log(`\nOutput files saved to: ${require('path').resolve('./output')}\n`);
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  logger.error('Unexpected error', { err: err.message });
  process.exit(1);
});
