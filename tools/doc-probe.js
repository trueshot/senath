#!/usr/bin/env node
// doc-probe.js — For a CAPPED, explicit set of normalized rows, do TARGETED
// single-file reads to recover each doc's company + classify its legacy state.
// NEVER lists or walks a directory. Author: senath gen-9, 2026-06-27.
//
// Usage:
//   node doc-probe.js [--limit N] [--type bol|invoice|...] [--base UNC]
// Reads:  ./out/emails-normalized.json
// Writes: ./out/probed.json
//
// Per doc it reads at most two files, at fully-known paths:
//   email/{n}.json  -> company state (none | minimal-legacy | full-modern), recipient
//   {load}_{type}_{n}.htm -> consignee span = the UNIVERSAL company-name source
//
// Legacy states discovered 2026-06-27:
//   state1 NO_JSON   : printed, no email/{n}.json at all (pure legacy / print-only)
//   state2 MINIMAL   : email json without companyId/pulpId (legacy email path)
//   state3 MODERN    : email json WITH companyId/pulpId (modern path; in portal)

var fs = require('fs');
var path = require('path');

var args = process.argv.slice(2);
function opt(name, def) { var i = args.indexOf(name); return i !== -1 ? args[i + 1] : def; }
var LIMIT = parseInt(opt('--limit', '40'), 10);
var TYPE = opt('--type', null);
var BASE = opt('--base', '//15.30.60.44/hawk/d/clients/willis/loads/prnthist');

var data = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'emails-normalized.json'), 'utf8'));
var rows = data.rows.filter(function (r) { return r.load && r.date && r.who && r.ext; });
if (TYPE) rows = rows.filter(function (r) { return r.docType === TYPE; });
rows = rows.slice(0, LIMIT);

function dir(r) { return BASE + '/' + r.load + '/' + r.date + '/' + r.who + '/' + r.ext; }
function readIf(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }
function consignee(htm) {
  if (!htm) return null;
  var m = htm.match(/id="consignee"[^>]*>([^<]+)/i) || htm.match(/id="id_name"[^>]*>([^<]+)/i);
  return m ? m[1].trim() : null;
}

var out = rows.map(function (r) {
  var d = dir(r);
  var ej = readIf(d + '/email/' + r.n + '.json');
  var state = 'NO_JSON', recipient = null, companyId = null;
  if (ej) {
    try {
      var j = JSON.parse(ej);
      recipient = j.email || null;
      companyId = j.companyId || null;
      state = companyId ? 'MODERN' : 'MINIMAL';
    } catch (e) { state = 'JSON_PARSE_ERR'; }
  }
  var htm = readIf(d + '/' + r.file.replace(/\.pdf$/i, '.htm'));
  return {
    load: r.load, date: r.date, who: r.who, ext: r.ext, docType: r.docType, n: r.n,
    state: state, recipient: recipient, companyId: companyId,
    consignee: consignee(htm),
    apronName: r.date + '_' + r.who + '_' + r.ext + '_' + r.file.replace(/\.pdf$/i, '')
  };
});

function tally(arr, key) {
  var m = {}; arr.forEach(function (r) { var k = r[key] || '(none)'; m[k] = (m[k] || 0) + 1; });
  return Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).map(function (k) { return [k, m[k]]; });
}

var summary = {
  probed: out.length, base: BASE,
  byState: tally(out, 'state'),
  byConsignee: tally(out, 'consignee').slice(0, 15),
  consigneeRecoveryRate: out.filter(function (r) { return r.consignee; }).length + '/' + out.length
};
fs.writeFileSync(path.join(__dirname, 'out', 'probed.json'), JSON.stringify({ summary: summary, docs: out }, null, 2));
console.log(JSON.stringify(summary, null, 2));
