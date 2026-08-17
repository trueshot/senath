#!/usr/bin/env node
// cleanup-perportal-sendborn.js — delete send-born perportal pollution.
// George's GO 2026-08-07 (seed list approved on the senath MEP: green/blue
// migrate, red drops). Rules, derived from LIVE data at run time:
//   1. Every scope_<CO> field whose payload has source:'send' is DELETED.
//   2. If a record then has ZERO scope_ fields AND no nashville_* identity
//      fields, the whole key is DELETED (send-birth created the record;
//      nothing legitimate remains — includes 4tdh4tli/Susi and the
//      no-identity records).
//   3. Records with registration/invite/vernal-qa scopes are NEVER touched
//      beyond rule 1. QA rows keep everything (their scopes are clean-born).
// Safety: full HGETALL backup of every touched record BEFORE any write,
// to tools/backups/. DRY-RUN by default; --live to execute.
// Connects like libertyville inspect.js: redingtonbeach proxy 127.0.0.1:16379 -> db 8.
// Author: senath gen-14, 2026-08-07
'use strict';
const path = require('path');
const fs = require('fs');
const Redis = require(path.join('c:/clients/libertyville', 'node_modules', 'ioredis'));

const LIVE = process.argv.includes('--live');

async function main() {
  const redis = new Redis({ port: 16379, host: '127.0.0.1', db: 8 });
  const keys = await redis.keys('jrec:perportal:*');
  console.log((LIVE ? '[LIVE] ' : '[DRY-RUN] ') + keys.length + ' perportal records');

  const backup = {};
  const plan = [];

  for (const key of keys.sort()) {
    const h = await redis.hgetall(key);
    const scopeFields = Object.keys(h).filter(f => f.startsWith('scope_'));
    const sendScopes = [];
    let cleanScopes = 0;
    for (const f of scopeFields) {
      let src = null;
      try { src = JSON.parse(h[f]).source; } catch (e) {}
      if (src === 'send') sendScopes.push(f); else cleanScopes++;
    }
    if (!sendScopes.length) continue;  // untouched
    backup[key] = h;
    const hasIdentity = Object.keys(h).some(f => f.startsWith('nashville_'));
    if (cleanScopes === 0 && !hasIdentity) {
      plan.push({ key, action: 'DEL-KEY', reason: sendScopes.length + ' send scopes, 0 clean, no identity', fields: null });
    } else {
      plan.push({ key, action: 'HDEL', reason: 'drop ' + sendScopes.length + ' send scopes, keep ' + cleanScopes + ' clean', fields: sendScopes });
    }
  }

  for (const p of plan) {
    console.log('  ' + p.action + '  ' + p.key + '  (' + p.reason + ')'
      + (p.fields ? '\n        fields: ' + p.fields.join(', ') : ''));
  }
  console.log(plan.length + ' records to touch; ' + (keys.length - plan.length) + ' untouched');

  if (!plan.length) { redis.quit(); return; }

  const bdir = path.join(__dirname, 'backups');
  fs.mkdirSync(bdir, { recursive: true });
  const bfile = path.join(bdir, 'perportal-backup-' + new Date().toISOString().replace(/[:.]/g, '-') + (LIVE ? '-LIVE' : '-DRY') + '.json');
  fs.writeFileSync(bfile, JSON.stringify({ takenAt: new Date().toISOString(), live: LIVE, records: backup }, null, 2));
  console.log('backup written: ' + bfile);

  if (LIVE) {
    for (const p of plan) {
      if (p.action === 'DEL-KEY') {
        await redis.del(p.key);
        console.log('  DELETED ' + p.key);
      } else {
        await redis.hdel(p.key, ...p.fields);
        console.log('  HDEL ' + p.fields.length + ' fields from ' + p.key);
      }
    }
    console.log('CLEANUP COMPLETE.');
  } else {
    console.log('Dry-run only. Re-run with --live to execute.');
  }
  redis.quit();
}
main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
