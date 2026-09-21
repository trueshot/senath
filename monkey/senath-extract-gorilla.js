// senath-extract-gorilla.js — gorilla-mounted on-demand email-log extraction.
// OWNER: senath (billet senathSendEmail). HOST: serenada's gorilla (Monkey:3800).
// Contract: serenada gen-16 DM 2026-09-21 — redelivered into serenada's tools/,
// thin handler calls run(opts); status() gets a read-only GET route.
// Source of truth: c:/clients/senath/monkey/ (georg) -> deploys to
// D:/clients/senath/monkey/ (Monkey). Update = DM serenada 'redeliver @<commit>'.
//
// WHY A CHILD SPAWN, NOT AN IN-PROCESS REQUIRE: extract-email-log.js runs
// main() at require time, and loading aws-sdk into the HOST process risks the
// global-config landmine documented at the top of that file. Spawning keeps
// gorilla's process clean, needs ZERO npm deps here (core only), and is
// byte-identical to how the schtask runs it — one code path, clock or human.
//
// MODES (measured 2026-09-21 from georg, Monkey is faster):
//   recent (default)  --days 1 --merge   ~2s    the Sent-page Refresh button
//   full              --days 30          ~80s   the reconciliation sweep
// recent MERGES into existing files (upsert by messageId) — it never clobbers
// the 30-day history. See --merge in extract-email-log.js.
//
// CONCURRENCY: single-flight JOIN (a second caller gets the running extract's
// promise) + 30s cooldown on 'recent' (hammering the button serves the files
// already on disk). 'full' has no cooldown but still joins.

'use strict';

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

// Env overrides exist for georg-side testing only; on Monkey the defaults hold.
var SCRIPT = process.env.SENATH_EXTRACT_SCRIPT || 'D:/clients/senath/monkey/extract-email-log.js';
var OUT_DIR = process.env.SENATH_EXTRACT_OUT || 'D:/clients/senath/data/emaillog';
var COOLDOWN_MS = 30000;
var KILL_MS = 90000;          // under serenada's 120s Promise.race wrapper

var inflight = null;          // { promise, mode, startedAt }
var last = null;              // { ok, mode, finishedAt, result | error }

function readIndex() {
  try { return JSON.parse(fs.readFileSync(path.join(OUT_DIR, '_index.json'), 'utf8')); }
  catch (e) { return null; }
}

function runChild(mode) {
  var args = [SCRIPT, '--out', OUT_DIR];
  if (mode === 'full') { args.push('--days', '30'); }
  else { args.push('--days', '1', '--merge'); }
  var t0 = Date.now();
  return new Promise(function (resolve, reject) {
    var child = spawn('node', args, { cwd: path.dirname(SCRIPT), windowsHide: true });
    var out = '', errOut = '';
    child.stdout.on('data', function (d) { out += d; });
    child.stderr.on('data', function (d) { errOut += d; });
    var killer = setTimeout(function () {
      try { child.kill(); } catch (e) {}
      reject(new Error('extract timeout after ' + KILL_MS + 'ms (mode=' + mode + ')'));
    }, KILL_MS);
    child.on('error', function (e) { clearTimeout(killer); reject(e); });
    child.on('exit', function (code) {
      clearTimeout(killer);
      if (code !== 0) {
        return reject(new Error('extract exited ' + code + ': ' +
          (errOut || out).split('\n').slice(-4).join(' | ').slice(0, 400)));
      }
      // Truth from the ARTIFACT (the rewritten index), not the child's log.
      var idx = readIndex();
      resolve({
        ok: true,
        mode: mode,
        tookMs: Date.now() - t0,
        generatedAt: idx ? idx.generatedAt : null,
        datasets: idx ? idx.datasets : null
      });
    });
  });
}

function run(opts) {
  opts = opts || {};
  var mode = (opts.mode === 'full' || opts.days === '30' || opts.days === 30) ? 'full' : 'recent';

  // JOIN a running extract regardless of requested mode — the caller wants
  // fresh files, and files fresher than their click are about to exist.
  if (inflight) {
    return inflight.promise.then(function (r) {
      return Object.assign({}, r, { joined: true });
    });
  }
  // Cooldown: recent-mode calls within 30s of the last success serve disk.
  if (mode === 'recent' && last && last.ok &&
      Date.now() - last.finishedAt < COOLDOWN_MS) {
    return Promise.resolve(Object.assign({}, last.result, { cooldown: true }));
  }

  var p = runChild(mode).then(function (r) {
    last = { ok: true, mode: mode, finishedAt: Date.now(), result: r };
    inflight = null;
    return r;
  }, function (e) {
    last = { ok: false, mode: mode, finishedAt: Date.now(), error: e.message };
    inflight = null;
    throw e;                  // serenada's handler turns this into a 500
  });
  inflight = { promise: p, mode: mode, startedAt: Date.now() };
  return p;
}

function status() {
  var idx = readIndex();
  return {
    running: inflight ? { mode: inflight.mode, forMs: Date.now() - inflight.startedAt } : null,
    last: last ? { ok: last.ok, mode: last.mode,
                   agoMs: Date.now() - last.finishedAt,
                   error: last.ok ? undefined : last.error } : null,
    filesGeneratedAt: idx ? idx.generatedAt : null
  };
}

module.exports = { run: run, status: status };
