// router.js — Senath Portal-Membrane MEP
// Author: senath gen-6

const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const router = express.Router();

var AWS = require('aws-sdk');
try { AWS.config.loadFromPath('c:/secrets/config.json'); } catch (e) {}
var s3 = new AWS.S3();

var BUCKET = 'ucode2-canopylake';
var SUFFIX = '3';
var CHIMAYO_HOST = '15.30.60.40';
var CHIMAYO_PORT = 7719;

// =========================================================================
// helpers
// =========================================================================

function chimayoReadJson(p) {
  return new Promise(function(resolve) {
    var body = JSON.stringify({ path: p });
    var req = http.request({
      host: CHIMAYO_HOST, port: CHIMAYO_PORT, path: '/read-json',
      method: 'POST', timeout: 4000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, function(res) {
      var chunks = '';
      res.on('data', function(c) { chunks += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(chunks)); } catch (e) { resolve({}); }
      });
    });
    req.on('error', function() { resolve(null); });
    req.on('timeout', function() { req.destroy(); resolve(null); });
    req.write(body); req.end();
  });
}

async function s3List(prefix) {
  try {
    var r = await s3.listObjectsV2({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 500 }).promise();
    return (r.Contents || []).map(function(o) { return o.Key; });
  } catch (e) { return []; }
}

async function s3HasPrefix(prefix) {
  try {
    var r = await s3.listObjectsV2({ Bucket: BUCKET, Prefix: prefix, MaxKeys: 1 }).promise();
    return (r.Contents || []).length > 0;
  } catch (e) { return false; }
}

// =========================================================================
// API: the membrane model (static, the educational core)
// =========================================================================

router.get('/api/model', function(req, res) {
  res.json({
    tagline: 'The portal-membrane is how willis shares documents with farmwey through uTERA-governed authority.',

    accessTiers: [
      { tier: 1, name: 'Anonymous',  knownAtSend: 'email only',       mechanism: 'S3 pre-signed-style URL in the email (6-month expiry)', authority: 'none — the URL IS the grant; disappears in 6 months' },
      { tier: 2, name: 'Authorized', knownAtSend: 'recipient registered (or already a PER)', mechanism: 'canopylake folder + LINK in their PER tree', authority: 'recipient PER — permanent access through their credentials' }
    ],
    tierNote: 'Simplified to 2 tiers 2026-05-24 (was 4). Anonymous = temporary S3 link in the email. '
            + 'Authorized = permanent folder + LINK once they have an account. The old provisional/individual/company '
            + 'split was collapsed: from the recipient\'s view there are only two states — a temporary link, or real access.',

    sides: [
      {
        side: 'outgoing',
        owns: 'YOU (grantor CORP)',
        purpose: 'Your storage. sendEmail.js writes documents here.',
        example: 'willis owns local_c/server/produceflow/portals/outgoing/farmwey/',
        controls: 'You write, you sever, you keep the journal.'
      },
      {
        side: 'incoming',
        owns: 'You own the container — counterparty owns what links resolve to',
        purpose: 'A <link> window into the counterparty\'s outgoing/. You read through, cannot modify.',
        example: 'willis has local_c/server/produceflow/portals/incoming/farmwey/ → farmwey\'s outgoing/willis/',
        controls: 'Counterparty controls the bytes; the ~_~ boundary fires the authority check.'
      }
    ],

    twoLayerSplit: {
      headline: 'NOT EVERY DIRECTORY GETS AN INODE RECORD. This is the correction from inola:--facet-inode-vs-appdir (2026-05-22).',
      needsInodeRecord: [
        { what: 'Asset roots',     why: 'Entity home — uTERA topology' },
        { what: 'Drives (A/C/F)',  why: 'Authority scoping' },
        { what: 'Skeleton dirs',   why: 'server/, service/ created at entity birth' },
        { what: '<link> entries',  why: 'Cross-entity ~_~ — boundary IS the authority check' }
      ],
      noInodeRecord: [
        { what: 'produceflow/',     why: 'Application namespace inside an entity' },
        { what: 'portals/',         why: 'Feature root — application directory' },
        { what: 'outgoing/farmwey/', why: 'Per-recipient folder — plain mkdir, parent dir is the access control' },
        { what: 'loads/20260522/',  why: 'Operational data — same principle' }
      ],
      reasoning: 'The inode system governs AUTHORITY TOPOLOGY. Application directories within an entity\'s own tree are the application\'s concern — like creating folders on your C: drive. The OS does not need a kernel entry for every mkdir. Authority is checked at <link> ~_~ boundaries.',
      consequence: 'outgoing/ is plain mkdir. ONLY incoming/<sender>/ needs an inode <link> record. creedmoor does NOT need a createDirectory transaction. Only leyden\'s createinodelink_modular is needed.'
    },

    dirArrayPrefixes: [
      { prefix: '<dir>',   means: 'Directory or special (./..)', forPortal: 'server/, service/ skeleton only — produceflow/ etc. are plain dirs, not in dirArray' },
      { prefix: '<drive>', means: 'Drive mount in root Asset',   forPortal: 'A, C, F — created at CORP birth' },
      { prefix: '<link>',  means: 'Cross-entity ~_~ boundary',   forPortal: 'incoming/<sender> — THIS is the membrane' }
    ],

    canonicalExample: {
      grantor: 'willis (CORP)',
      recipient: 'farmwey (CORP)',
      direction: 'willis sends documents to farmwey',
      willisSide: {
        outgoing: 'local_c/server/produceflow/portals/outgoing/farmwey/   <-- plain dir; willis writes PDFs here',
        incoming: 'local_c/server/produceflow/portals/incoming/farmwey/   <-- <link> ~_~ -> farmwey outgoing/willis (read-only window)'
      },
      farmweySide: {
        outgoing: 'local_c/server/produceflow/portals/outgoing/willis/    <-- plain dir; farmwey writes PDFs back here',
        incoming: 'local_c/server/produceflow/portals/incoming/willis/    <-- <link> ~_~ -> willis outgoing/farmwey (read-only window)'
      },
      note: 'Reciprocity is NOT required (atlanta correction). One-directional sharing (willis -> farmwey only) is the normal SeedDrop case. Only the willis-outgoing + farmwey-incoming pair must exist; the reverse pair is added when farmwey also wants to send back.'
    }
  });
});

// =========================================================================
// API: provisioning pipeline (who builds what)
// =========================================================================

router.get('/api/pipeline', function(req, res) {
  res.json({
    staleness: '⚠ JUNE 2026 PLAN, NOT DEPLOYED REALITY. Steps below mix built and never-built. '
             + 'Notably step 5 (per-company prey junction): NEVER BUILT — live sendEmail.js writes UNC '
             + 'directly to canopylakeOutgoingPath. This tab misled a reviewer on 2026-08-07 (plan read '
             + 'as reality); kept for lineage, annotated. Current design: the 08-07 Structure-as-Truth tab '
             + '+ c:/clients/inola/proposal-three-areas-three-links.md.',
    rule: 'sendEmail.js is a pure file writer. Zero new code there. Everything else is provisioning.',

    steps: [
      {
        n: 1, what: 'Skeleton inodes for willis CORP',
        artifact: 'root + A/C/F drives + server/ + service/',
        owner: 'creedmoor',
        tool: 'createCorpInodes() in c:/cot/creator_inodes.js (runs at CORP creation)',
        status: 'done at CORP creation — willdev verified (server/ exists, empty)',
        layer: 'inode'
      },
      {
        n: 2, what: 'Application directories: produceflow/ portals/ outgoing/',
        artifact: 'plain filesystem directories on canopylake under local_c/server/',
        owner: 'application (no specialist owns it)',
        tool: 'mkdir via SMB through bridge (chimayo /write-json convention, or prey-side mkdir once mounted)',
        status: 'NOT BUILT for willdev — needs first mkdir',
        layer: 'plain'
      },
      {
        n: 3, what: 'Per-recipient outgoing folder',
        artifact: 'local_c/server/produceflow/portals/outgoing/farmwey/',
        owner: 'sendEmail.js path (or one-time provisioning script)',
        tool: 'mkdir; same as step 2',
        status: 'NOT BUILT for willdev',
        layer: 'plain'
      },
      {
        n: 4, what: 'Materialize bytes/dirs on canopylake',
        artifact: '.inode.json for inode-recorded entries; plain dirs land via SMB',
        owner: 'chimayo',
        tool: 'DDB stream poller (automatic); /write-json for plain dirs/identity files',
        status: 'live and running (uptime ~9 days as of last check)',
        layer: 'materialize'
      },
      {
        n: 5, what: 'Prey-side junction so sendEmail.js writes locally',
        artifact: 'D:\\clients\\willdev\\portal\\farmwey -> X:\\inode3\\9x\\9xn6xk6a\\local_c\\server\\produceflow\\portals\\outgoing\\farmwey',
        owner: 'effingham (junction), bridgeport (SMB share)',
        tool: 'net use X: \\\\172.31.24.120\\canopylake /user:smbuser ; mklink /J D:\\... X:\\...',
        status: 'mechanism verified; per-recipient junctions not yet created',
        layer: 'prey'
      },
      {
        n: 6, what: 'sendEmail.js writes the PDF',
        artifact: 'D:\\clients\\willdev\\portal\\farmwey\\<doc>.pdf',
        owner: 'senath (me)',
        tool: 'fs.writeFileSync — zero new code; junction redirects through SMB',
        status: 'sendEmail.js already does this; just needs a configurable base path',
        layer: 'application'
      },
      {
        n: 7, what: 'Membrane: incoming <link> inode',
        artifact: 'farmwey\'s incoming/willis = <link> with epath ~_~$$<willis-prostan8>$$~clients/.../outgoing/farmwey',
        owner: 'leyden (transaction), inola (spec)',
        tool: 'createinodelink_modular.js — exists, used live for willdev CORP\'s dbf link already',
        status: 'tool exists; never invoked for portal membrane yet',
        layer: 'inode'
      },
      {
        n: 8, what: 'API endpoint to invoke /createLink from a service',
        artifact: 'POST /createLink on prosser',
        owner: 'prosser',
        tool: 'wraps leyden\'s createinodelink_modular.js',
        status: 'DOES NOT EXIST — prosser confirmed 2026-05-22; the one real API gap',
        layer: 'api'
      }
    ],

    correctedGap: {
      whatIThoughtWasMissing: 'creedmoor must build /createDirectory transaction + prosser must wrap it',
      whatIsActuallyMissing: 'Only prosser /createLink (wrapping leyden) for the incoming membrane side',
      whyTheChange: 'inola:--facet-inode-vs-appdir (2026-05-22) — outgoing folder is a plain directory; no inode record, no transaction, no API needed. Just mkdir on the materialized disk.'
    }
  });
});

// =========================================================================
// API: live portal state for a CORP
// =========================================================================
// Walks the canopylake S3 prefix for a CORP's portal subtree.
// Shows which directories actually exist on disk vs which would need creating.

router.get('/api/portal-state', async function(req, res) {
  var corp = req.query.corp || 'willdev';
  var recipient = req.query.recipient || 'farmwey';

  try {
    // 1. Resolve CORP -> prostan8 via the CORP's inode record path (try common shards)
    // For known CORPs we hard-map; otherwise look up via inola's pattern.
    var known = {
      willdev: { prostan8: '9xn6xk6a', shard: '9x' },
      willis:  { prostan8: null,       shard: null }   // populated dynamically if requested
    };
    var coords = known[corp];
    if (!coords || !coords.prostan8) {
      return res.json({ ok: false, error: 'CORP "' + corp + '" coords not pre-mapped; lookup via DDB not yet wired. Try "willdev".' });
    }

    var basePrefix = 'inode' + SUFFIX + '/' + coords.shard + '/' + coords.prostan8 + '/';
    var localC = basePrefix + 'local_c/';
    var serverDir = localC + 'server/';
    var portalRoot = serverDir + 'produceflow/portals/';
    var outgoingPath = portalRoot + 'outgoing/' + recipient + '/';
    var incomingPath = portalRoot + 'incoming/' + recipient + '/';

    // 2. What's IN local_c (skeleton + any application dirs we created)
    var localCInode = await chimayoReadJson(localC + '.inode.json');
    var serverInode = await chimayoReadJson(serverDir + '.inode.json');

    // 3. Existence checks for plain dirs (no .inode.json; check S3 listing)
    var hasProduceflow = await s3HasPrefix(serverDir + 'produceflow/');
    var hasPortals     = await s3HasPrefix(portalRoot);
    var hasOutgoingRecipient = await s3HasPrefix(outgoingPath);
    var hasIncomingRecipient = await s3HasPrefix(incomingPath);

    // 4. Read the incoming <link> inode if present (this WOULD have .inode.json since it's inode-recorded)
    var incomingLinkInode = hasIncomingRecipient
      ? await chimayoReadJson(incomingPath + '.inode.json')
      : null;
    var incomingLinkFile = hasIncomingRecipient
      ? await chimayoReadJson(incomingPath + '.link.json')
      : null;

    // 5. List anything under the portal root (helps see partial state)
    var portalListing = await s3List(portalRoot);

    res.json({
      ok: true,
      corp: corp, recipient: recipient,
      coords: coords,
      paths: {
        localC: localC,
        serverDir: serverDir,
        portalRoot: portalRoot,
        outgoing: outgoingPath,
        incoming: incomingPath
      },
      preyJunctionWouldBe: 'D:\\clients\\' + corp + '\\portal\\' + recipient
        + '  ->  X:\\' + localC.replace(/\//g, '\\') + 'server\\produceflow\\portals\\outgoing\\' + recipient,
      sendEmailWouldWrite: 'D:\\clients\\' + corp + '\\portal\\' + recipient + '\\<doc>.pdf',
      state: {
        localC_inode:    { exists: !!(localCInode && localCInode.id), value: localCInode },
        server_inode:    { exists: !!(serverInode && serverInode.id), value: serverInode },
        produceflow_dir: { exists: hasProduceflow, layer: 'plain (no inode record expected)' },
        portals_dir:     { exists: hasPortals,     layer: 'plain (no inode record expected)' },
        outgoing_dir:    { exists: hasOutgoingRecipient, layer: 'plain (no inode record expected)' },
        incoming_link:   { exists: hasIncomingRecipient, layer: 'inode (<link> entry expected)',
                           inodeJson: incomingLinkInode, linkJson: incomingLinkFile }
      },
      portalListing: portalListing,
      verdict: buildVerdict(hasProduceflow, hasPortals, hasOutgoingRecipient, hasIncomingRecipient)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

function buildVerdict(hasProduceflow, hasPortals, hasOutgoing, hasIncoming) {
  var todo = [];
  if (!hasProduceflow) todo.push('mkdir produceflow/ (plain; chimayo /write-json or SMB mkdir)');
  if (!hasPortals)     todo.push('mkdir portals/ (plain)');
  if (!hasOutgoing)    todo.push('mkdir outgoing/<recipient>/ (plain)');
  if (!hasIncoming)    todo.push('leyden createinodelink_modular for incoming/<sender>/ (inode <link>, ~_~ boundary)');
  if (todo.length === 0) return 'Portal membrane fully provisioned. sendEmail.js can write.';
  return 'To provision: ' + todo.join('  /  ');
}

// =========================================================================
// API: decisions George is making (the explainer George asked for)
// =========================================================================

router.get('/api/decisions', function(req, res) {
  res.json({
    intro: 'These are the open decisions that gate getting the portal operational. '
         + 'The first one cascades into everything else — pick it and the rest of the work is mechanical. '
         + 'Each decision lists the options, what each one costs you, and senath\'s recommendation with the reasoning.',

    decisions: [
      {
        id: 'access-grain',
        title: 'Individual vs Dataset — at what grain does ACCESS live?',
        status: 'RESOLVED 2026-06-10 — THE SPLIT (George ruled, per senath + libertyville recommendation)',
        resolved: 'TWO RECORDS, each scalar at the grain of its own entity. (1) jrec:portal:<dataset>:<companyId> '
                + 'stays — senath\'s send ledger (documentCount, lastSentAt, s3DocumentUrl, canopylakeSubpath), '
                + 'pure accumulating ledger, NO coherence scalar. (2) NEW per-person record, prostan8-keyed, '
                + 'nashville-born at registration, carries tier + the channel-3 scope binding '
                + '(prostan8 <-> dataset/companyId/pulpId), cross-referenced both ways. Consequences: tier MOVES '
                + 'to the per-person record; senath stops birthing tier entirely; ANONYMOUS = no per-person record '
                + 'exists yet (absence IS the state — the record is born when authorization begins). '
                + 'Still gating schema ratification (libertyville): name the revocation writer; settle '
                + 'role-assignment (PULP-auto vs explicit grantor action) and the grantor-app billet owner.',
        blocking: false,
        question: 'The bytes (folder) are per-company. But authorization (the tier flip from anonymous '
                + 'to authorized) is per-PERSON. So the portal jrec — the record that carries tier — should it '
                + 'be keyed per individual person, or stay keyed at the company/dataset bucket?',
        vetUpdate: 'VETTED 2026-06-10 by leyden, seeley, libertyville (all endorse per-person). libertyville REFINES '
                 + 'the remedy: SPLIT, don\'t re-key. Company-grain facts (senath\'s send ledger: documentCount, '
                 + 'lastSentAt, s3DocumentUrl) STAY on jrec:portal:<ds>:<co> — re-keying per-person would duplicate '
                 + 'the send ledger and break increment-per-send. A NEW per-person record carries tier + the channel-3 '
                 + 'scope binding, cross-referenced both ways. Consequence: tier MOVES to the per-person record; the '
                 + 'company record degrades gracefully into an accumulating ledger (no coherence scalar — fine). '
                 + 'Second-order choice: per-person KEY determines BIRTH-WRITER — prostan8-keyed means nashville '
                 + 'births it at registration (libertyville leans this; binding written same instant); email-keyed '
                 + 'means senath births at send but hits a re-key problem at registration. "Anonymous" then = no '
                 + 'per-person record exists yet — the company send-ledger IS the anonymous-state evidence. '
                 + 'senath endorses the split from the send-ledger-writer\'s seat: every scalar lands at the grain '
                 + 'of its own entity, and my increment survives.',
        theThreeEntities: {
          dataset_grantor: 'WILLIS — the CORP sending documents. LEFT half of the key: jrec:portal:WILLIS:... '
                         + 'One dataset sends to many companies.',
          company_folder:  'INGLES — the business the docs are about. The BYTES live here, once: '
                         + 'outgoing/INGLES/ holds every WILLIS->Ingles PDF. Shared by everyone at Ingles. One company, many people.',
          individual:      'gburt@ingles, mary@ingles — humans. Each becomes a GLOBAL identity (one prostan8) '
                         + 'when they register. ACCESS is granted per person: each gets their OWN LINK pointing at the company folder.'
        },
        theKeyInsight: 'BYTES and ACCESS live at different grains. Bytes = per (dataset, company) — one folder. '
                     + 'Access = per (dataset, individual) — one LINK each. A person is global (one prostan8), but their '
                     + 'access is DATASET-SCOPED: authorized-for-WILLIS-docs is a separate fact from authorized-for-some-other-grantor. '
                     + 'Same person, separate access relationship per grantor dataset.',
        walk: [
          'WILLIS emails an invoice to gburt@ingles AND mary@ingles.',
          'Both PDFs land in outgoing/INGLES/ — ONE folder, per-company. (bytes grain)',
          'gburt clicks, registers, gets a PER + a LINK to outgoing/INGLES/. gburt = AUTHORIZED.',
          'mary never registers. mary = ANONYMOUS (token-only link, expires in 6 months).',
          'NOW: what does tier say?',
          '  -> If tier lives on the COMPANY record (portal:WILLIS:INGLES): ONE tier field for all of Ingles. '
          + 'It CANNOT be authorized (gburt) and anonymous (mary) at the same time. BROKEN.',
          '  -> If tier lives PER PERSON (portal:WILLIS:gburt@ingles): gburt record=authorized, mary record=anonymous. '
          + 'Both correct. The company folder is untouched (bytes are still per-company). CORRECT.'
        ],
        options: [
          {
            value: 'per-person-key',
            example: 'jrec:portal:WILLIS:gburt@ingles  (tier scalar per person)',
            plain: 'One access record per (dataset, person). tier is finally a coherent scalar.',
            pros: [
              'tier means something — one person, one state',
              'leyden flips tier=authorized on THAT person record when he mints their LINK (the settled split works cleanly)',
              'Preston-style tracker is trivial: one queryable row per person',
              'Bytes stay per-company (folder unchanged) — only the access record is per-person'
            ],
            cons: [
              'More records (one per registered person, not one per company)',
              'Need a per-person identifier in the key (email always present; pulpId portable but missing on legacy)'
            ],
            recommended: true
          },
          {
            value: 'per-person-set-on-company',
            example: 'jrec:portal:WILLIS:INGLES  with authorizedPersons = {gburt, ...}',
            plain: 'Keep the company record; leyden appends each authorized person to a set on it.',
            pros: ['Fewer records', 'Company custody + authorization in one place'],
            cons: [
              'No single tier scalar — "the company tier" stops meaning anything',
              'Tracker must expand the set to render per-person state',
              'Two grains crammed into one record (company custody + per-person auth)'
            ],
            recommended: false
          },
          {
            value: 'company-scalar-tier',
            example: 'jrec:portal:WILLIS:INGLES  with a single tier (status quo code)',
            plain: 'Leave it as shipped — one tier for the whole company.',
            pros: ['No change'],
            cons: ['THE MARY BUG: first person to register flips the whole company to authorized', 'Breaks the per-person access model'],
            recommended: false
          }
        ],
        senathRecommendation: 'per-person-key',
        recommendationReason: 'Bytes are per-company; access is per-person. Key the access record at the grain the '
                            + 'state actually has — per (dataset, person). Then tier is a real scalar, leyden\'s settled '
                            + 'tier-flip lands on a key where it means something, and the tracker is one-row-per-person. '
                            + 'Keep the company folder per-company (companyId) for the bytes — that decision stays resolved. '
                            + 'The two are different grains and should be different records.',
        relationToBooked: 'The WHO-writes-tier agreement is SETTLED (senath births anonymous; leyden flips at LINK creation). '
                        + 'This decision is the WHERE — the key grain leyden\'s flip lands on. His implementation is gated on it.'
      },

      {
        id: 'recipient-identifier',
        title: 'What identifies the recipient?',
        status: 'RESOLVED 2026-06-07 — companyId',
        resolved: 'companyId. The FOLDER is per-company (outgoing/INGLES/ holds all willis->Ingles docs — documents '
                + 'are a company relationship, not a personal one). Per-PERSON access is the LINK (leyden, at '
                + 'registration), pointing each registered person at the same company folder. Folder = company; '
                + 'LINK = person. George\'s call from the Ingles contact list: all those people share the company\'s documents.',
        blocking: false,
        question: 'When willis shares a document with a contact, what string names that recipient in BOTH '
                + 'the folder path outgoing/<recipient>/ AND the state-machine key jrec:portal:<grantor>:<recipient>?',
        whyItMatters: 'These two must use the SAME identifier. The folder is where the PDF physically lands on '
                    + 'canopylake. The jrec key is where the access-state (anonymous vs authorized) lives. If they '
                    + 'disagree, you can\'t connect "this document" to "this person\'s access." And if you pick one '
                    + 'now and change later, every folder and every state record has to be migrated.',
        cascades: [
          'The canopylake folder name: outgoing/<this>/',
          'The jrec portal key: portal:willis:<this>',
          'leyden\'s LINK target (what the recipient\'s tree points at)',
          'Whether two people at the same company share or separate access'
        ],
        options: [
          {
            value: 'companyId',
            example: 'outgoing/INGLES/   ·   portal:willis:INGLES',
            plain: 'One folder per recipient COMPANY. Everyone at Ingles shares it.',
            pros: [
              'Matches the old companyToken behavior',
              'Fewer folders (one per company, not one per person)',
              'companyId is always present in the send data'
            ],
            cons: [
              'BREAKS the access model: access is per-PERSON. If gburt registers but mary@ingles never does, '
              + 'the single INGLES record can\'t be both authorized AND anonymous at once.',
              'Buyer-centric — reads as "documents about Ingles," not "documents I sent to a person"'
            ],
            recommended: false
          },
          {
            value: 'recipientEmail',
            example: 'outgoing/gburt@prodicon.com/   ·   portal:willis:gburt@prodicon.com',
            plain: 'One folder per PERSON, keyed by the email you actually sent to.',
            pros: [
              'Matches reality: access is granted to a person, and the email IS how you reached them',
              'Always present — you cannot send without an email address',
              'Tier flip (anonymous -> authorized) is per-person, which is how authority actually works',
              'No lookup needed — it\'s right there in the send'
            ],
            cons: [
              'If a person changes email (new job), the old relationship orphans and a new one starts. '
              + '(Arguably correct — it IS a new access relationship — but worth knowing.)',
              'Email as a folder name has @ and . characters (works on canopylake, just noting)'
            ],
            recommended: true
          },
          {
            value: 'pulpId',
            example: 'outgoing/123899/   ·   portal:willis:123899',
            plain: 'One folder per PERSON, keyed by their portable PULP code.',
            pros: [
              'Portable — follows the person across datasets and email changes',
              'Numeric, clean folder names',
              'Per-person, so the access model stays correct'
            ],
            cons: [
              'NOT always present — legacy send paths (old newbol.htm) don\'t carry pulpId',
              'Opaque — a human reading the folder list sees numbers, not who they are',
              'Requires pullman\'s PULP system to have minted a code first'
            ],
            recommended: false
          }
        ],
        senathRecommendation: 'recipientEmail',
        recommendationReason: 'Access is granted to a person, not a company, and the tier flip from anonymous to '
                            + 'authorized happens per-person. recipientEmail is the only identifier that is BOTH '
                            + 'always-present AND per-person. pulpId is per-person but can be missing on legacy paths; '
                            + 'companyId is always present but collapses multiple people into one access record, which '
                            + 'breaks the model. Store pulpId as a FIELD on the record for cross-dataset queries, but '
                            + 'KEY on email.',
        ifYouChange: 'Only the schema entitySpec line changes (one line in portal.json) plus the folder-name '
                   + 'expression in sendEmail.js. But any records/folders already created under the old key would '
                   + 'need migration — so decide before the first real write.'
      },

      {
        id: 'binding-admin',
        title: 'Who owns grantor-side binding administration (assign role / revoke)?',
        status: 'RESOLVED 2026-06-10 — HYBRID (senath final ruling under George\'s delegation)',
        resolved: 'Role auto-derived at birth (default "partner"); the dataset-app billet (pilotbird/true1 lane) '
                + 'owns the grantor-side admin surface: role override AND revocation. Revocation writer NAMED: '
                + 'dataset-app billet. Part of the consolidated final ruling that also locked: perportal key '
                + 'jrec:perportal:{dataset}:{prostan8} with scope_{companyId} payload fields (resolves the '
                + 'nashville/libertyville key conflict); TWO birth paths (nashville at registration, senath at '
                + 'send for known-registered — senath\'s side SHIPPED to willis); birth tier "registered", leyden '
                + 'flips to "authorized" on perportal; one-way cross-ref only; atomic primitive deferred. '
                + 'Process ruling: no more parallel design DMs — objections go to seeley\'s lifecycle doc, '
                + 'batched to George.',
        blocking: false,
        question: 'libertyville set two ratification gates: (a) the binding revocation writer must be NAMED, and '
                + '(b) if role-assignment/revocation is a grantor-side action, the grantor\'s app becomes the first '
                + 'non-billet writer and needs a billet owner. seeley\'s consolidation: these are ONE decision — '
                + 'revocation severs a grantor-side relationship, so the revocation writer and the grantor-app '
                + 'billet are naturally the same owner. Who is it, and is the initial role auto-derived or '
                + 'explicitly granted?',
        whyItMatters: 'This is the last gate before libertyville ratifies the split schema, nashville implements '
                    + 'the per-person birth-write, leyden implements the tier flip, and senath drops the tier '
                    + 'birth. Everything downstream is staged behind it.',
        options: [
          {
            value: 'hybrid: auto-birth + grantor admin',
            example: 'nashville writes initial role from PULP data at registration; one dataset-app billet owns override + revoke',
            plain: 'The binding is BORN automatically (nashville derives role=grower from the grantor\'s own PULP/blue-test '
                 + 'data, one writer one instant — libertyville\'s cleaner contract). A single grantor-side billet '
                 + '(pilotbird/true1 lane) owns the admin surface: override a role, revoke a binding.',
            pros: [
              'Zero friction at registration — the grower portal works the moment they register',
              'One writer one instant for the birth (libertyville\'s preferred contract shape)',
              'Revocation writer is NAMED: the dataset-app billet, under its write discipline',
              'Consent semantics preserved where they matter — severing, not granting'
            ],
            cons: [
              'Auto-derived role could be wrong if PULP data is stale (admin override is the remedy)',
              'The dataset-app billet takes on substrate-writer responsibility (db 8 rules)'
            ],
            recommended: true
          },
          {
            value: 'explicit grant only',
            example: 'grantor admin must approve each binding before the portal shows anything',
            plain: 'No automatic binding. The grantor explicitly grants each PER access to the portal view.',
            pros: ['Cleanest consent semantics', 'No stale-PULP risk'],
            cons: ['Friction kills the flywheel moment — grower registers and sees... nothing until willis acts', 'Same billet-owner question, none of the benefit'],
            recommended: false
          },
          {
            value: 'split owners',
            example: 'nashville assigns, some other billet revokes',
            plain: 'Different owners for assign and revoke.',
            pros: ['None obvious'],
            cons: ['Two contracts for one lifecycle; contradicts seeley\'s consolidation logic'],
            recommended: false
          }
        ],
        senathRecommendation: 'hybrid: auto-birth + grantor admin',
        recommendationReason: 'The flywheel argument decides it: the grower-portal payoff must be live at the moment '
                            + 'of registration (value-before-upgrade), which requires the auto-birth. The consent '
                            + 'concern is real but applies to SEVERING and CORRECTING, not granting — willis already '
                            + '"consented" by having this person in their PULP contacts and sending them documents. '
                            + 'One dataset-app billet as the admin/revocation owner answers both libertyville gates '
                            + 'in one stroke.',
        ifYouChange: 'Before ratification: free. After: the binding birth moves between writers — a schema '
                   + 'Who-Writes-What change plus code in two places (nashville handler, grantor admin surface).'
      },

      {
        id: 'tier4-cleanup',
        title: 'Tier 4 (company) schema leftover',
        status: 'OPEN — cosmetic, non-blocking',
        blocking: false,
        question: 'The portal.json schema still has an atlanta_* owner block from the old 4-tier model. '
                + 'You collapsed to 2 tiers (anonymous / authorized). Remove the atlanta block, or leave it as future-proof?',
        whyItMatters: 'Harmless either way — nothing writes those fields today. Removing it makes the schema match '
                    + 'reality; leaving it documents a possible future CORP-level tier.',
        options: [
          { value: 'remove', example: 'Drop atlanta_* from portal.json', plain: 'Schema matches the 2-tier reality.', pros: ['Honest schema'], cons: ['Re-add later if CORP tier returns'], recommended: true },
          { value: 'keep', example: 'Leave atlanta_* as future-proof', plain: 'Placeholder for a future company tier.', pros: ['No work'], cons: ['Schema describes a tier that does not exist'], recommended: false }
        ],
        senathRecommendation: 'remove',
        recommendationReason: 'The 2-tier model is what George settled on. A schema should describe what exists. '
                            + 'Re-adding a CORP tier later is a 5-minute edit if it ever comes back.',
        ifYouChange: 'One block removed from portal.json. No code impact — nothing writes atlanta_* today.'
      },

      {
        id: 'subfoldering',
        title: 'Sub-foldering inside outgoing/<recipient>/',
        status: 'OPEN — low stakes, decide at build time',
        blocking: false,
        question: 'Inside a recipient\'s folder, do PDFs go flat, or grouped (by date / load / doc-type)?',
        whyItMatters: 'Affects how a recipient browses many documents over time. Flat is simplest; grouping helps '
                    + 'once there are hundreds of docs.',
        options: [
          { value: 'flat', example: 'outgoing/<r>/29621_bol_1.pdf', plain: 'All PDFs directly in the recipient folder.', pros: ['Simplest', 'Easiest to write'], cons: ['Cluttered after hundreds of docs'], recommended: true },
          { value: 'by-load', example: 'outgoing/<r>/29621/bol_1.pdf', plain: 'One subfolder per load number.', pros: ['Organized by shipment'], cons: ['More mkdir logic'], recommended: false }
        ],
        senathRecommendation: 'flat',
        recommendationReason: 'Start flat. The filename already encodes load + doc-type + count. Add grouping only '
                            + 'if browsing actually gets painful. Don\'t pre-optimize structure before there\'s volume.',
        ifYouChange: 'A few lines in the sendEmail.js path builder. Easy to change before volume accumulates.'
      }
    ],

    afterYouDecide: [
      '1. senath updates portal.json entitySpec + deploys (10 min)',
      '2. inola/palmbeach run setup-portal.js for the willis CORP — get prostan8 + shard (~30 min)',
      '3. Admin on Hawk: net use X: + mklink /J junction (~5 min)',
      '4. mkdir the chain local_c/server/produceflow/portals/outgoing/ on willis canopylake (~5 min)',
      '5. senath adds mkdir + fs.writeFileSync(pdf) to sendEmail.js, records senath_canopylakeSubpath (1-2 hr)',
      '6. Test send — confirm PDF lands on canopylake',
      '7. leyden wires first-send LINK creation (separate, after writes confirmed)'
    ]
  });
});

// =========================================================================
// API: Three Channels — the model George articulated 2026-06-10
// Written for leyden, seeley, libertyville (and George) to vet and refine.
// =========================================================================

router.get('/api/three-channels', function(req, res) {
  res.json({
    title: 'Three Channels — How a SeedDrop Entity Touches the Network',
    subtitle: 'Articulated by George 2026-06-10. The unifying model under the grain decision, the tier-writer split, '
            + 'and the "where does the code run" question. Canonical facet: senath:--facet-three-channels.',

    story: 'Willis is a SpringForward customer: full system — code, data, PHP APIs that mutate and retrieve, '
         + 'its own prey server. Willis sells produce for a grower, Acme Produce. Willis emails Acme a BOL; '
         + 'someone at Acme clicks "Create your industry identity" and becomes a ProduceStandards person (PER) '
         + 'with disk resources. Now ask: what can that person DO, and where does each capability actually run? '
         + 'The answer splits into three channels — and each one has a different compute home and a DIFFERENT '
         + 'authorization regime. Most design confusion so far has come from conflating them.',

    channels: [
      {
        n: 1, name: 'THE ESTATE', tagline: 'Their own identity, resources, and light code',
        what: 'Account management, the asset/authority drilldown (the Resource Accounting tab — uwchlan facets — '
            + 'which is ALREADY LIVE), their inode tree and disk resources, and their own uCode2 programs '
            + '(brooklyn facets: in-browser dBase-style language, CornerShark IDE).',
        compute: 'vernal\'s entity APIs on Monkey, plus THE BROWSER (bronx uCode2 interpreter). A SeedDrop entity '
               + 'has no server of their own — and doesn\'t need one.',
        authz: 'JWT identity (prostan8). It\'s their own data.',
        keyInsight: 'There is NO per-user server code. ProduceStandards is a multi-tenant platform: sunrise\'s pages '
                  + 'plus vernal\'s APIs are "the code that is run," and the per-user part is purely DATA keyed by '
                  + 'prostan8. The Resource Accounting tab is live precisely because it follows this rule '
                  + '(_app.currentUser.prostan8 -> /api/entity-assets -> render). The hardcoded parts of home.html '
                  + 'are dead precisely because they don\'t. Every other tab gets live the same way.',
        storage: 'The inode tree lives on canopylake — always; that\'s what makes resources visible to '
               + '/api/entity-inodes and /api/resolve. For the BYTES: A-drive (documents, uploads, reports) belongs '
               + 'IN-TREE on canopylake — SeedDrop entities are the no-prey class, and portland\'s portal build '
               + '(368 PDFs written into the willis tree) proves bytes-in-tree works at this volume. T-drive/inbox '
               + '(thumbnails, processing, session) is compute scratch and stays near the processing server. '
               + 'F-drive is the membrane — channel 2\'s mounts.'
      },
      {
        n: 2, name: 'THE DOCUMENT MEMBRANE', tagline: 'Bytes in custody, crossing estates',
        what: 'incoming/{grantor}/ LINK in the recipient\'s tree resolving into the grantor\'s '
            + 'outgoing/{recipientCompanyId}/ folder. Read-only documents. The grantor can sever; documents never move.',
        compute: 'None. It is storage.',
        authz: 'The uTERA LINK + ~_~ boundary test (traversecity). The LINK is one transaction with three '
             + 'materializations: ledger couplet (creedmoor, DrCr balances — canonical), HAS_LINK edge in The Canopy '
             + '(what boundary-check.js queries), and the <link> inode + .link.json (what makes it walkable, '
             + 'chimayo/inola). Severable, conservation-law-backed.',
        keyInsight: 'This channel is SETTLED architecture. senath writes the outgoing bytes at send; leyden creates '
                  + 'the LINK and flips tier=authorized in the same handler (writer split agreed 2026-06-09). '
                  + 'The read path exists: vernal /api/resolve (verified, built — c:/cot/routes/i_resolve.js): '
                  + 'JWT -> .link.json -> boundary check -> SMB path -> listing.',
        storage: 'Grantor\'s tree holds the bytes (outgoing/, per-company — bytes are a company relationship). '
               + 'Recipient\'s tree holds only the LINK (per-person — access is a person relationship).'
      },
      {
        n: 3, name: 'THE APPLICATION PORTAL', tagline: 'The grantor\'s compute, rented as a view',
        what: 'A live application experience running on the GRANTOR\'s system, surfaced inside the SeedDrop user\'s '
            + 'home.html. The grower portal: Acme\'s packer logs into producestandards.org and sees willis\'s '
            + 'activity board filtered to THEIR loads — what\'s loading at their facility — and can act: print '
            + 'Bills of Lading. Willis data. Willis logic. Willis compute.',
        compute: 'The grantor\'s SpringForward system. The PHP APIs that mutate and retrieve only exist there. '
               + 'This is the point: SeedDrop entities don\'t get server compute; they get VIEWS into the systems '
               + 'of SpringForward customers they trade with.',
        authz: 'APPLICATION DISCIPLINE — the grantor\'s app scopes the view. NOT the membrane test. This is correct, '
             + 'not a shortcut: it is the read-side twin of the trusted-code write path (senath writes canopylake '
             + 'with no authority check because trusted code; willis renders willis data to a willis-vetted partner '
             + 'because the app has SUP over its own estate and is delegating a VIEW, not custody). The ~_~ test '
             + 'governs bytes crossing between estates; an activity board is live app state inside ONE estate.',
        keyInsight: 'The surface is an iframe in home.html — and that is the ESTABLISHED pattern, not a hack. '
                  + 'home.html is sunrise\'s iframe-nav platform; the uwchlan tab itself authenticates as an iframe '
                  + 'via window.parent._app; and SSO (oauth_session -> silent authorize -> stage-6 token exchange) '
                  + 'already carries the producestandards.org session into {dataset}.produceflow.com. The embed is '
                  + 'the existing machinery pointed at a new page.',
        storage: 'None of its own. Economics: compute stays with the paying SpringForward customer, and the portal '
               + 'is the showroom of the flywheel\'s upgrade step — the grower gets real utility free; when they '
               + 'want to RUN their own operation, that\'s a SpringForward dataset of their own.'
      }
    ],

    keystone: {
      title: 'The Keystone: The Scope Binding',
      body: 'Channel 3\'s entire security model reduces to one record: WHICH SCOPE IS THIS PERSON VETTED FOR AT '
          + 'THIS GRANTOR?  prostan8 <-> (grantor dataset, companyId, pulpId).  When the grower\'s iframe loads, '
          + 'willis\'s app receives a JWT that says "PER bk6..." and must answer "which grower is this?" — '
          + 'that mapping must exist somewhere willis\'s app can read.',
      theCloser: 'The SeedDrop journey ALREADY carries everything needed. senath\'s regjourney record is born at '
               + 'email send holding (dataset, companyId, pulpId, email). At registration, nashville is holding the '
               + 'brand-new prostan8 AND that journey context in the same instant. That is the moment the binding '
               + 'gets written — onto the portal jrec, which the grantor\'s app reads at iframe load (trusted '
               + 'server-side code; the ElastiCache db 8 connection pattern already runs on every prey via '
               + 'sendEmail.js). Willis\'s PULP/PEMAIL already has the company-side data (it IS the blue test) — '
               + 'the registration event is what binds it to a prostan8.',
      warning: 'THE BINDING IS NOT A LINK. No inode, no ledger couplet, no boundary test. It is relationship state '
             + 'on the jrec substrate. leyden: channel 3 does not involve you — do not conflate the binding with '
             + 'the channel-2 LINK.',
      grain: 'GRAIN CONSEQUENCE: the binding is per-PERSON (this PER, this scope, this grantor) even though the '
           + 'scope it grants is a companyId. Channel 3 therefore REQUIRES the per-person portal jrec key. A '
           + 'company-keyed scalar record cannot express "gburt is bound, an unknown PER is not." This is the '
           + 'third independent argument for per-person grain (after the tier-scalar coherence problem and the '
           + 'tracker row model) — and the strongest, because it is a security model, not a bookkeeping preference. '
           + 'RULED 2026-06-10 (George): the SPLIT — company send-ledger stays on portal:<ds>:<co>; new '
           + 'prostan8-keyed, nashville-born per-person record carries tier + binding. Anonymous = no per-person '
           + 'record yet. See the Decisions tab for the full resolution.'
    },

    perSpecialist: [
      { who: 'George',       ask: 'The grain ruling (per-person portal jrec key). It now gates THREE things: coherent tier, the tracker, and channel 3\'s binding.' },
      { who: 'libertyville', ask: 'Ratify the portal jrec schema with per-person entitySpec + the binding fields (nashville_prostan8 at minimum; role/scope fields pending open question 1). seeley is bringing the full SeedDrop use case — this model is its skeleton.' },
      { who: 'leyden',       ask: 'Vet the channel boundary: your LINK + tier flip is channel 2, exactly per the settled writer split. Confirm the binding (channel 3) stays OUT of your domain — it must not become an inode or couplet.' },
      { who: 'seeley',       ask: 'Add channel 3 to seeddrop-lifecycle.md. The regjourney terminal now has a SECOND consumer: same registration event, nashville writes identity (prostan8) AND the scope binding. Also: this is the flywheel\'s "value before upgrade" step — your conversion narrative.' },
      { who: 'nashville',    ask: 'The binding write at registration: prostan8 onto the portal jrec via senath_relationshipKey cross-ref. One extra HSET in the handler you already own.' },
      { who: 'sunrise',      ask: 'home.html embed slot for grantor portals, using the uwchlan iframe-auth pattern (window.parent._app). Plus the platform question: X-Frame-Options/CSP across produceflow.com <- producestandards.org.' },
      { who: 'senath',       ask: 'Done: regjourney birth fields carry the binding context. Done: thin ?jrec= link SHIPPED and is the ONLY CTA form emitted — regjourneyHash is generated unconditionally per send, so buildContextualUpgradeUrl always returns /register?jrec=<hash>; the 8-param &token= form is an unreachable defensive branch. (Corrected 2026-07-26: this line read "Pending ... awaiting go" long after it shipped and misled boston into doubting a live measurement. Status lines are not code — read sendEmail.js.)' },
      { who: 'dataset app (pilotbird/true1 lane)', ask: 'The grower-portal page itself in the willis codebase: read JWT + binding -> filter activity board to scope -> allow BOL print for those loads. Willis logic, willis discipline.' },
      { who: 'progressvillage', ask: 'PM call on WHAT home.html shows: where grantor-portal cards sit relative to estate tabs. (Per division-of-labor: sunrise owns the page, PM owns the content.)' }
    ],

    vetStatus: 'VETTED 2026-06-10. leyden: confirmed, binding is NOT a LINK — five reasons (no LICEE so no couplet; '
             + 'no bytes-at-rest crossing so nothing to materialize; no estate boundary so ~_~ doesn\'t apply; LINK '
             + 'grain is per-(PER,APP) which can\'t carry per-company scope; not journal-worthy — CRM-style state, '
             + 'not a custody change). Adding the boundary marker to --facet-link so nobody reaches for LINK on '
             + 'channel-3-shaped problems. seeley: booked as stage 5c in seeddrop-lifecycle.md — the regjourney '
             + 'terminal\'s second consumer; no contradiction with the earlier removal of nashville\'s tier write '
             + '(that was channel 2; the binding is different fields, legitimately nashville-owned). libertyville: '
             + 'endorses binding-as-jrec-state; refines grain into a record SPLIT (see Decisions tab) and sets two '
             + 'ratification gates (open questions 4 and 5 below). The 4-tier vocab is now purged from '
             + 'libertyville\'s facets — anonymous/authorized everywhere.',

    openQuestions: [
      { q: 'Who assigns the ROLE on the binding (role=grower etc.)?',
        detail: 'Derived automatically from the grantor\'s PULP/blue-test data, or an explicit grantor-side admin action? '
              + 'libertyville\'s framing of the trade: PULP-derivation gives the cleaner substrate contract (nashville '
              + 'writes role WITH the binding — one writer, one instant); explicit-grant gives cleaner consent semantics '
              + 'but imports open question 5 (grantor app as writer). Could be auto-suggest + grantor confirm. '
              + 'George\'s call on the trade-off.' },
      { q: 'Iframe mechanics across domains',
        detail: 'X-Frame-Options/CSP on {dataset}.produceflow.com must allow framing by producestandards.org; token handoff into the frame (silent SSO inside the iframe vs postMessage from parent _app). sunrise + oakley.' },
      { q: 'A-drive provisioning at registration',
        detail: 'If A-drive bytes go in-tree on canopylake, nashville\'s createSeedDropStructure shifts from Hawk-local mkdirs to canopylake SMB mkdirs — chimayo\'s born-over-SMB rule applies. nashville + chimayo.' },
      { q: 'GATING (libertyville): binding revocation needs a DECLARED writer + explicit reverse path',
        detail: 'The substrate\'s first de-escalation — everything so far only advances. Either a reverse transition '
              + '(bound -> revoked) or a separate status field; both fine. libertyville will NOT ratify the binding '
              + 'fields until the revocation writer is named. Channel 2\'s equivalent is zeroing the couplet; channel 3 '
              + 'needs its own. Candidate: the grantor-side action in question 5.' },
      { q: 'GATING (libertyville): the grantor\'s app as a substrate party',
        detail: 'Channel 3 makes willis PHP a READER of db 8 (fine — must follow --facet-db8 connection rules). If '
              + 'role-assignment or revocation is an explicit grantor-side action, willis PHP becomes the first '
              + 'non-billet WRITER in any Who-Writes-What contract. Expressible ("grantor app, under billet X\'s write '
              + 'discipline") but some billet must own that code path — build list says pilotbird/true1 territory.' }
    ],

    seeAlso: [
      'senath:--facet-three-channels (canonical facet, synced)',
      'senath:--facet-portal-membrane (channel 2 structure)',
      'senath:--facet-access-tiers (tier writer split, settled 2026-06-09)',
      'prospect:--facet-flywheel (why: authority accumulation, upgrade path)',
      'uwchlan:--facet-iframe-auth + --facet-asset-lookup (the live pattern channel 3 reuses)',
      'brooklyn:* (channel 1 user code: uCode2)',
      'vernal:--facet-resolve (channel 2 read path, verified built)',
      'nashville:--facet-seeddrop-structure (the A/F/T drive layout)'
    ]
  });
});

// =========================================================================
// serve HTML
// =========================================================================

router.get('/', function(req, res) {
  if (!req.originalUrl.endsWith('/')) {
    return res.redirect(req.originalUrl + '/');
  }
  res.sendFile('index.html', { root: __dirname });
});


// =========================================================================
// API: 2026-08-07 structure-as-truth redesign — perportal snapshot (seed list)
// Read-only snapshot of ALL jrec:perportal records, generated by
// generate-snapshot.js (shells libertyville inspect.js). senath gen-14.
// =========================================================================

router.get('/api/perportal', function(req, res) {
  try {
    var raw = fs.readFileSync(path.join(__dirname, 'data', 'perportal-snapshot.json'), 'utf8');
    res.json(JSON.parse(raw));
  } catch (e) {
    res.status(500).json({ error: 'snapshot unreadable: ' + e.message });
  }
});

router.post('/api/perportal-refresh', function(req, res) {
  var cp = require('child_process');
  cp.execFile('node', [path.join(__dirname, 'generate-snapshot.js')],
    { timeout: 60000 }, function(err, stdout, stderr) {
      if (err) return res.status(500).json({ error: String(stderr || err.message) });
      res.json({ ok: true, log: String(stdout).trim() });
    });
});

// MEP manifest — auto-generated by inject-manifest.js (marshalltown gen-10)
router.get('/api/manifest', (req, res) => {
  res.json({
    name: 'senath',
    description: '',
    endpoints: [
      { path: '/api/model', topic: 'model', description: 'API: the membrane model (static, the educational core)' },
      { path: '/api/pipeline', topic: 'pipeline', description: 'API: provisioning pipeline (who builds what)' },
      { path: '/api/portal-state', topic: 'portal state', description: 'Walks the canopylake S3 prefix for a CORP\'s portal subtree.' }
    ]
  });
});

module.exports = router;
