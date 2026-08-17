#!/usr/bin/env node
// build-portal-manifests.js — one-time backfill + repair sweep for the
// three-areas manifest layer (George GO 2026-08-07).
//
// For every outgoing/<CO>/: creates documents/, builds/merges
// documents/_manifest.json from the EXISTING files + aprons (folder is truth,
// manifest is index), and writes outgoing/_portals.json (dataset rollup).
// Files are NOT moved — entries carry dir:'.' for flat legacy files,
// dir:'documents' for post-flip files. The physical migration sweep is a
// separate, later step (proposal §11).
//
// Classification: FILE-CLASSES rule — a file is a DOCUMENT iff a paired
// apron (<base>.email.json) exists. No apron => sidecar/appdata-class,
// counted but not indexed as a document.
//
// USAGE
//   node build-portal-manifests.js --dry-run            # report only
//   node build-portal-manifests.js --only MELOND        # one company
//   node build-portal-manifests.js                      # full sweep, writes
//   --base <path>   default: willis bridge outgoing path
//
// Author: senath gen-14, 2026-08-07 (George's GO, on record this session)
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const DRY = args.includes('--dry-run');
const ONLY = arg('only', null);
const BASE = arg('base',
  '//15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing');

function parseName(f) {
  // {date}_{who}_{ext}_{stem}.<realext>
  const m = f.match(/^(\d{8})_([^_]+)_([^_]+)_(.+)\.[^.]+$/);
  if (!m) return { date: '', who: '', ext: '', stem: f };
  return { date: m[1], who: m[2], ext: m[3], stem: m[4] };
}

function indexDir(dirPath, dirLabel, entries, stats) {
  let files;
  try { files = fs.readdirSync(dirPath); } catch (e) { return; }
  const set = new Set(files);
  for (const f of files) {
    if (f.startsWith('_') || f.endsWith('.email.json') || f.endsWith('.tmp')) continue;
    const finalExtAt = f.lastIndexOf('.');
    if (finalExtAt === -1) continue;
    const apronName = f.slice(0, finalExtAt) + '.email.json';
    if (!set.has(apronName)) { stats.sidecars++; continue; } // FILE-CLASSES rule
    let apron = {};
    try { apron = JSON.parse(fs.readFileSync(path.join(dirPath, apronName), 'utf8')); }
    catch (e) { stats.badAprons++; }
    const p = parseName(f);
    // ABSENCE-PRESERVING (portland's catch, 2026-08-07): provenance fields
    // appear IFF the apron carries them — "recipients[] present IFF emailed"
    // must answer the same from manifest and apron. `when` is the one
    // display/sort convenience field (first available timestamp); provenance
    // consumers use the verbatim fields, display consumers use `when`.
    const e = {
      file: f,
      dir: dirLabel,
      docType: apron.docType || 'document',
      docName: apron.docName || p.stem,
      load: apron.load || '',
      deal: apron.deal || '',
      date: p.date, who: p.who, ext: p.ext,
      when: apron.sentAt || apron.generatedAt || apron.droppedAt || null
    };
    if (apron.ownerSource !== undefined) e.ownerSource = apron.ownerSource;
    if (apron.sentAt !== undefined) e.sentAt = apron.sentAt;
    if (apron.generatedAt !== undefined) e.generatedAt = apron.generatedAt;
    if (apron.droppedAt !== undefined) e.droppedAt = apron.droppedAt;
    if (apron.recipients !== undefined) e.recipients = apron.recipients.map(r => r.email);
    if (apron.sendCount !== undefined) e.sendCount = apron.sendCount;
    if (apron.generationCount !== undefined) e.generationCount = apron.generationCount;
    if (apron.dropCount !== undefined) e.dropCount = apron.dropCount;
    if (apron.generatedBy !== undefined) e.generatedBy = apron.generatedBy;
    if (apron.droppedBy !== undefined) e.droppedBy = apron.droppedBy;
    entries[f] = e;
    stats.docs++;
  }
}

function main() {
  let companies;
  try { companies = fs.readdirSync(BASE).filter(n => {
    if (n.startsWith('_')) return false;
    try { return fs.statSync(path.join(BASE, n)).isDirectory(); } catch (e) { return false; }
  }); } catch (e) {
    console.error('FATAL: cannot read base ' + BASE + ': ' + e.message);
    process.exit(1);
  }
  if (ONLY) companies = companies.filter(c => c === ONLY);
  console.log((DRY ? '[DRY-RUN] ' : '') + companies.length + ' company folders under ' + BASE);

  const rollup = [];
  for (const co of companies) {
    const coDir = path.join(BASE, co);
    const stats = { docs: 0, sidecars: 0, badAprons: 0 };
    const entries = {};
    indexDir(coDir, '.', entries, stats);                       // legacy flat
    indexDir(path.join(coDir, 'documents'), 'documents', entries, stats); // post-flip
    // merge with any live-written manifest (idempotent, keyed by filename;
    // live entries win — they are fresher than a sweep)
    // ⚠ NO-PRUNE (senath gen-16, 2026-08-12): this overlay copies EVERY prior
    // entry forward unconditionally, so an entry whose file was DELETED is
    // preserved as a PHANTOM (the folder scan can't produce it, but this merge
    // re-injects it). A deletion from a portal folder must therefore be paired
    // with a prune of its manifest entry, else the portal lists a doc that 404s.
    // Repair tool: tools/prune-manifest-phantoms.js (direct-stat, ENOENT-only).
    const docsDir = path.join(coDir, 'documents');
    const mPath = path.join(docsDir, '_manifest.json');
    try {
      const existing = JSON.parse(fs.readFileSync(mPath, 'utf8'));
      for (const k of Object.keys(existing.entries || {})) entries[k] = existing.entries[k];
    } catch (e) {}
    const counts = { total: 0 };
    let lastSentAt = null;
    for (const k of Object.keys(entries)) {
      counts.total++;
      const os = entries[k].ownerSource || 'unknown';
      counts[os] = (counts[os] || 0) + 1;
      if (entries[k].sentAt && (!lastSentAt || entries[k].sentAt > lastSentAt)) lastSentAt = entries[k].sentAt;
    }
    const manifest = { companyId: co, updatedAt: new Date().toISOString(),
      rebuiltBySweep: true, counts, entries };
    console.log('  ' + co + ': ' + counts.total + ' docs, ' + stats.sidecars +
      ' sidecars skipped' + (stats.badAprons ? ', ' + stats.badAprons + ' bad aprons' : ''));
    if (!DRY) {
      if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);
      const tmp = mPath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2));
      fs.renameSync(tmp, mPath);
    }
    rollup.push({ companyId: co, documents: counts.total, lastSentAt });
  }
  rollup.sort((a, b) => (b.lastSentAt || '') < (a.lastSentAt || '') ? -1 : 1);
  const portals = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    note: 'Regime A rollup — rebuildable index, repaired by this sweep. Operator-level; no partner LINK targets outgoing/ root.',
    totals: { portals: rollup.length, documents: rollup.reduce((s, r) => s + r.documents, 0) },
    portals: rollup
  };
  if (!DRY && !ONLY) {
    const pPath = path.join(BASE, '_portals.json');
    fs.writeFileSync(pPath + '.tmp', JSON.stringify(portals, null, 2));
    fs.renameSync(pPath + '.tmp', pPath);
    console.log('rollup written: ' + pPath);
  }
  console.log('TOTALS: ' + portals.totals.portals + ' portals, ' + portals.totals.documents + ' documents');
}
main();
