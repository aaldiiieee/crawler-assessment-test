"use strict";

// Set this to your local Chrome/Chromium path
// Mac      : /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
// Linux    : /usr/bin/google-chrome  or  /usr/bin/chromium-browser
// Windows  : C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe
const CHROME_PATH = "/usr/bin/google-chrome";

const config = {
  // Browser settings for Puppeteer
  browser: {
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800",
    ],
  },

  // HTTP fallback (axios) settings — used when Puppeteer is skipped
  http: {
    timeout: 20000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    },
    maxRedirects: 5,
  },

  // Output settings
  output: {
    dir: process.env.OUTPUT_DIR || "./output",
  },

  // Page wait strategy when using Puppeteer
  // 'networkidle0' = wait until no network activity (good for SPA)
  // 'networkidle2' = wait until ≤2 connections (balanced)
  // 'domcontentloaded' = fast, suitable for SSR
  waitUntil: "networkidle2",

  // Max ms to wait for a page to load
  pageTimeout: 30000,
};

module.exports = config;
