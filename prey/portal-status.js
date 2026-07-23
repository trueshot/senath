#!/usr/bin/env node
// portal-status.js — LIVE per-company portal status for the operator console.
// No snapshot. Two ground-truth sources, merged into a tri-state.
//
// George's ask (2026-07-22): folder-scan approved; show documents-waiting and
// active-portal as DISTINCT states; portland wires portal-manager.html to it.
//
// THE TWO SOURCES (each is ground truth for a different fact):
//   1. canopylake outgoing/{CO}/   -> DOCUMENTS: are there docs to be seen?
//        docCount + newest, both from the readdir + the date-prefixed filename
//        (portland's {date}_{who}_{ext}_{stem} convention) — ZERO file stats.
//   2. jrec:perportal:{DATASET}:*  -> MEMBERS: is any registered person bound
//        and able to SEE them? A perportal record exists only for a registered
//        person; each active scope_{CO} payload is one binding. Revoked scopes
//        (status:'revoked', per libertyville domain-grants) do NOT count.
//
// THE STATE (mutually exclusive, per company):
//   none              no folder, no bound member         (nothing here)
//   documents-waiting folder w/ docs, ZERO bound members (docs nobody can see —
//                                                          the actionable gap:
//                                                          invite someone)
//   active            folder w/ docs AND >=1 bound member (working portal)
//   bound-no-docs     bound member but NO folder          (anomaly — surfaced,
//                                                          never hidden)
// documents-waiting is the finding the operator can act on; a company with 50
// docs and nobody bound looks identical to an empty company unless we say so.
//
// WHERE THIS RUNS: on the prey, inside detroit's TrueAPI operator leg, where
// BOTH sources are local (canopylake is the prey filesystem; ElastiCache is the
// same db-8 sendEmail.js already writes). NOT Monkey (canopylake isn't local
// there) and — per George, permanent — the AWS email-log rule is a SEPARATE
// route; this one is local reads and legitimately belongs on the prey.
//
// CASE TRAP: the perportal key and the SES tags both store the dataset
// UPPERCASE (WILLIS). Company codes are uppercase in both the folder name and
// the scope_ suffix. Normalize both sides or the merge silently drops rows.
//
// Author: senath gen-11 — 2026-07-22

'use strict';

var fs = require('fs');

function opt(name, def) {
  var i = process.argv.indexOf(name);
  return (i !== -1 && process.argv[i + 1]) ? process.argv[i + 1] : def;
}

var DATASET  = (opt('--dataset', process.env.PORTAL_DATASET || 'WILLIS')).toUpperCase();
// canopylake outgoing dir. Prey: from portal-config.json. Georg test: bridge.
var OUTGOING = opt('--outgoing', process.env.PORTAL_OUTGOING ||
  '//15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing');
// Redis. Prey: ElastiCache :6379. Georg test: SSH tunnel 127.0.0.1:16379.
var REDIS_HOST = process.env.PORTAL_REDIS_HOST || '127.0.0.1';
var REDIS_PORT = parseInt(process.env.PORTAL_REDIS_PORT || '16379', 10);
var REDIS_DB   = parseInt(process.env.PORTAL_REDIS_DB || '8', 10);
// ioredis resolves from libertyville's tree for georg testing; on the prey the
// mounting host (detroit TrueAPI) provides it.
var Redis = require(process.env.PORTAL_IOREDIS ||
  'c:/clients/libertyville/node_modules/ioredis');

// --- source 1: folders ------------------------------------------------------
// One readdir of the parent (company list), one readdir per company (files).
// newest = lexical max of the date-prefixed filenames — dates sort as strings.
function scanFolders() {
  var byCo = {};
  var companies;
  try { companies = fs.readdirSync(OUTGOING); }
  catch (e) { throw new Error('cannot read outgoing dir ' + OUTGOING + ': ' + e.message); }
  companies.forEach(function (co) {
    var dir = OUTGOING + '/' + co;
    var files;
    try { files = fs.readdirSync(dir); } catch (e) { return; }   // not a dir / gone
    var pdfs = files.filter(function (f) { return /\.pdf$/i.test(f); });
    if (!pdfs.length) return;                                     // empty folder = no docs
    var newest = '';
    pdfs.forEach(function (f) {
      var m = /^(\d{8})_/.exec(f);        // leading YYYYMMDD from the apron convention
      if (m && m[1] > newest) newest = m[1];
    });
    byCo[co.toUpperCase()] = {
      docCount: pdfs.length,
      newest: newest ? (newest.slice(0, 4) + '-' + newest.slice(4, 6) + '-' + newest.slice(6, 8)) : null
    };
  });
  return byCo;
}

// --- source 2: perportal members -------------------------------------------
// SCAN (not KEYS — never block Redis) the per-person records; invert their
// active scope_{CO} bindings into a per-company member count.
function scanMembers(redis, cb) {
  var byCo = {};
  var pattern = 'jrec:perportal:' + DATASET + ':*';
  var stream = redis.scanStream({ match: pattern, count: 200 });
  var pending = 0, ended = false;
  function done() { if (ended && pending === 0) cb(null, byCo); }
  stream.on('data', function (keys) {
    keys.forEach(function (key) {
      pending++;
      redis.hgetall(key, function (err, h) {
        pending--;
        if (!err && h) {
          Object.keys(h).forEach(function (field) {
            if (field.indexOf('scope_') !== 0) return;
            var payload; try { payload = JSON.parse(h[field]); } catch (e) { payload = {}; }
            if (payload.status === 'revoked') return;             // severed binding
            var co = (payload.companyId || field.slice(6)).toUpperCase();
            byCo[co] = (byCo[co] || 0) + 1;
          });
        }
        done();
      });
    });
  });
  stream.on('end', function () { ended = true; done(); });
  stream.on('error', cb);
}

// --- merge ------------------------------------------------------------------
function classify(folders, members) {
  var all = {};
  Object.keys(folders).forEach(function (c) { all[c] = true; });
  Object.keys(members).forEach(function (c) { all[c] = true; });
  var rows = Object.keys(all).sort().map(function (co) {
    var f = folders[co], mCount = members[co] || 0;
    var hasDocs = !!f, hasMembers = mCount > 0;
    var state = hasDocs && hasMembers ? 'active'
              : hasDocs && !hasMembers ? 'documents-waiting'
              : !hasDocs && hasMembers ? 'bound-no-docs'
              : 'none';
    return {
      company: co,
      state: state,
      docCount: f ? f.docCount : 0,
      newest: f ? f.newest : null,
      memberCount: mCount
    };
  });
  return rows;
}

function summarize(rows) {
  var s = { active: 0, 'documents-waiting': 0, 'bound-no-docs': 0, none: 0 };
  rows.forEach(function (r) { s[r.state] = (s[r.state] || 0) + 1; });
  return s;
}

// Callable form for detroit to mount; CLI form for testing + Monkey scheduling.
function getStatus(cb) {
  var folders;
  try { folders = scanFolders(); } catch (e) { return cb(e); }
  var redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, db: REDIS_DB, lazyConnect: true });
  redis.connect().then(function () {
    scanMembers(redis, function (err, members) {
      try { redis.quit(); } catch (e) {}
      if (err) return cb(err);
      var rows = classify(folders, members);
      cb(null, { dataset: DATASET, generatedAt: new Date().toISOString(),
                 summary: summarize(rows), companies: rows });
    });
  }).catch(cb);
}

module.exports = { getStatus: getStatus, scanFolders: scanFolders, classify: classify };

if (require.main === module) {
  getStatus(function (err, out) {
    if (err) { console.error('FATAL:', err.message); process.exit(1); }
    console.log('dataset ' + out.dataset + '  @ ' + out.generatedAt);
    console.log('summary: ' + JSON.stringify(out.summary));
    console.log('');
    out.companies.forEach(function (r) {
      if (r.state === 'none') return;
      console.log('  ' + r.state.padEnd(17) + ' ' + r.company.padEnd(8) +
                  ' docs=' + String(r.docCount).padEnd(4) +
                  ' members=' + String(r.memberCount).padEnd(3) +
                  ' newest=' + (r.newest || '-'));
    });
    process.exit(0);
  });
}
