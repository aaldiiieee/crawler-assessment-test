'use strict';

const LEVELS = { info: '✅', warn: '⚠️ ', error: '❌', debug: '🔍' };

function log(level, message, meta = '') {
  const icon = LEVELS[level] || 'ℹ️';
  const ts = new Date().toISOString();
  const extra = meta ? ` | ${JSON.stringify(meta)}` : '';
  console.log(`[${ts}] ${icon}  ${message}${extra}`);
}

const logger = {
  info:  (msg, meta) => log('info', msg, meta),
  warn:  (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

module.exports = logger;
