#!/usr/bin/env node
// MAINTAIN: Before updating this file, audit what exists:
//   1. ls c:/clients/nimbus/corporals/senath/library/
//   2. Run each facet — verify content matches reality
//   3. Document every mode — what EXISTS, not what you remember
//
// RESEARCH RULE: When you need to look something up — facets, who owns what,
// how something connects — QUERY THE FACET GRAPH. Don't grep, don't use
// facets.js show, don't cat library files.
//   node c:/clients/neoga/graph-add.js --db facets query "<cypher>"
// The graph is the source of truth. Use it.
//
// Author: senath gen-3

var fs = require('fs');
var path = require('path');
var args = process.argv.slice(2);
var libraryDir = path.join(__dirname, 'library');

var facetMap = {
  '--facet-access-layer':      { file: 'access-layer.md',      desc: 'Portal cache as anonymous access layer' },
  '--facet-company-ledger':    { file: 'company-ledger.md',     desc: 'Company cache accumulation + discovery' },
  '--facet-journey-metadata':  { file: 'journey-metadata.md',   desc: 'Conversion tracking for SeedDrop' },
  '--facet-prnthist-bridge':   { file: 'prnthist-bridge.md',    desc: 'How portal cache references document storage' },
  '--facet-identity-check':    { file: 'identity-check.md',     desc: 'Monkey:3006 partner check — the fork' },
  '--facet-template-handoff':  { file: 'template-handoff.md',   desc: 'Contract with emsworth (emailTemplate.js)' },
  '--facet-emailprt-dbf':      { file: 'emailprt-dbf.md',      desc: 'EMAILPRT.DBF schema and i_emlpart integration' },
  '--facet-upstream-pipeline': { file: 'upstream-pipeline.md',  desc: '4-stage send pipeline (pullman -> senath)' },
  '--facet-simple-send':       { file: 'simple-send.md',       desc: 'Simple SES email — when you don\'t need the pipeline' },
  '--facet-server-topology':   { file: 'server-topology.md',   desc: 'Prey/Predator servers — where sendEmail.js runs' },
  '--facet-domain-selection':  { file: 'domain-selection.md',  desc: 'How the SES From address is chosen' },
  '--facet-graph-access':      { file: 'graph-access.md',      desc: 'How to read/write the facet graph (Cypher, sync, states)' },
  '--facet-portal-membrane':   { file: 'portal-membrane.md',   desc: 'Portal document-sharing structure — outgoing/incoming membrane (gen-8 status)' },
  '--facet-access-tiers':      { file: 'access-tiers.md',     desc: 'Three-tier access progression (gen-8, was 4): anonymous -> provisional -> individual' },
  '--facet-state-machine':     { file: 'state-machine.md',    desc: 'jrec library wiring (libertyville), portal + regjourney schemas, ElastiCache db 8' },
  '--facet-doc-delivery-failures': { file: 'doc-delivery-failures.md', desc: 'Triage map for "document email doesn\'t work" — 413, base64 inlining, image URLs, PDF gen chain' },
  '--facet-three-channels':    { file: 'three-channels.md',    desc: 'Estate / membrane / application-portal — how a SeedDrop entity touches the network (George 2026-06-10)' },
  '--facet-portal-wiring':     { file: 'portal-wiring.md',     desc: 'How a recipient gets wired to the out-box — two kinds of LINK, per-person prereq, option 1 (inode link) vs option 2 (read folder)' },
  '--facet-legacy-portal-backfill': { file: 'legacy-portal-backfill.md', desc: 'Including legacy/print docs in the portal — emails.csv index, 3 legacy states, EXACT blue-test invocation, HARTEE ongoing-gap evidence (senath gen-10)' },
  '--facet-email-tracking':    { file: 'email-tracking.md',    desc: 'Per-message SES delivery log (LIVE 2026-07-14) — CloudWatch, tags, email-lookup.js, what it honestly claims, AWS gotchas' },
  '--facet-pdf-attach':        { file: 'pdf-attach.md',        desc: 'Per-customer PDF attachment (LIVE 2026-07-16) — email-options.json switch, obj.attachPdf interface, multipart/mixed build' },
  '--facet-portal-status':     { file: 'portal-status.md',     desc: 'ARAPMAST.PORTAL flag + live tri-state route (LIVE 2026-07-24) — populate tool, sendEmail flag-write, detroit mount, HARD-WON GOTCHAS (ordhead ban, null-byte Edit trap, SMB scan latency)' },
  '--facet-invite-engine':     { file: 'invite-engine.md',     desc: 'sendInvite.js — the DELIBERATE invitation path (BUILT 2026-07-27): ratified contract, CLI surface, the identity FORK, template contract, and the PROVENANCE that ends the "should I build it?" stall' },
  '--facet-portal-utera':      { file: 'portal-utera-redesign-brief.md', desc: 'The gen-15 uTERA portal build (BUILT 2026-08-10, ruled INTERIM 08-15/16) — EXECUTION RESULTS still accurate as record-of-what-runs; SUPERSEDED as target by Job A (lincolnville JOB-A-CONTRACT.md, corp-level links) + canon link=inode-only. Read the supersession header first. As of 2026-08-17.' }
};

var facetNames = Object.keys(facetMap);

function usage() {
  console.log([
    '# Senath — Document Access Layer Builder',
    '',
    'I own sendEmail.js — the email engine that creates the anonymous',
    'access layer for ProduceFlow documents via portal cache files.',
    '',
    'Source: c:/clients/willdev/nodejs/sendEmail.js',
    '',
    '== What I Build ==',
    '',
    '  portal/cache/email/{emailToken}.json     Single-document access',
    '  portal/cache/company/{companyToken}.json  Multi-document company portal',
    '',
    '== RESEARCH: USE THE FACET GRAPH ==',
    '',
    '  When you need to look something up, query the facet graph:',
    '    node c:/clients/neoga/graph-add.js --db facets query "<cypher>"',
    '  Do NOT grep, do NOT use facets.js show, do NOT cat library files.',
    '  The graph is the source of truth.',
    '',
    '== Facets (domain knowledge) ==',
    '',
    '  node readme.js --facets               List all facets',
    '  node readme.js --facet-access-layer   Portal cache architecture',
    '  node readme.js --facet-identity-check Identity check mechanics',
    '',
    '== More ==',
    '',
    '  node readme.js --library   Library document index',
    '  node readme.js --tools     Procedures and debugging',
    '  node readme.js --json      Structured data for cr.js',
    '',
    '== Cruise ==',
    '',
    '  Mississippi — SeedDrop Step 1 (Document Delivery)',
    '  Downstream: Nashville register.html -> Atlanta verifyApi.js',
    '',
    '== Contact ==',
    '',
    '  DM senath'
  ].join('\n'));
}

function showFacet(name) {
  var entry = facetMap[name];
  if (!entry) {
    console.log('Unknown facet: ' + name);
    return;
  }
  var filepath = path.join(libraryDir, entry.file);
  try {
    console.log(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.log('Library file not found: ' + filepath);
  }
}

function showFacets() {
  var lines = ['senath — Document Access Layer Builder'];
  facetNames.forEach(function(name) {
    var entry = facetMap[name];
    var filepath = path.join(libraryDir, entry.file);
    var state = '(tbd)';
    try {
      var first = fs.readFileSync(filepath, 'utf8').split('\n')[0];
      if (first.indexOf('(verified)') !== -1) state = '(verified)';
      else if (first.indexOf('(unverified)') !== -1) state = '(unverified)';
    } catch(e) {}
    // Always emit at least 2 spaces — the facet-scan regex requires whitespace
    // between flag and (state). Long flag names (>28 chars) otherwise pad to "".
    var pad = '                            '.substring(name.length);
    if (pad.length < 2) pad = '  ';
    lines.push('  ' + name + pad + state + '  ' + entry.desc);
  });
  console.log(lines.join('\n'));
}

function showLibrary() {
  var indexPath = path.join(libraryDir, 'INDEX.md');
  try {
    console.log(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    console.log('No library index found.');
  }
}

function showTools() {
  console.log([
    '# Senath Tools & Procedures',
    '',
    '== Researching Anything — USE THE FACET GRAPH ==',
    '',
    '  node c:/clients/neoga/graph-add.js --db facets query "<cypher>"',
    '  Not grep. Not facets.js show. Not cat. The graph is the source of truth.',
    '',
    '== Investigating sendEmail.js Issues ==',
    '',
    '  1. Read: c:/clients/willdev/nodejs/sendEmail.js',
    '  2. Identity check at line 306 — hostname must be 172.31.28.199 (Monkey)',
    '  3. Template selection at line 698 — conditional on showUpgradePrompt',
    '  4. Main execution at line 642 — where tokens, caches, identity check chain',
    '',
    '== Testing Email Output ==',
    '',
    '  1. Check latest_debug_email.html in the dataset working directory',
    '  2. Use testharness.html for browser preview',
    '  3. Verify SES delivery via AWS console',
    '',
    '== Verified Sending Domains ==',
    '',
    '  produceflow.com, producestandards.org, prodicon.com, jungledevices.com',
    '',
    '== Identity API ==',
    '',
    '  POST http://172.31.28.199:3006/api/check-prostan-partner',
    '  Graceful degradation: defaults to "new user" on ANY failure.',
    '',
    '== Portal Cache Locations ==',
    '',
    '  Email:   portal/cache/email/{emailToken}.json',
    '  Company: portal/cache/company/{companyToken}.json',
    '  DBF:     portal/company/{companyId}/emailprt.dbf'
  ].join('\n'));
}

function showJson() {
  console.log(JSON.stringify({
    name: 'senath',
    billet: 'senathSendEmail',
    domain: 'Document access layer builder — portal cache creation via sendEmail.js',
    repo: 'senath',
    sourceFile: 'c:/clients/willdev/nodejs/sendEmail.js',
    templateFile: 'c:/clients/willdev/nodejs/emailTemplate.js (owned by emsworth)',
    creates: [
      'portal/cache/email/{emailToken}.json',
      'portal/cache/company/{companyToken}.json'
    ],
    keyFunctions: [
      'sendEnhancedDocumentEmail',
      'checkEmailRegisteredToPER',
      'createEmailPortalCacheEnhanced',
      'createCompanyPortalCache',
      'buildContextualUpgradeUrl',
      'selectSendingDomain',
      'createJourneyMetadata'
    ],
    facets: facetNames,
    cruise: 'Mississippi — SeedDrop Step 1',
    connections: {
      emsworth: 'template rendering (emailTemplate.js)',
      denver: 'EMAILPRT.DBF schema, email orchestration',
      nashville: 'downstream registration (register.html)',
      seeley: 'SeedDrop intelligence (maker)',
      pullman: 'upstream pipeline (emailThis → prntData)',
      savoy: 'upstream pipeline (saveandemail.php → email JSON)',
      monkey: 'identity check API (172.31.28.199:3006)'
    },
    contact: 'dm:senath'
  }, null, 2));
}

function showConnections() {
  console.log(JSON.stringify({
    billet: 'senathSendEmail',
    connections: [
      { name: 'pullman', relation: 'upstream', detail: 'emailThis() packages PULP identity into prntData' },
      { name: 'savoy', relation: 'upstream', detail: 'saveandemail.php writes email JSON + launches sendEmail.js' },
      { name: 'emsworth', relation: 'peer', detail: 'owns emailTemplate.js — I call createConditionalHtmlEmail()' },
      { name: 'denver', relation: 'coordinator', detail: 'outbound email domain coordinator, EMAILPRT.DBF schema' },
      { name: 'nashville', relation: 'downstream', detail: 'registration page receives contextual upgrade URL' },
      { name: 'seeley', relation: 'strategic', detail: 'SeedDrop intelligence — Cruise Mississippi maker' },
      { name: 'monkey:3006', relation: 'api', detail: 'verifyApi.js identity check (POST /api/check-prostan-partner)' }
    ]
  }, null, 2));
}

// Main
if (args.includes('--help') || args.includes('-h')) {
  usage();
} else if (args.includes('--connections')) {
  showConnections();
} else if (args.includes('--facets')) {
  showFacets();
} else if (args.includes('--library')) {
  showLibrary();
} else if (args.includes('--tools')) {
  showTools();
} else if (args.includes('--json')) {
  showJson();
} else if (args.some(function(a) { return facetNames.indexOf(a) !== -1; })) {
  args.forEach(function(a) {
    if (facetNames.indexOf(a) !== -1) showFacet(a);
  });
} else {
  usage();
}
