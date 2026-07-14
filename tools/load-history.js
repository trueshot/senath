#!/usr/bin/env node
// load-history.js — Full document-delivery history for a load, in one shot.
//
// Answers "what happened to every document on load N" without flailing:
// walks prnthist/<load>/ once and prints, per document, whether the PDF was
// made, whether it was emailed, to whom, and flags the problems that make a
// send fail (missing PDF = wkhtmltopdf failure; malformed recipient email;
// print-only / never emailed).
//
//   node load-history.js <load> [--dataset willis] [--json]
//
// Resolves the dataset to its prey/drive via the dataset API, so it works for
// any dataset, then reads over the bridgeport SMB bridge. One traversal.
//
// Author: senath gen-10

const fs = require('fs');
const http = require('http');
const path = require('path');

const args = process.argv.slice(2);
const load = args.find(a => !a.startsWith('--'));
const dataset = (args.find(a => a.startsWith('--dataset=')) || '--dataset=willis').split('=')[1];
const asJson = args.includes('--json');
const BRIDGE = (args.find(a => a.startsWith('--bridge=')) || '--bridge=15.30.60.44').split('=')[1];
const RESOLVER = 'http://15.30.60.40:3800/datasets/';

if (!load) {
  console.error('usage: node load-history.js <load> [--dataset willis] [--json]');
  process.exit(1);
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// Same validity test SES applies in spirit: something@something.tld
function emailValid(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '')); }

function fmtSize(b) { return b == null ? '-' : (b < 1024 ? b + 'B' : Math.round(b / 1024) + 'K'); }
function mtime(p) { try { return fs.statSync(p).mtime.toISOString().replace('T', ' ').slice(0, 19); } catch (e) { return null; } }
function size(p) { try { return fs.statSync(p).size; } catch (e) { return null; } }

async function main() {
  const t0 = Date.now();
  let info;
  try { info = await getJson(RESOLVER + dataset); }
  catch (e) { console.error('dataset resolve failed for "' + dataset + '": ' + e.message); process.exit(1); }

  const drive = String(info.drive || 'D').toLowerCase();
  const dir = String(info.directory || ('/CLIENTS/' + dataset.toUpperCase() + '/')).toLowerCase();
  const base = `//${BRIDGE}/${info.server}/${drive}${dir}loads/prnthist/${load}`.replace(/\/+/g, '/').replace(/^\//, '//');

  if (!fs.existsSync(base)) {
    console.error(`No prnthist for load ${load} on ${dataset} (${info.server}:${info.drive}).\n  looked: ${base}`);
    process.exit(2);
  }

  // One recursive walk. Structure: <date>/<who>/<ext>/{stem_N.htm, .pdf, .pdf.thumbnail.png, email/N.json}
  const rows = [];
  for (const date of fs.readdirSync(base)) {
    const dDir = path.join(base, date);
    if (!fs.statSync(dDir).isDirectory()) continue;
    for (const who of fs.readdirSync(dDir)) {
      const wDir = path.join(dDir, who);
      if (!fs.statSync(wDir).isDirectory()) continue;
      for (const ext of fs.readdirSync(wDir)) {
        const xDir = path.join(wDir, ext);
        if (!fs.statSync(xDir).isDirectory()) continue;
        const files = fs.readdirSync(xDir);
        const emailDir = path.join(xDir, 'email');
        const emails = fs.existsSync(emailDir) ? fs.readdirSync(emailDir) : [];
        // group by doc number N (the trailing _<N> on the stem; email json is <N>.json)
        const ns = new Set();
        files.forEach(f => { const m = f.match(/_(\d+)\.(htm|pdf)$/i); if (m) ns.add(m[1]); });
        emails.forEach(f => { const m = f.match(/^(\d+)\.json$/i); if (m) ns.add(m[1]); });
        for (const n of [...ns].sort((a, b) => +a - +b)) {
          const stem = (files.find(f => f.match(new RegExp('_' + n + '\\.(htm|pdf)$', 'i'))) || `?_${n}.x`).replace(/\.(htm|pdf)$/i, '');
          const htmP = path.join(xDir, stem + '.htm');
          const pdfP = path.join(xDir, stem + '.pdf');
          const jsonP = path.join(emailDir, n + '.json');
          let mail = null;
          if (fs.existsSync(jsonP)) { try { mail = JSON.parse(fs.readFileSync(jsonP, 'utf8')); } catch (e) { mail = { _parseError: e.message }; } }
          rows.push({
            date, who, ext, n, stem,
            htm: fs.existsSync(htmP),
            pdf: fs.existsSync(pdfP) ? { size: size(pdfP), mtime: mtime(pdfP) } : null,
            when: mtime(pdfP) || mtime(htmP),
            emailed: !!mail,
            to: mail && mail.email, subject: mail && mail.subject,
            company: mail && (mail.companyId + (mail.companyName ? '/' + mail.companyName : '')),
            abc: mail && mail.abc,
            emailOk: mail ? emailValid(mail.email) : null
          });
        }
      }
    }
  }
  rows.sort((a, b) => String(a.when).localeCompare(String(b.when)));

  if (asJson) { console.log(JSON.stringify({ load, dataset, base, rows }, null, 2)); return; }

  console.log(`\nLoad ${load}  (${dataset} @ ${info.server}:${info.drive})  —  ${rows.length} document(s)`);
  console.log(base);
  console.log('-'.repeat(100));
  console.log('when               who/ext        doc            pdf    emailed→recipient');
  console.log('-'.repeat(100));
  const problems = [];
  for (const r of rows) {
    const pdf = r.pdf ? fmtSize(r.pdf.size) : 'MISSING';
    let mailcol;
    if (!r.emailed) mailcol = '(print-only — not emailed)';
    else if (!r.emailOk) mailcol = `BAD ADDR → ${r.to}`;
    else mailcol = `→ ${r.to}`;
    console.log(
      `${(r.when || '?').padEnd(19)}${(r.who + '/' + r.ext).padEnd(15)}${r.stem.padEnd(15)}${pdf.padEnd(7)}${mailcol}`
    );
    if (!r.pdf) problems.push(`${r.stem} (${r.who}/${r.date}): NO PDF — wkhtmltopdf failed (savoy)`);
    if (r.emailed && !r.emailOk) problems.push(`${r.stem} (${r.who}/${r.date}): malformed recipient "${r.to}" — SES will reject (upstream: email-window→json, pullman/savoy)`);
  }
  console.log('-'.repeat(100));
  const sent = rows.filter(r => r.emailed && r.emailOk).length;
  const printOnly = rows.filter(r => !r.emailed).length;
  const badAddr = rows.filter(r => r.emailed && !r.emailOk).length;
  const noPdf = rows.filter(r => !r.pdf).length;
  console.log(`sent-able: ${sent}   print-only: ${printOnly}   bad-address: ${badAddr}   missing-pdf: ${noPdf}`);
  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ! ' + p)); }
  console.log(`\n(${Date.now() - t0}ms; send OUTCOME per doc isn't recoverable — sendemail_last.log is overwritten per send. Live outcome: watch that log on the next send.)`);
}

main().catch(e => { console.error(e); process.exit(1); });
