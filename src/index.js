'use strict';

/**
 * Web Crawler — Express REST API
 *
 * Endpoints:
 *   POST /crawl        — crawl a single URL
 *   POST /crawl/batch  — crawl multiple URLs (sequential)
 *   GET  /health       — health check
 */

const express        = require('express');
const CrawlerService = require('./services/crawlerService');
const logger         = require('./utils/logger');

const app     = express();
const crawler = new CrawlerService();
const PORT    = process.env.PORT || 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// POST /crawl
// Body: { "url": "https://example.com", "filename": "optional_name", "httpOnly": false }
// ---------------------------------------------------------------------------
app.post('/crawl', async (req, res) => {
  const { url, filename, httpOnly = false } = req.body;

  if (!url) {
    return res.status(400).json({ error: '"url" is required' });
  }

  try {
    const result = await crawler.crawlOne(url, { filename, httpOnly });
    return res.json({ status: 'ok', ...result });
  } catch (err) {
    logger.error('Crawl failed', { url, err: err.message });
    return res.status(500).json({ status: 'error', url, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /crawl/batch
// Body: { "targets": [{ "url": "...", "filename": "..." }], "parallel": false }
// ---------------------------------------------------------------------------
app.post('/crawl/batch', async (req, res) => {
  const { targets, parallel = false } = req.body;

  if (!Array.isArray(targets) || targets.length === 0) {
    return res.status(400).json({ error: '"targets" must be a non-empty array' });
  }

  try {
    const results = parallel
      ? await crawler.crawlBatchParallel(targets)
      : await crawler.crawlBatch(targets);

    return res.json({ status: 'ok', total: results.length, results });
  } catch (err) {
    logger.error('Batch crawl failed', { err: err.message });
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
  logger.info(`🕷️  Web Crawler API running on http://localhost:${PORT}`);
  logger.info('Endpoints:');
  logger.info('  POST /crawl          — crawl single URL');
  logger.info('  POST /crawl/batch    — crawl multiple URLs');
  logger.info('  GET  /health         — health check');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  await crawler.shutdown();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await crawler.shutdown();
  server.close(() => process.exit(0));
});

module.exports = { app, crawler };
