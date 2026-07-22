#!/usr/bin/env node
// send-invite-prototype.js — denver's Stage A0 employee-invitation demo send.
// Author: senath gen-11 — 2026-07-22
//
// SCOPE — A0 ONLY, deliberately minimal (denver gen-2, twice, explicitly):
//   * CTA links straight to the live register.html. NO invite hash.
//   * NO jrec birth. jrec:invite:* is Stage A step 4, NOT today.
//   * NO SES message tags. Tagging is the Stage A hook (it is how the invite
//     hash would later reach my delivery-log extractor); adding it now would
//     be scope creep into a stage denver has not opened.
//   Do not "improve" any of the above without denver asking.
//
// SAFETY: dry-run is the DEFAULT. Nothing leaves the building without --send.
// This exists because the whole reason this script was written and then held
// is that an outward-facing send needs real authorization, not a relayed one.
//
//   node send-invite-prototype.js              # renders + validates, sends nothing
//   node send-invite-prototype.js --send       # actually sends

'use strict';

var fs = require('fs');

// aws-sdk is required LAZILY, only on the actual send path. A dry run should
// validate the template, the domain and the addressing without needing AWS to
// resolve at all — and this file lives outside any package, so a plain
// require('aws-sdk') depends on whatever node_modules happens to sit above it.
function requireAws() {
  var candidates = ['aws-sdk'];
  if (process.env.SENATH_AWS_SDK) candidates.unshift(process.env.SENATH_AWS_SDK);
  for (var i = 0; i < candidates.length; i++) {
    try { return require(candidates[i]); } catch (e) { /* try next */ }
  }
  fail('aws-sdk not resolvable. Set SENATH_AWS_SDK to an absolute aws-sdk path.');
}

var TEMPLATE = 'c:/clients/denver/web/prototype/invite-email.html';
var FROM = 'invitations@producestandards.org';   // verified domain
var TO = 'imtrueshot@gmail.com';
var SUBJECT = 'Savannah Cole invited you to ProduceStandards';
var SECRETS = process.env.SENATH_AWS_SECRETS || 'c:/secrets/config.json';

var VERIFIED = ['produceflow.com', 'producestandards.org', 'prodicon.com', 'jungledevices.com'];

var send = process.argv.indexOf('--send') !== -1;

function fail(msg) { console.error('BLOCKED: ' + msg); process.exit(1); }

// --- preflight: everything checkable, checked before anything is sent -------

var domain = FROM.split('@')[1];
if (VERIFIED.indexOf(domain) === -1) fail(FROM + ' is not a verified sending domain');

var html;
try { html = fs.readFileSync(TEMPLATE, 'utf8'); }
catch (e) { fail('cannot read template ' + TEMPLATE + ': ' + e.message); }

// The prototype keeps denver's FARMWEY story values (Savannah invites John) —
// they ARE the demo, per denver. So there is nothing to interpolate, but an
// unreplaced field would mean the template changed under us. Warn, don't fail.
var leftovers = html.match(/\{[a-zA-Z]+\}/g);
if (leftovers) {
  console.log('NOTE: template contains placeholder tokens: ' +
              leftovers.join(', ') + ' (expected for the A0 prototype — ' +
              'denver keeps the FARMWEY story values hard-coded)');
}

console.log('from:     ' + FROM);
console.log('to:       ' + TO);
console.log('subject:  ' + SUBJECT);
console.log('template: ' + TEMPLATE + ' (' + html.length + ' bytes)');

if (!send) {
  console.log('');
  console.log('DRY RUN — nothing sent. Re-run with --send to deliver.');
  process.exit(0);
}

var AWS = requireAws();
AWS.config.loadFromPath(SECRETS);
var ses = new AWS.SES({ apiVersion: '2010-12-01' });

ses.sendEmail({
  Source: FROM,
  Destination: { ToAddresses: [TO] },
  Message: {
    Subject: { Data: SUBJECT, Charset: 'UTF-8' },
    Body: { Html: { Data: html, Charset: 'UTF-8' } }
  }
}, function (err, data) {
  if (err) { console.error('SEND FAILED:', err.code, '-', err.message); process.exit(1); }
  console.log('SENT. MessageId: ' + data.MessageId);
  process.exit(0);
});
