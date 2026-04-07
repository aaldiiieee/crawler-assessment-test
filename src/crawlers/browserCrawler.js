'use strict';

/**
 * BrowserCrawler — uses Puppeteer (headless Chrome) to fully render
 * JavaScript-heavy pages: SPA (React/Vue/Angular), PWA, SSR with hydration.
 *
 * This is the PRIMARY crawler. HTTP fallback is only used when this fails
 * or when Puppeteer is not available.
 */

const puppeteer = require('puppeteer-core');
const config    = require('../config');
const logger    = require('../utils/logger');

class BrowserCrawler {
  constructor() {
    this.browser = null;
  }

  /** Launch a shared browser instance (reused across crawls). */
  async launch() {
    if (this.browser) return;
    logger.info('Launching headless browser...');
    this.browser = await puppeteer.launch({
      executablePath: config.browser.executablePath,
      headless:       config.browser.headless,
      args:           config.browser.args,
    });
    logger.info('Browser ready');
  }

  /** Close the browser when all crawls are done. */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  /**
   * Crawl a single URL and return the fully-rendered HTML.
   * @param {string} url
   * @returns {Promise<string>} rendered HTML
   */
  async crawl(url) {
    await this.launch();

    const page = await this.browser.newPage();

    try {
      // Set a realistic viewport
      await page.setViewport({ width: 1280, height: 800 });

      // Set user-agent so sites don't block headless Chrome
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      logger.info(`Navigating to ${url}`);

      await page.goto(url, {
        waitUntil: config.waitUntil,   // 'networkidle2' handles SPA hydration
        timeout:   config.pageTimeout,
      });

      // Extra wait for lazy-loaded content / animations
      await page.waitForTimeout(1500);

      const html = await page.content();

      logger.info(`Crawled ${url}`, { bytes: html.length });
      return html;

    } finally {
      await page.close();
    }
  }
}

module.exports = BrowserCrawler;
