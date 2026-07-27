(verified gen-5, updated gen-8) Portal Membrane — Document-Sharing Directory Structure

The portal lets one CORP share documents with another through a uTERA
membrane. It replaces the legacy anonymous token-cache
(portal/cache/email|company/*.json), which has no concept of authority.

## Where it lives

Each CORP's portal area sits in its canopylake inode tree:

  local_c/server/produceflow/portals/

willdev CORP — verified 2026-05-22 via chimayo /read-json:
  prostan8 9xn6xk6a, shard 9x
  Drive C SMB path: \\172.31.24.120\canopylake\inode3\9x\9xn6xk6a\local_c
  local_c children: server (Directory), service (Directory), dbf/app/prg (links)
  server/ exists as a Directory inode but is EMPTY — nothing below it yet.

server_f (Drive F) mirrors local_c/server/ — chimayo materializes it as a
REAL duplicate directory (identical .inode.json), not a symlink, due to
S3 Files SMB constraints. Mirroring is by convention. Content under
portals/ is reachable via both Drive C and Drive F paths.

## The structure

  portals/
    outgoing/
      {recipient}/   Documents THIS corp sends to {recipient}. This corp
                     owns it, controls it, can sever. sendEmail.js writes
                     documents here.
    incoming/
      {sender}/      A <link>-type inode whose ~_~ epath points into
                     {sender}'s outgoing/{thiscorp}/. A read-only window.

Both sides under one portals/ so the membrane is visible as structure.

## Ownership boundary

  outgoing/   Container AND content owned by this corp.
  incoming/   Container + the <link> entries owned by this corp. What
              each <link> RESOLVES TO is owned by the counterparty. The
              ~_~ in the epath is the ownership boundary; the authority
              check fires there.

## The LINK inode — syntax

incoming/{sender} is a <link>-type inode. Its epath uses the cross-entity
form (authority: chimayo:--facet-link-resolution):

  ~_~$$<prostan8>$$~<sub>~<path>     OR     ~_~$<username>$~<sub>~<path>

The ~_~ marks the cross-entity boundary. When the inode tree is walked,
the resolver reads the Link inode, resolves the target entity, and writes
a fully-resolved .link.json (app, appProstan8, subpath, preyName,
driveLetter, serv, servProstan8) so consumers do ZERO DDB lookups at read
time. A portal incoming LINK resolves to the counterparty CORP's
outgoing/{thiscorp}/ directory. The LINK syntax IS the mechanism that
makes incoming/ work — it is not a copy, it is a resolved pointer.

## The membrane

A membrane is built from LINK grants. Cross-company sharing needs only
ONE LINK grant (grantor -> grantee) — reciprocity is NOT required. In the
SeedDrop case the initial membrane is one-directional: willis shares
documents outward; the recipient may never share back.

Bidirectional sharing is a reciprocal pair of grants:

  willis outgoing/farmwey  --(willis grants farmwey)-->  farmwey incoming/willis
  farmwey outgoing/willis  --(farmwey grants willis)-->  willis incoming/farmwey

LINK grant = company-to-company. USER grants = per-individual access
through the boundary. Arbiter = pflowcorp (ProduceFlow), the SUP that
makes the rules. See atlanta / inola / cirrus --facet-membranes, Doc 04.

## How sendEmail.js writes the document bytes

- The prey server (Hawk, Windows Server 2003) maps the bridge SMB share:
    net use X: \\172.31.24.120\canopylake /user:smbuser <pw>
  smbuser is the canonical credential; guest is W2K3 fallback only.
- An NTFS junction on the prey's local disk redirects a local path to the
  canopylake path:
    mklink /J D:\clients\willdev\portal\{recipient}  X:\...\outgoing\{recipient}
  Junctions scale (38,000+ fine). See effingham:--facet-junctions.
- sendEmail.js writes a plain fs.writeFileSync to the junction'd path.
  Zero new code.
- Writing document bytes into an ALREADY-EXISTING directory is a direct
  SMB write. All writes go via SMB through the bridge — never the S3 API
  (creates root:root), never NFS. See effingham:--facet-posix-ownership.

## Provisioning — how the directory + LINK inodes get created

Two stages:

  1. TRANSACTION — a uTERA transaction writes the inode record into the
     DynamoDB inode3 table.
  2. MATERIALIZATION — chimayo polls the inode3 DDB Stream and writes
     .inode.json / .link.json to canopylake via SMB. AUTOMATIC and
     already running. Once the DDB record exists, chimayo materializes it.

PROVISIONING — RESOLVED 2026-05-23. The API server for uTERA
transactions is prosser (prosserEntityApi): Express REST, Monkey:3005 /
Eagle:3001, wraps creedmoor's creator_*.js. What had been gaps as of
2026-05-22 are now resolved:

  outgoing/ chain (produceflow/portals/outgoing/{recipient}/)
    Per inola:--facet-inode-vs-appdir (2026-05-22): these are PLAIN
    application directories, NOT inode-recorded. Created by mkdir on
    canopylake (via chimayo /write-json or direct SMB once junction is
    mounted). No prosser endpoint needed.

  incoming/<sender> <link> inode
    prosser shipped POST /createLink on Monkey:3005 (2026-05-23).
    creedmoor already had creator_link.js extracted; prosser wired the
    HTTP endpoint. This is the membrane-creation API.

Still pending: POST /createDirectory on prosser (for future cases where
a directory inode IS needed under an existing tree — NOT required for
portal-membrane).

Work split:
  application — mkdir on canopylake for outgoing/ chain (plain dirs)
  prosser     — POST /createLink for incoming/ membrane (LIVE)
  creedmoor   — creator_link.js (extracted) + future inode wrappers
  colebrook   — CORP inode skeleton design (colebrook:--facet-corp-skeleton)
  chimayo     — materializes <link> inode + .link.json automatically

## Status as of 2026-05-24 (gen-8)

INFRASTRUCTURE READY but SENDEMAIL.JS NOT YET WRITING THERE:

- prosser POST /createLink — LIVE on Monkey:3005 (2026-05-23)
- chimayo materializes <link> inodes automatically (DDB stream poll) — LIVE
- canopylake reachable from georg via SMB read at \\15.30.60.44\canopylake
  (use this for inspection only; writes go through prey servers via
  smbuser-mounted X: drive + NTFS junction per the "How sendEmail.js writes"
  section above)
- leyden's createinodelink_modular.js — works without registration event;
  takes (tableSuffix, entityUsername, driveName, linkDisplayName,
  appUsername, subpath). Confirmed gen-3 message 2026-05-24.

## CANOPYLAKE WRITE — BUILT gen-8, FIXED + APRON-ALIGNED gen-9 (2026-06-10,
## tested green in production: live PDFs landing in outgoing/INGLES/)

sendEmail.js writes the PDF to the CORP's canopylake outgoing folder
using PORTLAND'S PORTAL CONVENTION (portland:--facet-portal-build):
  {date}_{who}_{ext}_{srcFileNoExt}.pdf          one copy per document
  {date}_{who}_{ext}_{srcFileNoExt}.email.json   the APRON
Apron JSON: {sentAt, docType, docName, load, deal(abc), owner(companyId),
ownerSource:'live-send', sourcePdf, recipients:[{email,sentAt}], sendCount}.
RE-SEND of the same document: PDF skipped if present, apron MERGED
(recipient appended, sendCount++). The portal page renders FROM APRONS —
a PDF without an apron is invisible to the portal UI. date/who/ext come
from the prnthist path parts (pdfFile parts[3],[4],[5]).
ownerSource:'live-send' distinguishes my per-send writes from portland's
batch backfill ('log-correlation' / 'json-abc+log-routing').
Records senath_canopylakeSubpath on the portal jrec. Non-fatal: any
failure is logged and skipped; S3 + jrec + SES still complete.

RECIPIENT KEY = companyId. LOCKED 2026-06-07 by George. Folder is
outgoing/{companyId}/ (e.g. outgoing/INGLES/) — documents are a COMPANY
relationship, all people at Ingles share the company's documents. The
per-PERSON part is ONLY the access LINK (leyden, at registration),
pointing each registered person's tree at the same company folder.
Folder = company; LINK = person. (I wasted time insisting the folder be
per-person — it never was. The folder holds bytes; the LINK grants
access. Different things.)

### portal-config.json — how sendEmail.js finds the path

Per-prey file at D:\clients\{dataset}\portal-config.json. sendEmail.js
reads it on startup. CANNOT hardcode the CORP prostan8 (varies per
dataset). Shape:
  {
    "dataset": "willis",
    "corpProstan8": "82vlsz7s",
    "shard": "82",
    "canopylakeOutgoingPath": "\\\\172.31.24.120\\canopylake\\inode3\\82\\82vlsz7s\\local_c\\server\\produceflow\\portals\\outgoing"
  }
- canopylakeOutgoingPath MUST BE UNC, never a drive letter — see below.
- preston owns provisioning this file (added to onboard journey as
  preston_portalConfig; UNC is the ratified spec as of 2026-06-10).
- inola provides the values (test-portal-setup.js reports prostan8+shard).
- Missing file => canopylake write skipped cleanly (logged at startup).

### UNC, not drive letters (RESOLVED 2026-06-10 — the gen-8 caveat fired)

Mapped letters (M:, X:) are PER-LOGON-SESSION on Windows. George's
interactive M: works on the console; the Apache service session that
PHP-execs sendEmail.js never ran net use, so M: does not exist there —
mkdir fails ENOENT on a path that exists interactively. THE FIX: put the
UNC path (\\172.31.24.120\canopylake\...) in portal-config.json. UNC
needs no mapping and worked from the Apache context with no extra
credentials (bridge force-user=smbuser handles ownership). Verified live
on willis 2026-06-10. W2K3 side notes still true: no mklink; junction.exe
rejects network targets.

WILLIS COORDS (confirmed inola gen-6, 2026-06-07):
  CORP name in DDB: williscorp (NOT willis — the dataset dir is willis;
  the junction/path bridges the two names)
  prostan8: 82vlsz7s, shard: 82
  portals/outgoing/ already exists on canopylake.

### Still not built (Tier 2 -> authorized / Tier 3 LINK)

- First-send LINK trigger — leyden has createinodelink_modular (works
  without a registration event; args: tableSuffix, entityUsername,
  driveName, linkDisplayName, appUsername, subpath). Needs a caller.
  Proposed: senath writes senath_recipientProstan8 on the portal jrec
  when identityCheck.isRegistered=true; leyden watches for tier=anonymous
  + that field set + canopylake folder exists; fires the LINK and
  advances tier anonymous->authorized.
- The per-person-vs-per-company tension in the portal jrec: record is
  per-company but leyden's LINK fields are per-person. When multiple
  people at one company register, leyden's per-person LINK data may need
  a separate per-person record. Leyden's call when wiring authorized.

## Tier 1 Live Stack (2026-05-24, gen-8 — for future-me reference)

Currently working in sendEmail.js, NOT replaced by Tier 2 yet:

1. S3 PDF upload — produceflow-documents-temp bucket, random key, 6-month
   lifecycle. Uses AWS SDK already loaded for SES (NOT aws CLI — Hawk has
   no CLI installed; never recommend installing it).
2. jrec.upsert portal:WILLDEV:INGLES with senath_* fields, tier=anonymous
   at birth (HSETNX preserves promotions on re-send).
3. jrec.upsert regjourney:<hashId> with 8 params + senath_relationshipKey
   pointing at the portal record.
4. CTA URL has &jrec=<hashId> appended to 8 params (back-compat — nashville
   validates new param matches Redis record before old params are dropped).
5. Email rendering — emsworth's createConditionalHtmlEmail with s3DocumentUrl
   fallback to old portal URL.

## Open decisions (still)

- Bake portals/ into the CORP skeleton (colebrook + creedmoor extend
  createCorpInodes) vs. add a runtime /createDirectory endpoint.
- Who triggers provisioning on first send to a new recipient.
- Hot/cold tiering: canopylake vs legacylake for document bytes.
- Legacy token-cache (portal/cache/email/*.json on prey disk): survives
  alongside canopylake, or replaced.
- Sub-foldering inside outgoing/{recipient}/ — flat vs by date/load/type.
- Recipient keying — companyId, recipientEmail, or pulpId. SAME decision
  blocks jrec key shape AND canopylake folder name. senath argued for
  recipientEmail (per-person tier semantics force per-person record);
  George hasn't committed.

## Who to consult

  effingham         — bridges, SMB, junctions, posix-ownership
  chimayo           — canopylake materializer, inode3 -> filesystem write
  inola             — inode topology, membranes, Drive F
  atlanta           — uTERA membrane spec (Doc 04)
  prosser           — uTERA entity/transaction API (prosserEntityApi)
  creedmoor         — creator_*.js transaction modules
  colebrook         — CORP inode skeleton
  leyden            — createinodelink_modular (Tier 3 LINK creator)
  libertyville      — jrec state-machine substrate
  mississippistate  — Cruise Mississippi / SeedDrop flow coordination

== PORTAL-COMPONENT STANDARD (gen-9, 2026-06-27) ==

  vernal:--facet-portal-authority is the canonical "how to build a portal
  component" standard (George-placed). It GATES this membrane facet in the
  graph. My role per that standard: I write bytes UPSTREAM to
  outgoing/<company>/ and am OUT of the serve path. The serve path is:
  detroit's gated streaming route (reads portal-config.json ->
  canopylakeOutgoingPath -> joins company/file -> streams), fronted by
  vernal's /api/doc-access?company=<CO>&dataset=<DS> (the perportal binding
  gate). Proven live 2026-06-27: INGLES 200, DAVIS 403 fail-closed.

— senath gen-5, updated gen-8 2026-05-24, gen-9 2026-06-27

## ★ VISIBILITY IS DECIDED AT THE WRITE — AND THE WRITE ADMITS EVERYTHING
(established 2026-07-27 with detroit gen-18 + portland gen-4; verified at all three layers)

There is NO document-type filter ANYWHERE in the read path:
  1. WRITE   sendEmail.js copyPdfToCanopylake() — called UNCONDITIONALLY (line ~807).
              No doctype arg, no allowlist, no guard. Skips only on missing
              portal-config or missing companyId.
  2. LISTING detroit i_portalList — no type filter; docType is DERIVED from the
              filename stem and passed through as description only.
  3. PAGE    portland — chips built from whatever docTypes the listing returns.

**So the rule today is: if a document is emailed to a company, it is in that
company-s outgoing folder and portal-visible to that company-s bound partners.**
Nothing anywhere decides otherwise. This is a POLICY VACUUM, not a defect — but it
means MY WRITE IS THE SOLE POLICY POINT. If a type should ever be non-portal-visible,
the decision must live at the write (or someone adds a listing filter and says so).
Do NOT invent such a filter on senath authority: it is a George/business ruling.

What is actually in the folders (Sent-page extract, WILLIS, tagged window only):
  57 messages, 100% company-tagged -> all copied.  bol 21 | document 19 | invoice 16 | po 1
  PASSINGS: ZERO. lakeland-s passings-to-external finding is a DIFFERENT population —
  not through this path, not in the membrane. Caveat: pre-7/22 sends are untagged and
  excluded as legacy, so this is what is VISIBLE, not proof of what EXISTS.

EXTENSION SYMMETRY: my write is PDF-only (destPath always .pdf) and detroit byte route
serves .pdf only. detroit listing is format-agnostic, so a NON-PDF dropped in a folder
by something else would LIST and then fail to open. That asymmetry cannot be triggered
by the send path.

LESSON (detroit): two layers each assuming the other gated it is how a policy ends up
existing nowhere. A filter you do not have cannot be assumed.
