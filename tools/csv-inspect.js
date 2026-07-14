#!/usr/bin/env node
// csv-inspect.js — Parse the emailback/emails.csv print-log into a normalized
// index, classify each row, and summarize. Reads ONE local file. Never walks
// prnthist. Author: senath gen-9, 2026-06-27.
//
// Usage:
//   node csv-inspect.js [path-to-emails.csv]   (default: ./out/emails.csv)
// Writes: ./out/emails-normalized.json  (consumed by doc-probe.js, portal-gap.js)
//
// The CSV is a directory-listing dump: folder,file,size,type,created,mod,accessed
// Real docs live at  ...\prnthist\{load}\{date}\{who}\{ext}\{load}_{type}_{n}.pdf
// so load/date/who/ext/type/n are recoverable FROM THE PATH — no SMB needed here.

var fs = require('fs');
var path = require('path');

var csvPath = process.argv[2] || path.join(__dirname, 'out', 'emails.csv');
var raw = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
var lines = raw.split(/\r?\n/).filter(function (l) { return l.trim(); });

function parseRow(line) {
  // fields never contain commas (paths use \, type is "Firefox HTML Document",
  // dates use slashes) so a naive split is safe for this export.
  var f = line.split(',');
  var folder = f[0] || '';
  var file = f[1] || '';
  var parts = folder.split('\\').filter(Boolean);
  var pi = parts.indexOf('prnthist');
  var rec = {
    folder: folder, file: file, size: f[2] || '', created: f[4] || '',
    load: null, date: null, who: null, ext: null, docType: null, n: null,
    klass: 'unknown'
  };
  // classify
  if (/drivecheck/i.test(file)) rec.klass = 'drivecheck';
  else if (/_test\d*\.pdf$/i.test(file)) rec.klass = 'test';
  else rec.klass = 'real';
  // path fields (only meaningful for the load-based real layout)
  if (pi !== -1 && parts.length >= pi + 5) {
    rec.load = parts[pi + 1];
    rec.date = parts[pi + 2];
    rec.who = parts[pi + 3];
    rec.ext = parts[pi + 4];
  } else if (pi !== -1 && parts.length >= pi + 2) {
    rec.date = parts[pi + 1]; // flat date-bucketed (drivecheck) form
  }
  // filename: {load}_{type}_{n}.pdf
  var base = file.replace(/\.pdf$/i, '');
  var fp = base.split('_');
  if (fp.length >= 3) {
    rec.n = fp[fp.length - 1];
    rec.docType = fp.slice(1, fp.length - 1).join('_');
  }
  return rec;
}

var rows = lines.map(parseRow);
var real = rows.filter(function (r) { return r.klass === 'real'; });

function tally(arr, key) {
  var m = {};
  arr.forEach(function (r) { var k = r[key] || '(none)'; m[k] = (m[k] || 0) + 1; });
  return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; })
    .map(function (k) { return [k, m[k]]; });
}

var summary = {
  csv: csvPath,
  totalRows: rows.length,
  byClass: tally(rows, 'klass'),
  real: real.length,
  byDocType: tally(real, 'docType'),
  distinctLoads: Object.keys(real.reduce(function (a, r) { if (r.load) a[r.load] = 1; return a; }, {})).length,
  distinctExts: tally(real, 'ext').length,
  topExts: tally(real, 'ext').slice(0, 12),
  byWho: tally(real, 'who').slice(0, 12),
  dateRange: (function () {
    var ds = real.map(function (r) { return r.date; }).filter(Boolean).sort();
    return ds.length ? [ds[0], ds[ds.length - 1]] : [];
  })()
};

fs.writeFileSync(path.join(__dirname, 'out', 'emails-normalized.json'),
  JSON.stringify({ summary: summary, rows: real }, null, 2));

console.log(JSON.stringify(summary, null, 2));
console.log('\nNormalized ' + real.length + ' real docs -> out/emails-normalized.json');
