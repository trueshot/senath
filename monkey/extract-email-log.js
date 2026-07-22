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
      var companies = {};
      msgs.forEach(function (m) { if (m.company) companies[m.company] = (companies[m.company] || 0) + 1; });
      var counts = {};
      msgs.forEach(function (m) { counts[m.status] = (counts[m.status] || 0) + 1; });

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
          scope: 'Emails sent by sendEmail.js (the tagged path) only. ' +
                 'Legacy senders are not represented in this file.',
          messagesInFile: msgs.length
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
  });
}

main();
