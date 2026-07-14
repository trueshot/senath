#!/usr/bin/env node
// email-lookup.js — "Did X get their email?" in one command.
//
// Queries the SES per-message event log (CloudWatch Logs group
// /aws/events/ses-produceflow, wired 2026-07-14: SES config set
// produceflow-tracking -> EventBridge rule ses-email-events -> log group).
// Every send from the four verified identities logs Send / Delivery /
// Bounce (with the receiving server's SMTP response) / Complaint / Open.
//
//   node email-lookup.js <search> [--days N] [--json]
//
//   <search>  substring matched against recipient, subject, or Message ID
//             e.g. "rdunning", "freshouse", "33316", a full Message ID
//   --days N  how far back to look (default 14, retention is 400)
//
// Calls the aws CLI directly (no shell) so Windows path mangling never
// touches the leading-slash log group name.
//
// Author: senath gen-10

var spawnSync = require('child_process').spawnSync;
var args = process.argv.slice(2);
var search = (args.find(function (a) { return a.indexOf('--') !== 0; }) || '').toLowerCase();
var daysIx = args.indexOf('--days');
var days = daysIx !== -1 ? parseInt(args[daysIx + 1], 10) : 14;
var asJson = args.indexOf('--json') !== -1;

if (!search) {
  console.error('usage: node email-lookup.js <recipient|subject|messageId substring> [--days N] [--json]');
  process.exit(1);
}

var LOG_GROUP = '/aws/events/ses-produceflow';
var REGION = 'us-east-1';
var startMs = Date.now() - days * 86400000;

var events = [];
var nextToken = null;
do {
  var cliArgs = ['logs', 'filter-log-events',
    '--log-group-name', LOG_GROUP,
    '--region', REGION,
    '--start-time', String(startMs),
    '--output', 'json'];
  if (nextToken) cliArgs.push('--next-token', nextToken);
  // shell:true — aws is aws.cmd on Windows; cmd.exe does NOT mangle the
  // leading-slash log group name (only Git Bash/MSYS does).
  var r = spawnSync('aws', cliArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true });
  if (r.status !== 0) { console.error('aws cli failed:', (r.stderr || '').slice(0, 500)); process.exit(1); }
  var page = JSON.parse(r.stdout);
  (page.events || []).forEach(function (e) { events.push(e); });
  nextToken = page.nextToken || null;
} while (nextToken);

// Parse + filter
var hits = [];
events.forEach(function (e) {
  var d; try { d = JSON.parse(e.message); } catch (err) { return; }
  var det = d.detail || {};
  var mail = det.mail || {};
  var hay = JSON.stringify([mail.destination, (mail.commonHeaders || {}).subject, mail.messageId, mail.source]).toLowerCase();
  if (hay.indexOf(search) === -1) return;
  var b = det.bounce || {};
  hits.push({
    time: mail.timestamp || new Date(e.timestamp).toISOString(),
    type: det.eventType,
    to: (mail.destination || []).join(','),
    from: mail.source,
    subject: (mail.commonHeaders || {}).subject,
    messageId: mail.messageId,
    detail: det.eventType === 'Bounce'
      ? (b.bounceType + '/' + b.bounceSubType + ' — ' + (((b.bouncedRecipients || [])[0] || {}).diagnosticCode || 'no diagnostic'))
      : det.eventType === 'Delivery' ? ('accepted by ' + (((det.delivery || {}).recipients || []).join(',') || 'recipient server') + ' — ' + ((det.delivery || {}).smtpResponse || ''))
      : det.eventType === 'Open' ? ('opened, ip ' + ((det.open || {}).ipAddress || '?'))
      : ''
  });
});
hits.sort(function (a, b) { return a.time < b.time ? -1 : 1; });

if (asJson) { console.log(JSON.stringify(hits, null, 2)); process.exit(0); }

if (!hits.length) {
  console.log('No events matching "' + search + '" in the last ' + days + ' day(s).');
  console.log('(Log began 2026-07-14 — sends before that are not in it.)');
  process.exit(0);
}
console.log(hits.length + ' event(s) for "' + search + '" (last ' + days + 'd):\n');
var byMsg = {};
hits.forEach(function (h) { (byMsg[h.messageId] = byMsg[h.messageId] || []).push(h); });
Object.keys(byMsg).forEach(function (id) {
  var g = byMsg[id];
  console.log(g[0].time + '  "' + (g[0].subject || '(no subject)') + '"  →  ' + g[0].to);
  g.forEach(function (h) {
    console.log('   ' + h.type.toUpperCase() + (h.detail ? '  ' + h.detail : ''));
  });
  console.log('   msgId ' + id + '\n');
});
