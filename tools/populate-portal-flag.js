#!/usr/bin/env node
// populate-portal-flag.js — set ARAPMAST.PORTAL from canopylake ground truth.
//
// George added PORTAL l(1) to the arapmast template (2026-07-22) and asked me
// to populate it: "who has a portal" as a fact in the company master, readable
// by every legacy tool, instead of a manifest snapshot.
//
// CRITERIA (senath's, per "how you think appropriate"):
//   PORTAL = T  iff  canopylake outgoing/{ID_NO}/ folder EXISTS
//   PORTAL = F  otherwise (explicit F, not blank — the field reads as a real
//               boolean, never tri-state mush)
// The filesystem is the fact. The folder is born exactly when the first
// document is shared with that company (copyPdfToCanopylake, or portland's
// June work). NOTE this means "has portal documents waiting", NOT "someone is
// registered and bound" — that is the perportal jrec side, a different column.
//
// WRITE MECHANISM: single-byte patches at computed offsets via r+ — no header
// rewrite, no full-file rewrite. The DBF is live on the prey with shared
// access; one byte per record is the minimum possible disturbance. Offsets are
// computed from the schema and VERIFIED against the header record length
// before any write. Deleted records (0x2A flag) are skipped.
//
// Usage:
//   node populate-portal-flag.js                 # DRY RUN (default)
//   node populate-portal-flag.js --write         # actually write
//   node populate-portal-flag.js --dbf <path> --folders <listfile>
//
// Author: senath gen-11 — 2026-07-22

'use strict';

var fs = require('fs');

function opt(name, def) {
  var i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
var WRITE = process.argv.indexOf('--write') !== -1;
var DBF = opt('--dbf', '//15.30.60.44/hawk/d/clients/willis/dbf/arapmast.dbf');
var FOLDERS = opt('--folders',
  'C:/Users/georg/AppData/Local/Temp/claude/C--clients-nimbus-corporals-senath/a8ce9ade-d9b0-4e2f-bffd-5c316cf08071/scratchpad/portal-folders.txt');

// --only <COMPANY> : one-off, set PORTAL=T for a SINGLE company regardless of
// folder, and touch NO other row. For a company pre-provisioned for a portal
// before any document has been sent (no folder yet) — e.g. a grower being set
// up. George's PROMIS ask (via portland, 2026-07-23) is the first use.
var ONLY = opt('--only', null);
if (ONLY) ONLY = String(ONLY).trim().toUpperCase();

// --- the folder set (ground truth) — skipped entirely in --only mode ---
var folderSet = {};
if (!ONLY) {
  fs.readFileSync(FOLDERS, 'utf8').split('\n').forEach(function (l) {
    var co = l.trim().toUpperCase();
    if (co) folderSet[co] = false;   // false = not yet matched to an arapmast row
  });
}

// --- parse DBF header + field descriptors (dBASE III) ---
var fd = fs.openSync(DBF, WRITE ? 'r+' : 'r');
var head = Buffer.alloc(32);
fs.readSync(fd, head, 0, 32, 0);
var recCount = head.readUInt32LE(4);
var headerLen = head.readUInt16LE(8);
var recLen = head.readUInt16LE(10);

var nFields = Math.floor((headerLen - 33) / 32);
var fdesc = Buffer.alloc(32 * nFields);
fs.readSync(fd, fdesc, 0, fdesc.length, 32);

var offset = 1;  // record byte 0 = deletion flag
var idnoOff = -1, idnoW = 0, portalOff = -1;
for (var i = 0; i < nFields; i++) {
  var b = fdesc.slice(i * 32, i * 32 + 32);
  var name = b.slice(0, 11).toString('ascii').replace(/\0.*$/, '');
  var width = b[16];
  if (name === 'ID_NO') { idnoOff = offset; idnoW = width; }
  if (name === 'PORTAL') { portalOff = offset; }
  offset += width;
}

// SAFETY GATES — refuse to touch anything if the structure isn't what we
// computed. A wrong offset writes garbage into a live financial table.
if (idnoOff === -1) throw new Error('ID_NO field not found — aborting');
if (portalOff === -1) throw new Error('PORTAL field not found — table not restructured? aborting');
if (offset !== recLen) throw new Error('computed record length ' + offset +
  ' != header record length ' + recLen + ' — structure drift, aborting');

console.log((WRITE ? 'WRITE MODE' : 'DRY RUN') + ' — ' + DBF);
console.log('records: ' + recCount + ', ID_NO@' + idnoOff + ', PORTAL@' + portalOff +
            ', reclen ' + recLen + ' (verified)');

// --- pass over records ---
var rec = Buffer.alloc(recLen);
var one = Buffer.alloc(1);
var setT = 0, setF = 0, skippedDeleted = 0, already = 0, changed = [];

for (var r = 0; r < recCount; r++) {
  var pos = headerLen + r * recLen;
  fs.readSync(fd, rec, 0, recLen, pos);
  if (rec[0] === 0x2A) { skippedDeleted++; continue; }   // deleted row

  var idno = rec.slice(idnoOff, idnoOff + idnoW).toString('ascii').trim().toUpperCase();

  var want;
  if (ONLY) {
    // Single-company mode: set T for the target only, leave every other row
    // exactly as it is. Never write F to anyone.
    if (idno !== ONLY) continue;
    want = 0x54; // T
    folderSet[idno] = true;  // reuse the "matched" bookkeeping for the summary
  } else {
    want = folderSet.hasOwnProperty(idno) ? 0x54 /*T*/ : 0x46 /*F*/;
    if (folderSet.hasOwnProperty(idno)) folderSet[idno] = true;   // matched
  }

  var cur = rec[portalOff];
  if (cur === want) { already++; continue; }

  if (want === 0x54) { setT++; changed.push(idno + ' -> T'); } else { setF++; }
  if (WRITE) {
    one[0] = want;
    fs.writeSync(fd, one, 0, 1, pos + portalOff);
  }
}
fs.closeSync(fd);

console.log('');
console.log('PORTAL=T ' + (WRITE ? 'written' : 'would write') + ': ' + setT);
console.log('PORTAL=F ' + (WRITE ? 'written' : 'would write') + ': ' + setF);
console.log('already correct: ' + already + ', deleted rows skipped: ' + skippedDeleted);
console.log('');
console.log('T companies: ' + changed.filter(function (c) { return /T$/.test(c); })
  .map(function (c) { return c.replace(' -> T', ''); }).join(', '));

var unmatched = Object.keys(folderSet).filter(function (k) { return !folderSet[k]; });
if (unmatched.length) {
  console.log('');
  console.log('*** FOLDERS WITH NO ARAPMAST ROW (' + unmatched.length + ') — flag stays unset for these; report to George: ***');
  console.log('  ' + unmatched.join(', '));
}
if (!WRITE) console.log('\nDry run only. Re-run with --write to apply.');
