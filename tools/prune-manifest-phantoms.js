#!/usr/bin/env node
// prune-manifest-phantoms.js — audit/repair for phantom manifest entries.
//
// WHY: build-portal-manifests.js (the sweep) MERGE-PRESERVES the prior manifest
// (lines 107-114: `for k of existing.entries: entries[k] = existing.entries[k]`)
// so it NEVER prunes an entry whose file was deleted. Every past deletion
// (e.g. the gen-15 double-wrap cleanups in FARMER/MELONO) therefore leaves a
// PHANTOM entry — a document the portal lists but that 404s on click, because
// the bytes are gone. The phantom persists only by being copied forward from
// the prior manifest; remove it once and there is no file to re-derive it from,
// so it stays gone. A wrongly-pruned REAL entry is self-healing — the next
// build-portal-manifests.js run rebuilds it from its folder+apron.
//
// TRUTH DISCIPLINE: existence is decided by a DIRECT statSync on the exact
// file path (NOT a directory enumeration — those lag through the S3 gateway).
// Only ENOENT/ENOTDIR counts as "missing." Any other stat error (EACCES,
// network) is treated as UNCERTAIN and never pruned.
//
// USAGE
//   node prune-manifest-phantoms.js                 # audit all portals (read-only)
//   node prune-manifest-phantoms.js --only FARMER   # one company
//   node prune-manifest-phantoms.js --fix           # remove confirmed phantoms
//   --base <path>   default: willis bridge outgoing path
//
// Author: senath gen-16, 2026-08-12
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf('--' + name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const FIX = args.includes('--fix');
const ONLY = arg('only', null);
const BASE = arg('base',
  '//15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing');

// Direct-stat existence: true=present, false=confirmed-missing, null=uncertain.
// Used ONLY to confirm a candidate the fast directory listing flagged — never
// per-entry (that is ~50ms/record over SMB and needlessly slow at scale).
function fileState(p) {
  try { fs.statSync(p); return true; }
  catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return false;
    return null; // EACCES / network / other — do NOT prune on uncertainty
  }
}

// One readdir per directory (cached). A directory listing can LAG through the
// S3 gateway and transiently omit a real file — so a listing-miss is only a
// CANDIDATE; fileState() confirms with a direct stat before anything is pruned.
function listing(cache, dirPath) {
  if (cache[dirPath]) return cache[dirPath];
  let set;
  try { set = new Set(fs.readdirSync(dirPath)); } catch (e) { set = null; }
  cache[dirPath] = set;
  return set;
}

function main() {
  let companies;
  try {
    companies = fs.readdirSync(BASE).filter(n => {
      if (n.startsWith('_')) return false;
      try { return fs.statSync(path.join(BASE, n)).isDirectory(); } catch (e) { return false; }
    });
  } catch (e) {
    console.error('FATAL: cannot read base ' + BASE + ': ' + e.message);
    process.exit(1);
  }
  if (ONLY) companies = companies.filter(c => c === ONLY);

  console.log((FIX ? '[FIX] ' : '[AUDIT] ') + companies.length + ' company folders under ' + BASE);
  let totalPhantom = 0, totalUncertain = 0, portalsWithPhantoms = 0, portalsFixed = 0;

  for (const co of companies) {
    const coDir = path.join(BASE, co);
    const mPath = path.join(coDir, 'documents', '_manifest.json');
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(mPath, 'utf8')); }
    catch (e) { continue; } // no manifest for this company — nothing to audit
    const entries = manifest.entries || {};
    const phantoms = [];
    const uncertain = [];
    const dirCache = {}; // one readdir per dir, per company
    for (const k of Object.keys(entries)) {
      const dir = entries[k].dir || '.';
      const dirPath = dir === '.' ? coDir : path.join(coDir, dir);
      const fpath = path.join(dirPath, entries[k].file);
      const set = listing(dirCache, dirPath);
      // In the fast listing? -> present, no stat needed. Missing (or dir
      // unreadable) -> CANDIDATE; confirm with a direct stat before pruning.
      if (set && set.has(entries[k].file)) continue;
      const st = fileState(fpath);
      if (st === false) phantoms.push(k);
      else if (st === null) uncertain.push(k);
      // st === true: listing lagged but file really exists — leave as-is.
    }
    if (uncertain.length) {
      totalUncertain += uncertain.length;
      console.log('  ? ' + co + ': ' + uncertain.length + ' UNCERTAIN (stat error, left as-is)');
    }
    if (!phantoms.length) continue;
    portalsWithPhantoms++;
    totalPhantom += phantoms.length;
    console.log('  ! ' + co + ': ' + phantoms.length + ' phantom(s) of ' +
      Object.keys(entries).length + ' entries');
    for (const k of phantoms) console.log('      - ' + k);

    if (FIX) {
      for (const k of phantoms) delete entries[k];
      const counts = { total: 0 };
      for (const k of Object.keys(entries)) {
        counts.total++;
        const os = entries[k].ownerSource || 'unknown';
        counts[os] = (counts[os] || 0) + 1;
      }
      manifest.counts = counts;
      manifest.entries = entries;
      manifest.updatedAt = new Date().toISOString();
      manifest.phantomsPrunedAt = manifest.updatedAt;
      manifest.phantomsPruned = (manifest.phantomsPruned || 0) + phantoms.length;
      const tmp = mPath + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2));
      fs.renameSync(tmp, mPath);
      portalsFixed++;
      console.log('      -> pruned, ' + counts.total + ' entries remain');
    }
  }

  console.log('---');
  console.log('TOTAL: ' + totalPhantom + ' phantom(s) across ' + portalsWithPhantoms +
    ' portal(s)' + (totalUncertain ? ', ' + totalUncertain + ' uncertain' : '') +
    (FIX ? '; ' + portalsFixed + ' manifest(s) rewritten' : ' (audit only — run --fix to prune)'));
}
main();
