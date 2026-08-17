#!/usr/bin/env node
// generate-snapshot.js — dump all jrec:perportal:* records to JSON for the MEP.
// Read-only. Shells libertyville's inspect.js and parses its output.
// Author: senath gen-14, 2026-08-07
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const INSPECT = 'c:/clients/libertyville/bin/inspect.js';

function inspect(pattern) {
  return execFileSync('node', [INSPECT, pattern], { encoding: 'utf8', timeout: 30000 });
}

// list keys
const listOut = inspect('jrec:perportal:*');
const keys = [...listOut.matchAll(/(jrec:perportal:\S+)/g)].map(m => m[1])
  .filter((k, i, a) => a.indexOf(k) === i && !k.includes('*'));

const records = [];
for (const key of keys) {
  const out = inspect(key);
  const rec = { key, fields: {}, scopes: [] };
  for (const line of out.split('\n')) {
    const m = line.match(/^  (\S+)\s+(.+)$/);
    if (!m) continue;
    const [, field, raw] = m;
    if (field.startsWith('scope_')) {
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch (e) { parsed = { unparsed: raw }; }
      rec.scopes.push({ field, companyId: field.replace('scope_', ''), ...parsed });
    } else {
      rec.fields[field] = raw;
    }
  }
  const parts = key.split(':');
  rec.dataset = parts[2];
  rec.prostan8 = parts[3];
  records.push(rec);
}

const snapshot = {
  generatedAt: new Date().toISOString(),
  source: 'ElastiCache db8 via libertyville inspect.js (read-only)',
  recordCount: records.length,
  records
};
const outPath = path.join(__dirname, 'data', 'perportal-snapshot.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
console.log('wrote ' + outPath + ' — ' + records.length + ' records');
