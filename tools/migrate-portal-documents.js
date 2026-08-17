#!/usr/bin/env node
// migrate-portal-documents.js — the one-time physical migration (George's
// "migrate", 2026-08-07). For every outgoing/<CO>/:
//   - apron-paired files (documents) + their aprons MOVE into documents/
//   - orphan *.thumbnail.* sidecars MOVE into appdata/ (derived files)
//   - anything else apron-less is LEFT IN PLACE and reported (unknown class)
//   - documents/_manifest.json REBUILT from directory truth (absence-
//     preserving entries; no merge — stale dir:'.' entries must die here)
// Then outgoing/_portals.json is rebuilt.
// Renames are same-volume (fast, atomic-ish). Idempotent: re-run safe.
// USAGE: --dry-run | --only <CO> | --base <path>
// Author: senath gen-14, 2026-08-07
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function arg(n, fb) { const i = args.indexOf('--' + n); return i !== -1 && args[i + 1] ? args[i + 1] : fb; }
const DRY = args.includes('--dry-run');
const ONLY = arg('only', null);
const BASE = arg('base', '//15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing');

function parseName(f) {
  const m = f.match(/^(\d{8})_([^_]+)_([^_]+)_(.+)\.[^.]+$/);
  if (!m) return { date: '', who: '', ext: '', stem: f };
  return { date: m[1], who: m[2], ext: m[3], stem: m[4] };
}

function entryFor(dirPath, f, dirLabel) {
  let apron = {};
  const finalExtAt = f.lastIndexOf('.');
  const apronName = f.slice(0, finalExtAt) + '.email.json';
  try { apron = JSON.parse(fs.readFileSync(path.join(dirPath, apronName), 'utf8')); } catch (e) {}
  const p = parseName(f);
  const e = {
    file: f, dir: dirLabel,
    docType: apron.docType || 'document',
    docName: apron.docName || p.stem,
    load: apron.load || '', deal: apron.deal || '',
    date: p.date, who: p.who, ext: p.ext,
    when: apron.sentAt || apron.generatedAt || apron.droppedAt || null
  };
  for (const k of ['ownerSource', 'sentAt', 'generatedAt', 'droppedAt', 'sendCount',
                   'generationCount', 'dropCount', 'generatedBy', 'droppedBy']) {
    if (apron[k] !== undefined) e[k] = apron[k];
  }
  if (apron.recipients !== undefined) e.recipients = apron.recipients.map(r => r.email);
  return e;
}

function main() {
  let companies = fs.readdirSync(BASE).filter(n => {
    if (n.startsWith('_')) return false;
    try { return fs.statSync(path.join(BASE, n)).isDirectory(); } catch (e) { return false; }
  });
  if (ONLY) companies = companies.filter(c => c === ONLY);
  console.log((DRY ? '[DRY-RUN] ' : '') + companies.length + ' companies');

  const rollup = [];
  let movedDocs = 0, movedSidecars = 0, leftUnknown = 0;

  for (const co of companies) {
    const coDir = path.join(BASE, co);
    const docsDir = path.join(coDir, 'documents');
    const appDir = path.join(coDir, 'appdata');
    let flat;
    try { flat = fs.readdirSync(coDir); } catch (e) { continue; }
    const flatSet = new Set(flat);
    const moves = [];   // [from, to, kind]

    for (const f of flat) {
      if (f.startsWith('_') || f === 'documents' || f === 'appdata' || f === 'access' || f.endsWith('.tmp')) continue;
      try { if (fs.statSync(path.join(coDir, f)).isDirectory()) continue; } catch (e) { continue; }
      if (f.endsWith('.email.json')) continue; // moved with its document
      const finalExtAt = f.lastIndexOf('.');
      if (finalExtAt === -1) { leftUnknown++; continue; }
      const apronName = f.slice(0, finalExtAt) + '.email.json';
      if (flatSet.has(apronName)) {
        moves.push([f, path.join(docsDir, f), 'doc']);
        moves.push([apronName, path.join(docsDir, apronName), 'apron']);
      } else if (/\.thumbnail\.[^.]+$/i.test(f)) {
        moves.push([f, path.join(appDir, f), 'sidecar']);
      } else {
        console.log('  LEFT (no apron, unknown class): ' + co + '/' + f);
        leftUnknown++;
      }
    }

    if (!DRY && moves.length) {
      if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
      if (moves.some(m => m[2] === 'sidecar') && !fs.existsSync(appDir)) fs.mkdirSync(appDir);
      for (const [f, to, kind] of moves) {
        try {
          fs.renameSync(path.join(coDir, f), to);
          if (kind === 'doc') movedDocs++; else if (kind === 'sidecar') movedSidecars++;
        } catch (e) { console.log('  MOVE FAILED ' + co + '/' + f + ': ' + e.message); }
      }
    } else {
      movedDocs += moves.filter(m => m[2] === 'doc').length;
      movedSidecars += moves.filter(m => m[2] === 'sidecar').length;
    }

    // rebuild manifest from directory truth (documents/ only now)
    let counts = { total: 0 }, lastWhen = null;
    if (!DRY) {
      const entries = {};
      let docFiles = [];
      try { docFiles = fs.readdirSync(docsDir); } catch (e) {}
      const dSet = new Set(docFiles);
      for (const f of docFiles) {
        if (f.startsWith('_') || f.endsWith('.email.json') || f.endsWith('.tmp')) continue;
        const fe = f.lastIndexOf('.');
        if (fe === -1) continue;
        if (!dSet.has(f.slice(0, fe) + '.email.json')) continue;
        const e = entryFor(docsDir, f, 'documents');
        entries[f] = e;
        counts.total++;
        const os = e.ownerSource || 'unknown';
        counts[os] = (counts[os] || 0) + 1;
        if (e.when && (!lastWhen || e.when > lastWhen)) lastWhen = e.when;
      }
      const manifest = { companyId: co, updatedAt: new Date().toISOString(),
        migratedAt: new Date().toISOString(), counts, entries };
      const mPath = path.join(docsDir, '_manifest.json');
      fs.writeFileSync(mPath + '.tmp', JSON.stringify(manifest, null, 2));
      fs.renameSync(mPath + '.tmp', mPath);
    }
    rollup.push({ companyId: co, documents: counts.total, lastSentAt: lastWhen });
    console.log('  ' + co + ': ' + moves.filter(m => m[2] === 'doc').length + ' docs moved, '
      + moves.filter(m => m[2] === 'sidecar').length + ' sidecars -> appdata'
      + (DRY ? '' : ', manifest rebuilt (' + counts.total + ')'));
  }

  if (!DRY && !ONLY) {
    const portals = {
      generatedAt: new Date().toISOString(),
      base: BASE,
      note: 'Regime A rollup — rebuildable index. Migrated layout: all documents under documents/.',
      totals: { portals: rollup.length, documents: rollup.reduce((s, r) => s + r.documents, 0) },
      portals: rollup.sort((a, b) => (b.lastSentAt || '') < (a.lastSentAt || '') ? -1 : 1)
    };
    const pPath = path.join(BASE, '_portals.json');
    fs.writeFileSync(pPath + '.tmp', JSON.stringify(portals, null, 2));
    fs.renameSync(pPath + '.tmp', pPath);
    console.log('rollup rebuilt: ' + portals.totals.portals + ' portals, ' + portals.totals.documents + ' documents');
  }
  console.log('SUMMARY: ' + movedDocs + ' documents moved, ' + movedSidecars + ' sidecars to appdata, '
    + leftUnknown + ' left in place (unknown class)');
}
main();
