// reggi-emaillog.js — SES delivery log reader, hosted inside Reggi.
// Author: senath gen-11 — 2026-07-22
//
// Mount (prosser, one line each):
//   const emaillog = require('D:/clients/senath/monkey/reggi-emaillog.js');
//   app.use('/emaillog', emaillog);
//
// Or, if you would rather not mount a router at all, just take the data:
//   const { getMessages, getDatasets } = require('D:/clients/senath/monkey/reggi-emaillog.js');
// George's instruction was that I extract and you "simply include the data",
// so both doors are open — the router is a convenience, not a requirement.
//
// *** THIS PROCESS MAKES NO AWS CALL. EVER. ***
// extract-email-log.js (separate process, scheduled) does all the CloudWatch
// work and leaves JSON on disk. This module only reads files. Consequences for
// prosser's conditions:
//   #9  query timeout — N/A. There is no query. Nothing here can block on AWS.
//   Landmine — N/A. aws-sdk is never required here, so the global AWS.config
//   that points at DynamoDB is never read and never touched. Your 28
//   entity/authority endpoints cannot be affected by this file.
//
// CONTRACT (ticonderoga's 8, plus prosser's 3 for this case):
//   - Crash-isolated: every handler runs through safe(); router-level error
//     middleware backstops. An email-log bug must never take down Reggi.
//   - Router-scoped middleware only. Nothing global.
//   - Data lives in D:\clients\senath\data\ (NOT Reggi's repo). If the dir is
//     missing, routes answer 503 instead of crashing.
//   - Shared-secret header enforced on EVERY route including health, checked
//     BEFORE any file work, 401 first. (#10)
//   - Path prefix /emaillog only; no other top-level paths. (#11)
//   - No timers, no sockets, no handles to close — nothing to leak on restart.
//
// SCOPE: only emails sent by sendEmail.js (the path senath owns) appear here.
// Legacy senders don't stamp SES tags and are deliberately excluded (George,
// 2026-07-22). The excluded count is carried in the data so the gap is visible.

'use strict';

// This file lives outside the host repo, so express resolves from the HOST's
// node_modules (require.main), not this file's directory.
function hostRequire(name) {
  try { return require(name); }
  catch (e) {
    if (require.main) return require.main.require(name);
    throw e;
  }
}

var fs = require('fs');
var path = require('path');

var DATA = process.env.SENATH_DATA_DIR || 'D:\\clients\\senath\\data\\emaillog';
var SECRET = process.env.SENATH_EMAILLOG_SECRET || '';
var MAX_LIMIT = 500;

// ------------------------------------------------------------- data access
// Small mtime-keyed cache. The files are rewritten atomically by the extractor
// (write .tmp then rename), so a reader never sees a partial file.
var cache = {};

function readDatasetFile(dataset) {
  var file = path.join(DATA, String(dataset).toUpperCase() + '.json');
  var st;
  try { st = fs.statSync(file); } catch (e) { return null; }
  var hit = cache[file];
  if (hit && hit.mtime === st.mtimeMs) return hit.data;
  var data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; }
  cache[file] = { mtime: st.mtimeMs, data: data };
  return data;
}

function getDatasets() {
  try {
    var idx = JSON.parse(fs.readFileSync(path.join(DATA, '_index.json'), 'utf8'));
    return idx;
  } catch (e) { return null; }
}

// The one function that matters. Filter by dataset -> the staff view.
// Filter by dataset + company -> what a portal customer may see of their own
// mail. Same data, one more predicate. That is the whole design.
function getMessages(opts) {
  opts = opts || {};
  if (!opts.dataset) return { error: 'dataset required' };
  var file = readDatasetFile(opts.dataset);
  if (!file) return { error: 'no data for dataset ' + opts.dataset };

  var msgs = file.messages || [];

  // Company scoping. For a portal customer this is NOT optional — it is the
  // isolation boundary. Caller must pass it; this module will not infer it.
  if (opts.company) {
    var co = String(opts.company).toUpperCase();
    msgs = msgs.filter(function (m) { return m.company === co; });
  }
  if (opts.load) {
    var ld = String(opts.load);
    msgs = msgs.filter(function (m) { return String(m.load) === ld; });
  }
  if (opts.status) {
    msgs = msgs.filter(function (m) { return m.status === opts.status; });
  }
  if (opts.q) {
    var q = String(opts.q).toLowerCase();
    msgs = msgs.filter(function (m) {
      return [m.to, m.subject, m.messageId, m.load, m.company, m.doc]
        .join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }
  if (opts.days) {
    var cutoff = new Date(Date.now() - parseInt(opts.days, 10) * 86400000).toISOString();
    msgs = msgs.filter(function (m) { return (m.time || '') >= cutoff; });
  }

  var total = msgs.length;
  var limit = Math.min(parseInt(opts.limit, 10) || 200, MAX_LIMIT);
  return {
    dataset: file.dataset,
    generatedAt: file.generatedAt,
    windowStart: file.windowStart,
    coverage: file.coverage,
    total: total,
    returned: Math.min(total, limit),
    messages: msgs.slice(0, limit)
  };
}

// ------------------------------------------------------------------ router

// Built lazily and defensively. George's instruction was that I extract and
// prosser "simply includes the data" — so the DATA functions above must work
// with no express present at all. If express can't resolve, this module still
// exports getMessages/getDatasets rather than throwing on require.
function buildRouter() {
var express = hostRequire('express');
var router = express.Router();

// #10 — secret first, before any file work, on every route including health.
router.use(function (req, res, next) {
  if (!SECRET) {
    return res.status(503).json({
      error: 'email log not configured: SENATH_EMAILLOG_SECRET is unset'
    });
  }
  var given = req.get('x-senath-key') || '';
  if (given !== SECRET) return res.status(401).json({ error: 'unauthorized' });
  next();
});

// Data dir missing -> 503, never a crash (ticonderoga's rule).
router.use(function (req, res, next) {
  if (!fs.existsSync(DATA)) {
    return res.status(503).json({
      error: 'email log data dir missing: ' + DATA +
             ' (run extract-email-log.js, then retry)'
    });
  }
  next();
});

function safe(fn) {
  return function (req, res, next) {
    try { fn(req, res, next); }
    catch (e) { next(e); }
  };
}

router.get('/health', safe(function (req, res) {
  var idx = getDatasets();
  res.json({
    ok: !!idx,
    generatedAt: idx && idx.generatedAt,
    windowStart: idx && idx.windowStart,
    datasets: (idx && idx.datasets) || [],
    coverage: idx && idx.coverage
  });
}));

router.get('/:dataset', safe(function (req, res) {
  var out = getMessages({
    dataset: req.params.dataset,
    company: req.query.company,
    load: req.query.load,
    status: req.query.status,
    q: req.query.q,
    days: req.query.days,
    limit: req.query.limit
  });
  if (out.error) return res.status(404).json(out);
  res.json(out);
}));

// Router-level backstop. Nothing from this file reaches prosser's handler.
router.use(function (err, req, res, next) {
  console.error('[emaillog] handler error (contained):', err && err.message);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'email log internal error' });
});

return router;
}

var router = null;
try {
  router = buildRouter();
} catch (e) {
  // Data-only mode. Mounting is impossible, reading is not.
  console.error('[emaillog] express unavailable, router disabled (data API still works):',
                e && e.message);
}

module.exports = router || {};
module.exports.getMessages = getMessages;
module.exports.getDatasets = getDatasets;
module.exports.routerAvailable = !!router;
