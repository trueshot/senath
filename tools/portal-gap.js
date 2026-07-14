#!/usr/bin/env node
// portal-gap.js — For one company, compute which printed docs (from probed.json)
// are MISSING from its canopylake out-box. Does ONE directory listing (the
// company's outgoing folder) and a membership test by apron-name. No prnthist
// walk. Author: senath gen-9, 2026-06-27.
//
// Usage:
//   node portal-gap.js --company INGLES --consignee "Ingles Markets" \
//                      [--outgoing UNC-base-to-outgoing]
// Reads:  ./out/probed.json   (run doc-probe.js first; for a full gap, probe all)
// Writes: ./out/gap-<company>.json
//
// Apron-name convention (portland): {date}_{who}_{ext}_{stem}.pdf — the same
// name copyPdfToCanopylake writes today, so membership is a deterministic test.

var fs = require('fs');
var path = require('path');
var args = process.argv.slice(2);
function opt(n, d) { var i = args.indexOf(n); return i !== -1 ? args[i + 1] : d; }

var COMPANY = opt('--company', 'INGLES');
var CONSIGNEE = (opt('--consignee', 'Ingles') || '').toLowerCase();
var OUT = opt('--outgoing',
  '//15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing');

var probed = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'probed.json'), 'utf8')).docs;
var mine = probed.filter(function (d) {
  return (d.companyId === COMPANY) ||
         (d.consignee && d.consignee.toLowerCase().indexOf(CONSIGNEE) !== -1);
});

// ONE listing of the company out-box
var present = {};
try {
  fs.readdirSync(OUT + '/' + COMPANY).forEach(function (f) { present[f.toLowerCase()] = 1; });
} catch (e) {
  console.error('NOTE: could not list ' + OUT + '/' + COMPANY + ' (' + e.code + ') — treating as empty');
}

var missing = [], inPortal = [];
mine.forEach(function (d) {
  var name = (d.apronName + '.pdf').toLowerCase();
  (present[name] ? inPortal : missing).push(d);
});

var result = {
  company: COMPANY, consigneeMatch: CONSIGNEE,
  probedTotal: probed.length, matchedToCompany: mine.length,
  inPortal: inPortal.length, missing: missing.length,
  missingByState: missing.reduce(function (a, d) { a[d.state] = (a[d.state] || 0) + 1; return a; }, {}),
  missingDocs: missing.map(function (d) {
    return { load: d.load, date: d.date, type: d.docType, state: d.state, apronName: d.apronName };
  })
};
fs.writeFileSync(path.join(__dirname, 'out', 'gap-' + COMPANY + '.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({
  company: result.company, matchedToCompany: result.matchedToCompany,
  inPortal: result.inPortal, missing: result.missing, missingByState: result.missingByState
}, null, 2));
console.log('\nFull gap -> out/gap-' + COMPANY + '.json');
