const fs = require('fs');
const path = require('path');
const { nodeEnv } = require('../config/env');

// Lightweight, dependency-free structured logger.
//
// Why not just console.log everywhere (as Phases 1-8 did in a few places)?
// - Production logs need a consistent, greppable/parseable shape (JSON
//   lines) so they can be shipped to a log aggregator later.
// - Security-relevant events (login failures, permission denials, admin
//   actions) need to land in their own audit trail, separate from routine
//   request/debug noise, and should never be silently dropped.
//
// This is intentionally simple (no external logging library) so it has no
// new production dependency — swap in winston/pino later without changing
// call sites, since the exported shape (info/warn/error/audit) stays the same.

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const isTest = nodeEnv === 'test';

function ensureLogDir() {
  if (isTest) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // Non-fatal: if the filesystem is read-only (e.g. some container
    // setups), fall back to console-only logging rather than crashing.
  }
}
ensureLogDir();

function write(fileName, entry) {
  if (isTest) return;
  const line = JSON.stringify(entry) + '\n';
  try {
    fs.appendFileSync(path.join(LOG_DIR, fileName), line);
  } catch {
    // Swallow filesystem errors — logging must never take the app down.
  }
}

function baseEntry(level, message, meta) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && Object.keys(meta).length ? { meta } : {}),
  };
}

const logger = {
  info(message, meta) {
    const entry = baseEntry('info', message, meta);
    if (nodeEnv !== 'production' && !isTest) console.log(`[info] ${message}`, meta || '');
    write('app.log', entry);
  },
  warn(message, meta) {
    const entry = baseEntry('warn', message, meta);
    if (!isTest) console.warn(`[warn] ${message}`, meta || '');
    write('app.log', entry);
  },
  error(message, meta) {
    const entry = baseEntry('error', message, meta);
    if (!isTest) console.error(`[error] ${message}`, meta || '');
    write('error.log', entry);
  },
  // Security/compliance-relevant events: authentication, authorization
  // denials, and admin actions on users/permissions/roles. Kept in a
  // dedicated file so it can be retained/reviewed independently of general
  // application logs.
  audit(event, meta) {
    const entry = baseEntry('audit', event, meta);
    write('audit.log', entry);
  },
};

module.exports = logger;
