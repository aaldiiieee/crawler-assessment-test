"use strict";

/**
 * CrawlerService — orchestrates the crawl pipeline:
 *   1. Try BrowserCrawler (Puppeteer) — handles SPA, PWA, SSR
 *   2. Fall back to HttpCrawler (axios) if browser not available
 *   3. Save result as HTML file via FileHelper
 */

const path = require("path");
const BrowserCrawler = require("../crawlers/browserCrawler");
const HttpCrawler = require("../crawlers/httpCrawler");
const { saveFile, urlToFilename } = require("../utils/fileHelper");
const logger = require("../utils/logger");
const config = require("../config");

class CrawlerService {
  constructor() {
    this.browserCrawler = new BrowserCrawler();
    this.httpCrawler = new HttpCrawler();
  }

  /**
   * Crawl a single URL and save the output HTML.
   *
   * @param {string} url        - target URL
   * @param {object} [options]
   * @param {string} [options.filename]   - override output filename (without .html)
   * @param {boolean} [options.httpOnly]  - skip browser, use HTTP only
   * @returns {Promise<{url, outputPath, bytes, method, duration}>}
   */
  async crawlOne(url, options = {}) {
    const start = Date.now();
    const filename = options.filename || urlToFilename(url);
    const outPath = path.resolve(config.output.dir, `${filename}.html`);
    let html, method;

    if (options.httpOnly) {
      // Force HTTP mode (e.g. for known SSR-only sites)
      html = await this.httpCrawler.crawl(url);
      method = "http";
    } else {
      try {
        html = await this.browserCrawler.crawl(url);
        method = "browser";
      } catch (err) {
        logger.warn(`Browser crawl failed for ${url}, falling back to HTTP`, {
          err: err.message,
        });
        html = await this.httpCrawler.crawl(url);
        method = "http-fallback";
      }
    }

    // Inject a small banner so it's clear when the file was crawled
    const annotated = this._annotate(html, url, method);
    saveFile(outPath, annotated);

    const result = {
      url,
      outputPath: outPath,
      bytes: annotated.length,
      method,
      duration: Date.now() - start,
    };

    logger.info(`Saved: ${outPath}`, {
      bytes: result.bytes,
      method,
      ms: result.duration,
    });
    return result;
  }

  /**
   * Crawl multiple URLs in sequence (or parallel — see batchParallel).
   * @param {Array<{url: string, filename?: string}>} targets
   * @returns {Promise<Array>}
   */
  async crawlBatch(targets) {
    const results = [];
    for (const target of targets) {
      try {
        const res = await this.crawlOne(target.url, {
          filename: target.filename,
        });
        results.push({ ...res, status: "ok" });
      } catch (err) {
        logger.error(`Failed to crawl ${target.url}`, { err: err.message });
        results.push({ url: target.url, status: "error", error: err.message });
      }
    }
    return results;
  }

  /**
   * Crawl multiple URLs in parallel (faster but more resource-intensive).
   * Limit concurrency to avoid overloading the browser.
   * @param {Array<{url: string, filename?: string}>} targets
   * @param {number} [concurrency=2]
   */
  async crawlBatchParallel(targets, concurrency = 2) {
    const results = [];
    for (let i = 0; i < targets.length; i += concurrency) {
      const chunk = targets.slice(i, i + concurrency);
      const settled = await Promise.allSettled(
        chunk.map((t) => this.crawlOne(t.url, { filename: t.filename })),
      );
      for (const s of settled) {
        if (s.status === "fulfilled") {
          results.push({ ...s.value, status: "ok" });
        } else {
          results.push({ status: "error", error: s.reason.message });
        }
      }
    }
    return results;
  }

  /** Cleanly close the browser when done. */
  async shutdown() {
    await this.browserCrawler.close();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Inject a small metadata comment + visible banner into the crawled HTML.
   */
  _annotate(html, url, method) {
    const timestamp = new Date().toISOString();
    const comment = `<!-- Crawled by web-crawler | URL: ${url} | Method: ${method} | At: ${timestamp} -->`;

    const banner = `
      <style>
        #__crawler-banner {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
          background: #1a1a2e; color: #e2e8f0; font-family: monospace;
          font-size: 12px; padding: 6px 12px;
          display: flex; gap: 16px; align-items: center;
          border-top: 2px solid #4f46e5;
        }
        #__crawler-banner span { opacity: 0.7; }
        #__crawler-banner b   { color: #818cf8; }
      </style>
      <div id="__crawler-banner">
        🕷️ <b>Crawled</b>
        <span>URL: <b>${url}</b></span>
        <span>Method: <b>${method}</b></span>
        <span>Time: <b>${timestamp}</b></span>
      </div>
    `;

    // Insert comment at the very top
    let out = `${comment}\n${html}`;

    // Inject banner before </body> — if no </body>, append at end
    if (out.includes("</body>")) {
      out = out.replace("</body>", `${banner}\n</body>`);
    } else {
      out += banner;
    }

    return out;
  }
}

module.exports = CrawlerService;
