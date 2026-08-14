#!/usr/bin/env node
// extract-email-log.js — pulls the SES delivery log out of CloudWatch and
// writes it to disk as per-dataset files. Runs ON MONKEY, standalone.
//
// Author: senath gen-11 — 2026-07-22
//
// WHY THIS SHAPE (George, 2026-07-22): "write the code to extract the log
// files and prosser simply includes the data." So this process does ALL the
// AWS work and leaves plain JSON on disk. Reggi never makes an AWS call, never
// blocks on CloudWatch, and cannot be taken down by an AWS timeout.
//
// *** IT NEVER RUNS ON A PREY SERVER. *** George, 2026-07-22, permanent:
// "It will not as long as I am alive." Do not port it, do not benchmark it,
// do not re-open it because the prey SDK turns out to be capable. It is.
// Irrelevant. This runs on Monkey.
//
// SCOPE (George, 2026-07-22): legacy systems also send email. NOT OUR PROBLEM.
// We report only the NEW path — sendEmail.js, the file senath owns. Those sends
// are identifiable because sendEmail.js stamps doctype UNCONDITIONALLY on every
// message (see sendEmail.js, X-SES-MESSAGE-TAGS block). No doctype => not our
// path => excluded, and counted in coverage.legacyExcluded so the number is
// visible rather than silently swallowed.
//
// *** PROSSER'S LANDMINE — READ BEFORE EDITING ***
// Reggi's creator_infra.js does a GLOBAL AWS.config.update() pointing at
// DynamoDB. This file therefore:
//   1. NEVER calls AWS.config.update() or AWS.config.loadFromPath().
//   2. Passes region + endpoint + credentials EXPLICITLY to the constructor.
// Credentials are read from the secrets file and handed to the client directly,
// so that even if someone one day require()s this into Reggi's process, it
// still cannot mutate prosser's global config and reroute his 28 DynamoDB
// endpoints to CloudWatch. That would be a data-integrity failure, not an
// outage. Keep it that way.
//
// USAGE
//   node extract-email-log.js                 # last 30 days
//   node extract-email-log.js --days 90
//   node extract-email-log.js --out D:/clients/senath/data/emaillog
//
// OUTPUT  <out>/<DATASET>.json   one per dataset, plus _index.json

'use strict';

var fs = require('fs');
var path = require('path');

// aws-sdk v2 ships CloudWatchLogs built in — no install, no native build
// (confirmed by prosser gen-2: Reggi runs 2.596.0). This file lives outside any
// package, so plain require('aws-sdk') fails unless a node_modules happens to
// sit above it. Resolve explicitly instead of depending on cwd, and say so
// loudly when it can't be found — a silent failure here is a silent empty page.
function requireAws() {
  var tried = [];
  var candidates = ['aws-sdk'];
  if (process.env.SENATH_AWS_SDK) candidates.unshift(process.env.SENATH_AWS_SDK);
  for (var i = 0; i < candidates.length; i++) {
    try { return require(candidates[i]); } catch (e) { tried.push(candidates[i]); }
  }
  throw new Error(
    'aws-sdk not resolvable. Tried: ' + tried.join(', ') + '\n' +
    'Set SENATH_AWS_SDK to the absolute path of an aws-sdk install, e.g.\n' +
    '  SENATH_AWS_SDK=D:/clients/oakley/node_modules/aws-sdk node extract-email-log.js');
}
var AWS = requireAws();

var LOG_GROUP = '/aws/events/ses-produceflow';
var REGION = 'us-east-1';
var LOGS_ENDPOINT = 'https://logs.' + REGION + '.amazonaws.com';   // explicit — see landmine
var SECRETS = process.env.SENATH_AWS_SECRETS || 'D:/secrets/config.json';

function arg(name, fallback) {
  var i = process.argv.indexOf('--' + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

var DAYS = parseInt(arg('days', '30'), 10);
var OUT_DIR = arg('out', 'D:/clients/senath/data/emaillog');

// Hard ceiling on messages per dataset file (prosser gen-2 audit, 2026-07-22).
// Reggi reads these files SYNCHRONOUSLY on the request path and is
// single-threaded and shared — an unbounded file would stall all 28 of his
// entity/authority endpoints while it parses. Cap keeps any single file well
// under the ~5MB line where he asked for an async read path.
// Truncation is REPORTED, never silent: see coverage.truncated below. A page
// that quietly drops a customer's older mail is the exact sin this whole
// feature exists to avoid.
var MAX_PER_DATASET = parseInt(arg('max', '5000'), 10);

// ---------------------------------------------------------------- AWS client

function makeClient() {
  var creds;
  try {
    creds = JSON.parse(fs.readFileSync(SECRETS, 'utf8'));
  } catch (e) {
    throw new Error('cannot read AWS secrets at ' + SECRETS + ': ' + e.message);
  }
  // Explicit everything. No global config touched. See landmine note above.
  return new AWS.CloudWatchLogs({
    apiVersion: '2014-03-28',
    region: creds.region || REGION,
    endpoint: LOGS_ENDPOINT,
    accessKeyId: creds.accessKeyId,
    secretAccessKey: creds.secretAccessKey,
    maxRetries: 3,
    httpOptions: { timeout: 30000, connectTimeout: 5000 }
  });
}

// Page through filter-log-events. CloudWatch caps a page at 1MB/10k events.
function fetchAll(cwl, startMs, done) {
  var events = [];
  (function page(token) {
    var params = { logGroupName: LOG_GROUP, startTime: startMs };
    if (token) params.nextToken = token;
    cwl.filterLogEvents(params, function (err, data) {
      if (err) return done(err);
      events = events.concat(data.events || []);
      if (data.nextToken) return page(data.nextToken);
      done(null, events);
    });
  })(null);
}

// ------------------------------------------------------------------ shaping

function tag(tags, name) {
  // SES presents tags as { name: [value] }
  var v = tags && tags[name];
  return (v && v[0]) || null;
}

// One EMAIL is many CloudWatch rows (Send, then Delivery or Bounce, then maybe
// Open), joined by messageId. Group first, decide status second.
function group(rawEvents) {
  var byId = {};
  rawEvents.forEach(function (e) {
    var d;
    try { d = JSON.parse(e.message); } catch (x) { return; }
    var det = d.detail || {};
    var mail = det.mail || {};
    var tags = mail.tags || {};
    var id = mail.messageId;
    if (!id) return;

    var m = byId[id];
    if (!m) {
      m = byId[id] = {
        messageId: id,
        time: mail.timestamp || new Date(e.timestamp).toISOString(),
        to: (mail.destination || []).join(', '),
        from: mail.source || '',
        subject: (mail.commonHeaders || {}).subject || '(no subject)',
        // our tags — the join keys sendEmail.js stamps
        dataset: null, company: null, load: null,
        doctype: null, date: null, who: null, doc: null,
        events: []
      };
    }
    // Tags ride on every event for the message; first non-null wins.
    // Dataset is UPPERCASED: the live log contains both 'WILLIS' (177) and
    // 'willis' (2). An un-normalized filter silently drops the odd ones.
    if (!m.dataset && tag(tags, 'dataset')) m.dataset = String(tag(tags, 'dataset')).toUpperCase();
    if (!m.company && tag(tags, 'company')) m.company = String(tag(tags, 'company')).toUpperCase();
    if (!m.load) m.load = tag(tags, 'load');
    if (!m.doctype) m.doctype = tag(tags, 'doctype');
    if (!m.date) m.date = tag(tags, 'date');
    if (!m.who) m.who = tag(tags, 'who');
    if (!m.doc) m.doc = tag(tags, 'doc');
    // Invite sends stamp invite=<hash> (sendInvite.js). Captured so the T1f
    // bounce-stamping phase below can find the jrec:invite record; also rides
    // into the dataset JSON so the Sent page can link a row to its invite.
    if (!m.invite) m.invite = tag(tags, 'invite');

    var b = det.bounce || {};
    var bounced = (b.bouncedRecipients || [])[0] || {};
    m.events.push({
      type: det.eventType,
      time: (det.delivery || {}).timestamp || b.timestamp ||
            (det.open || {}).timestamp || mail.timestamp,
      // The bounce diagnostic is the money feature — the receiving server's
      // own words, verbatim. Never summarize it away.
      detail: det.eventType === 'Bounce'
          ? (b.bounceType + '/' + b.bounceSubType + ' — ' +
             (bounced.diagnosticCode || 'no diagnostic'))
        : det.eventType === 'Delivery' ? ((det.delivery || {}).smtpResponse || 'accepted')
        : det.eventType === 'Open' ? ('opened · ip ' + ((det.open || {}).ipAddress || '?'))
        : det.eventType === 'Complaint' ? ((det.complaint || {}).complaintFeedbackType || 'complaint')
        : det.eventType === 'DeliveryDelay' ? ((det.deliveryDelay || {}).delayType || 'delayed')
        : ''
    });
  });

  return Object.keys(byId).map(function (k) { return byId[k]; });
}

// The status vocabulary is a contract, not decoration. Each word is chosen to
// be true; see sent.html's honest-status contract. Notably 'accepted' means the
// receiving server took it — NOT that a human saw it (load 33316: two
// recipients SMTP-accepted, then quarantined by Mimecast, never seen).
function statusOf(m) {
  var t = {};
  m.events.forEach(function (e) { t[e.type] = 1; });
  if (t.Bounce) return 'bounced';
  if (t.Complaint) return 'complaint';
  if (t.Open) return 'opened';
  if (t.Delivery) return 'accepted';
  return 'sent';                     // async: outcome legitimately not in yet
}

// ------------------------------------- T1f: invite bounce stamping (db 8)
//
// A bounced INVITE otherwise reads as normally-pending forever: the invite
// record (jrec:invite:<hash>, ElastiCache db 8) never learns the bounce.
// detroit's GET /api/v1/portal/invites already forwards senath_* fields
// verbatim when present; this stamps them. (senath gen-16, 2026-08-14 —
// the fix specified in --facet-email-tracking since gen-13.)
//
// Posture, matching this file's contract:
//   - BEST-EFFORT, NEVER FATAL: runs AFTER the JSON files are written; any
//     redis failure logs and exits 0. The extraction is the product; the
//     stamp is a bonus. A stamping bug must never stale the Sent page.
//   - ZERO DEPENDENCIES: a ~60-line RESP client over node's net module.
//     Monkey's node_modules contents are unverifiable from here — a require
//     that might not resolve is a silent skip waiting to happen.
//   - GUARDED: HSET fires ONLY if the key EXISTS. Invite records carry a
//     TTL; an unguarded HSET on an expired hash would resurrect it as a
//     TTL-less orphan. HSET does not touch TTL on live keys.
//   - IDEMPOTENT: re-runs re-stamp identical values; harmless.
//
// Host: in-VPC ElastiCache endpoint (this runs ON MONKEY). Override with
// SENATH_REDIS_HOST/SENATH_REDIS_PORT (georg testing rides the local
// 127.0.0.1:16379 tunnel, same one libertyville inspect.js uses).

var REDIS_HOST = process.env.SENATH_REDIS_HOST || 'my-redis-cluster.3jytjd.0001.use1.cache.amazonaws.com';
var REDIS_PORT = parseInt(process.env.SENATH_REDIS_PORT || '6379', 10);

function makeRedis(host, port, onDead) {
  var net = require('net');
  var sock = net.connect({ host: host, port: port });
  var pending = [];            // reply callbacks, FIFO
  var buf = Buffer.alloc(0);
  var dead = false;
  function die(err) {
    if (dead) return;
    dead = true;
    try { sock.destroy(); } catch (e) {}
    var p = pending; pending = [];
    p.forEach(function (cb) { cb(err || new Error('redis connection lost')); });
    if (onDead) onDead(err);
  }
  // 30s idle timeout: on Monkey (direct in-VPC endpoint) replies are ms and
  // this is pure failure detection — but the georg test tunnel's COLD remote
  // leg measured 9.9s to first reply (2026-08-14), which killed a 10s timeout
  // at the edge. Idle-based: resets on each reply.
  sock.setTimeout(30000, function () { die(new Error('redis timeout (' + host + ':' + port + ')')); });
  sock.on('error', die);
  sock.on('close', function () { die(new Error('redis closed')); });
  sock.on('data', function (d) {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      var r = parseOne();
      if (!r) break;                       // incomplete — wait for more bytes
      var cb = pending.shift();
      if (cb) cb(null, r.v);
    }
  });
  // Parse ONE complete reply off buf, or return null if incomplete.
  // Handles +simple, -error(as value), :int, $bulk. Arrays not needed here.
  function parseOne() {
    var nl = buf.indexOf('\r\n');
    if (nl === -1) return null;
    var t = String.fromCharCode(buf[0]);
    var head = buf.slice(1, nl).toString();
    if (t === '+' || t === '-' || t === ':') {
      buf = buf.slice(nl + 2);
      return { v: t === ':' ? parseInt(head, 10) : (t === '-' ? new Error(head) : head) };
    }
    if (t === '$') {
      var n = parseInt(head, 10);
      if (n === -1) { buf = buf.slice(nl + 2); return { v: null }; }
      if (buf.length < nl + 2 + n + 2) return null;
      var s = buf.slice(nl + 2, nl + 2 + n).toString();
      buf = buf.slice(nl + 2 + n + 2);
      return { v: s };
    }
    die(new Error('unexpected RESP type: ' + t));
    return null;
  }
  return {
    send: function (args, cb) {
      if (dead) return cb(new Error('redis dead'));
      var out = '*' + args.length + '\r\n';
      args.forEach(function (a) {
        var s = String(a);
        out += '$' + Buffer.byteLength(s) + '\r\n' + s + '\r\n';
      });
      pending.push(cb);
      sock.write(out);
    },
    end: function () { dead = true; try { sock.end(); sock.destroy(); } catch (e) {} }
  };
}

function stampInviteBounces(messages, done) {
  var stamps = [];
  messages.forEach(function (m) {
    if (!m.invite) return;
    var b = null;
    m.events.forEach(function (e) { if (e.type === 'Bounce') b = e; });
    if (!b) return;
    // detail is 'bounceType/bounceSubType — diagnostic' (see group()).
    var parts = String(b.detail || '').split(' — ');
    stamps.push({
      key: 'jrec:invite:' + m.invite,
      bounceType: parts[0] || 'unknown',
      diagnostic: parts.slice(1).join(' — ') || 'no diagnostic',
      at: b.time || ''
    });
  });
  if (!stamps.length) {
    console.log('invite bounce stamping: no bounced invites in window');
    return done();
  }
  console.log('invite bounce stamping: ' + stamps.length + ' bounced invite(s) found');
  var finished = false;
  function finish() { if (!finished) { finished = true; done(); } }
  var r = makeRedis(REDIS_HOST, REDIS_PORT, function (err) {
    console.error('invite bounce stamping skipped (non-fatal): ' + (err ? err.message : 'connection lost'));
    finish();
  });
  r.send(['SELECT', '8'], function (err) {
    if (err) return finish();
    var i = 0, stamped = 0, expired = 0;
    (function next() {
      if (i >= stamps.length) {
        console.log('invite bounce stamping: ' + stamped + ' stamped, ' + expired + ' expired/absent (guard skipped)');
        r.end();
        return finish();
      }
      var s = stamps[i++];
      r.send(['EXISTS', s.key], function (e2, n) {
        if (e2) return finish();
        if (n !== 1) { expired++; return next(); }   // TTL-expired or absent — never resurrect
        r.send(['HSET', s.key,
                'senath_bounced', 'true',
                'senath_bounceType', s.bounceType,
                'senath_bounceDiagnostic', s.diagnostic,
                'senath_bouncedAt', s.at], function (e3) {
          if (e3) return finish();
          stamped++;
          console.log('  stamped ' + s.key + ' (' + s.bounceType + ')');
          next();
        });
      });
    })();
  });
}

// ------------------------------------------------------------------- writing

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, obj) {
  var tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);          // atomic-ish: a reader never sees a half file
}

function main() {
  var startMs = Date.now() - DAYS * 86400000;
  var windowStart = new Date(startMs).toISOString();
  var cwl;
  try { cwl = makeClient(); } catch (e) {
    console.error('FATAL:', e.message);
    process.exit(1);
  }

  console.log('extract-email-log: querying ' + LOG_GROUP + ' since ' + windowStart);

  fetchAll(cwl, startMs, function (err, raw) {
    if (err) {
      console.error('FATAL: CloudWatch query failed:', err.code, '-', err.message);
      process.exit(1);
    }
    var all = group(raw);

    // Split ours from legacy. doctype is stamped unconditionally by
    // sendEmail.js, so its absence means the send did not come from our path.
    var ours = [], legacy = 0;
    all.forEach(function (m) {
      if (!m.doctype) { legacy++; return; }
      m.status = statusOf(m);
      m.events.sort(function (a, b) { return (a.time || '') < (b.time || '') ? -1 : 1; });
      ours.push(m);
    });

    // Filter by dataset — this is the whole organizing principle (George).
    // dataset alone -> the staff view. dataset + company -> what a portal
    // customer may see of their own mail. Same file, one more filter.
    var byDataset = {};
    ours.forEach(function (m) {
      var ds = m.dataset || 'UNATTRIBUTED';
      (byDataset[ds] = byDataset[ds] || []).push(m);
    });

    ensureDir(OUT_DIR);
    var generatedAt = new Date().toISOString();
    var index = { generatedAt: generatedAt, windowStart: windowStart, days: DAYS,
                  logGroup: LOG_GROUP, datasets: [] };

    Object.keys(byDataset).forEach(function (ds) {
      var msgs = byDataset[ds].sort(function (a, b) { return a.time < b.time ? 1 : -1; });

      // Counts are taken over the FULL window before capping, so the totals a
      // user sees describe reality, not the slice we kept.
      var companies = {};
      msgs.forEach(function (m) { if (m.company) companies[m.company] = (companies[m.company] || 0) + 1; });
      var counts = {};
      msgs.forEach(function (m) { counts[m.status] = (counts[m.status] || 0) + 1; });

      var totalInWindow = msgs.length;
      var truncated = totalInWindow > MAX_PER_DATASET;
      if (truncated) {
        msgs = msgs.slice(0, MAX_PER_DATASET);   // newest first — keep the recent end
        console.log('  ' + ds + ': capped ' + totalInWindow + ' -> ' + MAX_PER_DATASET +
                    ' messages (reported as truncated)');
      }

      writeJson(path.join(OUT_DIR, ds + '.json'), {
        dataset: ds,
        generatedAt: generatedAt,
        windowStart: windowStart,
        days: DAYS,
        counts: counts,
        companies: companies,
        // Stated on the page, not buried. The log itself begins 2026-07-14;
        // absence of a row is NOT evidence an email failed to send.
        coverage: {
          logBegins: '2026-07-14',
          taggingLiveFrom: '2026-07-22T06:41:00Z',   // deploy time of the tag code
          scope: 'Emails sent by sendEmail.js (the tagged path) only. ' +
                 'Legacy senders are not represented in this file.',
          messagesInFile: msgs.length,
          totalInWindow: totalInWindow,
          truncated: truncated,
          truncationNote: truncated
            ? ('Showing the most recent ' + MAX_PER_DATASET + ' of ' + totalInWindow +
               ' messages in this window. Older messages exist and were not dropped ' +
               'from the log — only from this file. Widen with --max or narrow --days.')
            : null
        },
        messages: msgs
      });
      index.datasets.push({ dataset: ds, messages: msgs.length, companies: Object.keys(companies).length });
    });

    index.coverage = {
      messagesFromOurPath: ours.length,
      messagesExcludedAsLegacy: legacy,
      note: 'Legacy senders (simplemail.js and others) do not stamp SES tags ' +
            'and are deliberately out of scope. Excluded count is reported so ' +
            'the gap is visible rather than silent.'
    };
    writeJson(path.join(OUT_DIR, '_index.json'), index);

    console.log('raw events:              ' + raw.length);
    console.log('distinct messages:       ' + all.length);
    console.log('  from our tagged path:  ' + ours.length);
    console.log('  excluded as legacy:    ' + legacy);
    console.log('datasets written:        ' + index.datasets.map(function (d) {
      return d.dataset + '(' + d.messages + ')';
    }).join(', ') || '(none)');
    console.log('output: ' + OUT_DIR);

    // T1f: stamp bounced invites onto their jrec records. Runs LAST — the
    // JSON files above are already safe on disk; this phase is best-effort.
    // --stamp-test <hash>: inject a synthetic bounced invite so the redis
    // path (connect/SELECT/EXISTS/guard) can be live-verified with a
    // nonexistent hash — the EXISTS guard skips it, nothing is written.
    var testHash = arg('stamp-test', null);
    if (testHash) {
      ours = ours.concat([{ invite: testHash,
        events: [{ type: 'Bounce', detail: 'Synthetic/Test — stamp-test flag', time: generatedAt }] }]);
    }
    stampInviteBounces(ours, function () {
      // Natural exit so stdout/stderr flush fully (process.exit on Windows
      // can truncate buffered pipe output — observed live 2026-08-14). The
      // unref'd failsafe still guarantees a leaked socket cannot hold the
      // schtask open past 5s.
      process.exitCode = 0;
      setTimeout(function () { process.exit(0); }, 5000).unref();
    });
  });
}

main();
