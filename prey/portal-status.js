#!/usr/bin/env node
// portal-status.js — LIVE per-company portal status for the operator console.
// No snapshot. Two ground-truth sources, merged into a tri-state.
//
// George's ask (2026-07-23): folder-scan approved; show documents-waiting and
// active-portal as DISTINCT states; portland wires portal-manager.html to it.
//
// v2 (2026-07-23) — rewritten to detroit gen-15's mount contract:
//   * The EXPORTED module requires NO redis library. detroit's TrueAPI runs
//     Node 5.12 + node-redis 2.8 on the prey; a top-level ioredis require would
//     CRASH TrueAPI at load. The only redis require lives in the CLI block,
//     which runs georg-only (via the SSH tunnel).
//   * getStatus(opts, cb), opts = { outgoing, dataset, redisClient }.
//     redisClient arrives CONNECTED and already on db 8 — this module NEVER
//     creates, selects, or quits it. detroit owns that connection's lifecycle.
//   * scanMembers uses the node-redis 2.8 scan API detroit specified:
//       client.scan(cursor,'MATCH',pattern,'COUNT','200',cb) -> [nextCursor,keys]
//     looping until cursor === '0'. (ioredis honors the same callback shape,
//     so the georg CLI exercises the identical code path against the tunnel.)
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
//                                                          the actionable gap)
//   active            folder w/ docs AND >=1 bound member (working portal)
//   bound-no-docs     bound member but NO folder          (anomaly — surfaced,
//                                                          never hidden)
//
// CASE TRAP: the perportal key stores the dataset UPPERCASE (WILLIS); company
// codes are uppercase in the folder name and the scope_ suffix. Normalize both
// sides or the merge silently drops the whole member join. detroit passes
// dataset uppercase; getStatus uppercases again, defensively.
//
// Author: senath gen-11 — 2026-07-23

'use strict';

var fs = require('fs');

// --- source 1: folders ------------------------------------------------------
// One readdir of the parent (company list), one readdir per company (files).
// newest = lexical max of the date-prefixed filenames — dates sort as strings.
function scanFolders(outgoing) {
  var byCo = {};
  var companies;
  try { companies = fs.readdirSync(outgoing); }
  catch (e) { throw new Error('cannot read outgoing dir ' + outgoing + ': ' + e.message); }
  companies.forEach(function (co) {
    var dir = outgoing + '/' + co;
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
// SCAN (never KEYS — must not block the shared prey Redis) the per-person
// records; invert their active scope_{CO} bindings into a per-company count.
// node-redis 2.8 API per detroit; client arrives connected on db 8.
function scanMembers(client, dataset, cb) {
  var byCo = {};
  var pattern = 'jrec:perportal:' + dataset + ':*';
  var called = false;
  function fail(e) { if (!called) { called = true; cb(e); } }
  function finish() { if (!called) { called = true; cb(null, byCo); } }

  (function loop(cursor) {
    client.scan(cursor, 'MATCH', pattern, 'COUNT', '200', function (err, reply) {
      if (err) return fail(err);
      var nextCursor = reply[0];
      var keys = reply[1] || [];
      var pending = keys.length;

      function step() {
        if (pending > 0) return;
        if (nextCursor === '0') finish();
        else loop(nextCursor);
      }

      if (!pending) return step();
      keys.forEach(function (key) {
        client.hgetall(key, function (e2, h) {
          if (!e2 && h) {
            Object.keys(h).forEach(function (field) {
              if (field.indexOf('scope_') !== 0) return;
              var payload; try { payload = JSON.parse(h[field]); } catch (e) { payload = {}; }
              if (payload.status === 'revoked') return;           // severed binding
              var co = (payload.companyId || field.slice(6)).toUpperCase();
              byCo[co] = (byCo[co] || 0) + 1;
            });
          }
          pending--;
          step();
        });
      });
    });
  })('0');
}

// --- merge ------------------------------------------------------------------
function classify(folders, members) {
  var all = {};
  Object.keys(folders).forEach(function (c) { all[c] = true; });
  Object.keys(members).forEach(function (c) { all[c] = true; });
  return Object.keys(all).sort().map(function (co) {
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
}

function summarize(rows) {
  var s = { active: 0, 'documents-waiting': 0, 'bound-no-docs': 0, none: 0 };
  rows.forEach(function (r) { s[r.state] = (s[r.state] || 0) + 1; });
  return s;
}

// detroit's mount surface. redisClient is CONNECTED, on db 8, and NOT ours to
// create/select/quit. Errors propagate LOUD (detroit maps the returned message
// to a 502 portal_status_failed) — an empty page is worse than a 502.
function getStatus(opts, cb) {
  opts = opts || {};
  var dataset = String(opts.dataset || 'WILLIS').toUpperCase();
  if (!opts.outgoing) return cb(new Error('opts.outgoing required'));
  if (!opts.redisClient) return cb(new Error('opts.redisClient required (connected, db 8)'));
  var folders;
  try { folders = scanFolders(opts.outgoing); } catch (e) { return cb(e); }
  scanMembers(opts.redisClient, dataset, function (err, members) {
    if (err) return cb(err);
    var rows = classify(folders, members);
    cb(null, {
      dataset: dataset,
      generatedAt: new Date().toISOString(),
      summary: summarize(rows),
      companies: rows
    });
  });
}

module.exports = { getStatus: getStatus, scanFolders: scanFolders, classify: classify };

// --- CLI (georg only) -------------------------------------------------------
// Runs against the SSH tunnel; this is the ONLY place a redis lib is required,
// and it never loads on the prey (require.main is false when detroit mounts).
if (require.main === module) {
  var optArg = function (name, def) {
    var i = process.argv.indexOf(name);
    return (i !== -1 && process.argv[i + 1]) ? process.argv[i + 1] : def;
  };
  var DATASET  = (optArg('--dataset', process.env.PORTAL_DATASET || 'WILLIS')).toUpperCase();
  var OUTGOING = optArg('--outgoing', process.env.PORTAL_OUTGOING ||
    '//15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing');
  var Redis = require(process.env.PORTAL_IOREDIS || 'c:/clients/libertyville/node_modules/ioredis');
  var client = new Redis({
    host: process.env.PORTAL_REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.PORTAL_REDIS_PORT || '16379', 10),
    db: parseInt(process.env.PORTAL_REDIS_DB || '8', 10),
    lazyConnect: true
  });
  client.connect().then(function () {
    getStatus({ outgoing: OUTGOING, dataset: DATASET, redisClient: client }, function (err, out) {
      try { client.quit(); } catch (e) {}
      if (err) { console.error('FATAL:', err.message); process.exit(1); }
      console.log('dataset ' + out.dataset + '  @ ' + out.generatedAt);
      console.log('summary: ' + JSON.stringify(out.summary) + '\n');
      out.companies.forEach(function (r) {
        if (r.state === 'none') return;
        console.log('  ' + r.state.padEnd(17) + ' ' + r.company.padEnd(8) +
                    ' docs=' + String(r.docCount).padEnd(4) +
                    ' members=' + String(r.memberCount).padEnd(3) +
                    ' newest=' + (r.newest || '-'));
      });
      process.exit(0);
    });
  }).catch(function (e) { console.error('FATAL:', e.message); process.exit(1); });
}
