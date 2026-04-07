'use strict';

/**
 * HttpCrawler — lightweight fallback using axios + cheerio.
 *
 * Works well for:
 *   - Pure SSR pages (server renders full HTML before sending)
 *   - Static HTML sites
 *
 * Does NOT execute JavaScript, so SPA/PWA content will be incomplete.
 * Use BrowserCrawler for JS-rendered sites.
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const config  = require('../config');
const logger  = require('../utils/logger');

class HttpCrawler {
  /**
   * Crawl a URL via HTTP GET and return the raw HTML.
   * @param {string} url
   * @returns {Promise<string>} raw HTML
   */
  async crawl(url) {
    logger.info(`[HTTP] Fetching ${url}`);

    const response = await axios.get(url, {
      headers:      config.http.headers,
      timeout:      config.http.timeout,
      maxRedirects: config.http.maxRedirects,
      // Decompress gzip/br automatically
      decompress: true,
    });

    const html = response.data;
    logger.info(`[HTTP] Fetched ${url}`, { bytes: html.length, status: response.status });

    return html;
  }

  /**
   * Parse HTML and extract basic metadata (title, description, links).
   * Useful for quick inspection without a full browser.
   * @param {string} html
   */
  static extractMeta(html) {
    const $ = cheerio.load(html);
    return {
      title:       $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      links:       $('a[href]').map((_, el) => $(el).attr('href')).get().slice(0, 20),
    };
  }
}

module.exports = HttpCrawler;
