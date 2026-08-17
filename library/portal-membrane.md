(verified gen-5, updated gen-8, THREE-AREAS REWRITE gen-14 as of 2026-08-07) Portal Membrane — Document-Sharing Directory Structure

## ★ AS OF 2026-08-07 — THREE-AREAS LAYOUT IS LIVE (read this before the rest)

George ruled and senath executed same day (design: c:/clients/inola/
proposal-three-areas-three-links.md rev 2; George GO + "migrate" verbatim in
senath gen-14 session). Everything below this section describing a FLAT
outgoing/<CO>/ is historical.

CURRENT SHAPE (willis, LIVE + migrated — 73 portals, 1,323 documents):
  portals/outgoing/
    _portals.json              dataset rollup (Regime A index; operator-level)
    <CO>/
      documents/               partner-visible membrane. ALL documents +
        _manifest.json         aprons live here now (1,323 pairs migrated
        {date}_{who}_{ext}_..  2026-08-07; zero left flat, zero lost)
      appdata/                 app working files (114 orphan thumbnails
                               quarantined here at migration; detroit thumb
                               route writes here)
      access/                  RESERVED, EMPTY — uTERA Regime-U projection,
                               fills only when George rules the frozen design

REGIME RULE (inola+George, the keeper): Regime U = uTERA-written authority
(access/, .link.json, chimayo only). Regime A = application files (documents,
aprons, manifests) — NEVER authority. No app file may be an authority record.

MANIFEST CONTRACT (senath owns; three conformed writers: sendEmail.js
live-send, portal-doc-writer.js portal-generate, lakeland
attachment-doc-writer manual-drop):
  - documents/_manifest.json per company; entries keyed by pdf filename =
    idempotent read-modify-write; .tmp+rename; NON-FATAL (never blocks a
    send); folder is TRUTH, manifest is rebuildable INDEX.
  - ABSENCE-PRESERVING (portland's catch 08-07): provenance fields appear
    IFF the apron carries them — "recipients[] present IFF emailed" answers
    identically from apron and manifest. Display/sort convenience = `when`
    (first of sentAt/generatedAt/droppedAt).
  - _portals.json rollup = sweep-maintained (allowed to lag; writers do NOT
    update it — race-free by design).

WRITE PATH: both my writers gate on portal-config.json "documentsSubdir":
true (LIVE on willis since 08-07; willdev has NO portal-config = no
canopylake writes there). sendEmail writes UNC directly — there is NO prey
junction (a gen-6 MEP diagram claimed one and misled a reviewer; annotated).
The PHYSICAL wall = effingham's per-company scoped SMB shares (their
portal-wall-mechanism.md) — DECISION on George's board. Rationale CORRECTED
2026-08-08 (effingham retraction after live tests with George): the earlier
"dot-dot escapes a reparse point" claim was WRONG in mechanism — Windows
normalizes .. lexically on the CLIENT before any junction or SMB server sees
the path. The correct, stronger argument: a junction (or any client-side
path) is convenience, not control — it grants nothing and restricts nothing;
enforcement exists only server-side at the Samba share root. Additionally
junction-to-network is dead on modern Windows (mklink /J fails on UNC and
mapped-drive targets; only /D symlinks work); W2K3 prey untested as of
2026-08-08. And bridge-0's broad [canopylake] share is guest ok = yes with
no valid users — so the wall = scoped shares PLUS auth partition. Constraint
from this file's owner: the auth partition must preserve the prey send
context's UNC write to outgoing/ (sendEmail.js), or sends fail.

MEMBRANE NAME-RECOGNITION CONTRACT v1 (senath 2026-08-11, binding on ALL
membrane writers — born from lakeland's re-drop double-wrap, MELONO):
- A filename is ALREADY membrane-named iff it matches ^\d{8}_[^_]+_[^_]+_.+
  ({date}_{who}_{ext|attach}_{stem}).
- NO writer may wrap a name that already matches — regardless of whose
  writer produced it.
- Receiving an already-membrane-named file: same name exists in target
  documents/ → keep existing bytes, merge apron (recipients/dropCount++),
  update manifest entry. Not exists → file under its ORIGINAL name
  unchanged; write apron with your ownerSource.
- Only non-matching names get wrapped with the receiving writer's prefix.
- False-positive risk (user file coincidentally matching) is benign: it
  files as-is under its own name.

TOOLS (senath repo, all georg-runnable over the 15.30.60.44 bridge —
bridge is georg-READ-WRITE for canopylake):
  tools/build-portal-manifests.js [--dry-run|--only CO|--base P]  index sweep
  tools/migrate-portal-documents.js [same flags]   the one-time migration
  tools/cleanup-perportal-sendborn.js [--live]     db8 send-born scope purge
    (RAN 2026-08-07: 5 keys deleted incl Susi 4tdh4tli 23-send + George's own
    bk6l2u8y; Will bjynfi2b kept PROMIS invite only; backup =
    tools/backups/perportal-backup-2026-08-07T15-55-21-906Z-LIVE.json)

GOTCHAS PAID FOR:
  - NEVER index in the same breath as bulk SMB renames — the S3-gateway dir
    listing LAGS; migration undercounted 1085/1323 until re-swept settled.
  - MANIFEST SWEEP DOES NOT PRUNE DELETIONS (senath gen-16, 2026-08-12):
    build-portal-manifests.js merge-preserves EVERY prior entry (its merge
    overlays the old manifest unconditionally), so a file that was DELETED
    leaves a PHANTOM entry — the portal lists a document that 404s on click.
    Pair any deletion from a portal folder with a manifest prune:
    tools/prune-manifest-phantoms.js (fast listing to find candidates, direct
    stat to confirm ENOENT before pruning, self-healing — a wrong prune is
    rebuilt by the next sweep). Removing the entry breaks the copy-forward
    chain, so the fix is durable. Found+fixed exactly 2 tree-wide: FARMER +
    MELONO (gen-15 deleted the double-wrap BYTES but not the entries); full
    74-portal audit clean after.
  - jrec:portal is DEMOTED (display reads manifests) but sendEmail still
    writes it as a harmless log; jrec:perportal is the INTERIM membership
    store (cleaned, frozen against send path ONLY — registration + invite
    still write) until George's four uTERA rulings land.
  - vernal ruled the cleanup's deletion (vs status-stamp revocation) a
    legitimate exception — dated note in vernal's portal-authority facet;
    no-removal still governs legitimate bindings.


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

server_f (Drive F) IS local_c/server/ via POSIX symlink, created Linux-side
on the bridge (bridgeport:--facet-symlinks). [CORRECTED 2026-08-09 per
George's ruling 2026-08-08, relayed by inola gen-6 (LINK/MAP drift
cleanup): maps/links are POSIX symlinks; duplicate-dir materialization was
chimayo DRIFT and will never be ratified. The old claim here — "real
duplicate directory due to S3 Files SMB constraints" — was wrong: the SMB
constraint was only ever "cannot CREATE symlinks over SMB from Windows",
not "no symlinks". Current disk still shows duplicate dirs = drift UNDER
REMEDIATION (sweep scheduled post-client, George directing with chimayo).]
Content under portals/ is reachable via both Drive C and Drive F paths.

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
- [HISTORICAL PLAN — NEVER DEPLOYED, and REFUTED 2026-08-08: effingham's
  live tests show mklink /J fails on both UNC and mapped-drive targets on
  modern Windows ("Local volumes are required"); W2K3 untested. The deployed
  writer uses direct UNC — see WRITE PATH at top of this file.]
  The old plan was: NTFS junction on the prey's local disk →
    mklink /J D:\clients\willdev\portal\{recipient}  X:\...\outgoing\{recipient}
  with sendEmail.js writing plain fs.writeFileSync to the junction'd path.
  See effingham:--facet-junctions (corrected 08-08).
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
ownerSource:'live-send', sourcePdf, record, recipients:[{email,sentAt}], sendCount}.
RECORD vs SOURCEPDF (George-approved add-before-share contract, willdev
ADD-SHARE-CONTRACT.md §3, 2026-08-12): 'record' = the prnthist path this
projection was projected from — the CANONICAL traceability field across ALL
membrane writers. 'sourcePdf' is its live-send LEGACY ALIAS, identical
semantics. Readers use record, fall back to sourcePdf. sendEmail.js
dual-writes both since 2026-08-12 (deployed all mirrors) and backfills
record on legacy aprons at re-send. Additive apron fields propagate to
NEITHER the manifest (writers copy an explicit field list) NOR partners
(detroit projects an explicit field set) — record staying internal is by
design; projecting it to partners would be a deliberate detroit change
routed through senath first.
RE-SEND of the same document: PDF skipped if present, apron MERGED
(recipient appended, sendCount++). The portal page renders FROM APRONS —
a PDF without an apron is invisible to the portal UI. date/who/ext come
from the prnthist path parts (pdfFile parts[3],[4],[5]).
ownerSource:'live-send' distinguishes my per-send writes from portland's
batch backfill ('log-correlation' / 'json-abc+log-routing').
Records senath_canopylakeSubpath on the portal jrec. Non-fatal: any
failure is logged and skipped; S3 + jrec + SES still complete.

## APRON ownerSource CONTRACT — THREE WRITERS, ONE READER (senath gen-13, 2026-08-04)
(This supersedes the single-writer 'live-send vs backfill' note just above.)

Every file in outgoing/<companyId>/ carries a paired {name}.email.json APRON;
the portal renders FROM aprons (a file without an apron is invisible). As of
2026-08-04 there are THREE writers into outgoing/, all sharing ONE apron
convention senath owns. Discriminator = ownerSource. portland (the SINGLE reader)
renders the human LABEL off ownerSource, NEVER off field presence.

  live-send       sendEmail.js copyPdfToCanopylake (emailed doc). HAS
                  recipients[]+sentAt+sendCount. label 'Sent to you'.
  portal-generate portal-doc-writer.js fileGeneratedDoc() — doc generated in the
                  portal. NO recipients[]; generatedBy+generatedAt+generationCount.
                  label 'Generated'. (chain: detroit POST /api/v1/portal/doc/generate
                  -> highlands render -> this writer, WRITE-FIRST then stream.)
                  ★ ADD-BEFORE-SHARE since 2026-08-12 (pilot-verified, e1dea828):
                  fileGeneratedDoc now runs render->ADD->PROJECT->stream through
                  lakeland's add-writer.js — record minted FIRST in prnthist
                  (loads/prnthist/<load>/<date>/<who>/gen/ + upload/{N}.json),
                  membrane projection {date}_{who}_gen_{load}_{base}_{n}.pdf
                  written FROM the record by project() (which enforces this
                  apron family per the locked interface). Fatal-before-stream
                  on both legs. Regen: byte-identical dedups (generationCount++),
                  changed bytes = new record + new _n projection. Path-form
                  seam CLOSED same day (lakeland): add-writer composes record/
                  derivedFrom from its own coords in dataset-relative forward-
                  slash form (loads/prnthist/...), unified with the live-send
                  dual-write — readers hard-code ONE form. (Armed from
                  detroit's next bounce; the 12:17Z pilot artifacts predate it
                  and carry the absolute form — named litter, not the pattern.)
  manual-drop     lakeland attachment-doc-writer.js — operator hand-dropped a file
                  (images incl., real extension kept). NO recipients[];
                  droppedBy+droppedAt; docType='attachment'. label 'Shared with you'.
                  (detroit POST /api/v1/documents/upload/load branch, session-gated,
                  DARK until oakley's /api/v1/documents/ mint arms.)

INVARIANTS portland renders on:
- recipients[] PRESENT iff emailed (live-send). Absent = placed-not-sent;
  ownerSource says which flavor.
- ownerSource ABSENT = legacy pre-contract row -> neutral 'Available', NEVER a
  false 'Sent'.
- IDENTITY KIND is UNIFORM: generatedBy, droppedBy, and the live-send operator id
  are ALL bare prostan8 (droppedBy = caller session SUB; detroit unified it
  2026-08-04). portland resolves every source prostan8->display name identically;
  NO per-source id-kind branching.
- ABSENCE IS MEANINGFUL: a live-send apron legitimately has no droppedBy. Writers
  MUST NOT null-fill inapplicable fields; the list projection forwards VERBATIM
  (detroit pinned this in an in-code comment 2026-08-04 so a future edit can't
  helpfully null-fill).

READ PATH (took an empirical self-check to pin, 2026-08-04 — my facet-grep had
wrongly concluded 'no detroit list route'; observe > infer):
- LIVE partner page doc objects come from detroit request-time list route
  GET /api/v1/portal/list/:dataset/:company (Bearer, vernal-gated) — it parses
  these aprons and, as of 2026-08-04, forwards ownerSource+generatedBy+droppedBy+
  droppedAt.
- OPERATOR SNAPSHOT fallback = portland make_manifest_canopy.js (readdir +
  JSON.parse each apron) -> portal-manifest-willis.json; also carries the four.
- STREAMING (detroit GET /api/v1/portal/doc/:ds/:co/:file, --facet-portal-doc)
  is FORMAT-AGNOSTIC since 2026-08-05 (George-ruled; INLINE_TYPES incl. png
  stream inline) — the old "pdf-only, 400 on non-pdf" claim here was stale
  until 2026-08-13 (corrected from detroit's line-cited source read, FARMER
  case). The single stream site sits INSIDE the doc-access gate callback;
  i_portalDoc is the ONLY membrane byte-server (detroit census 08-13: no
  web-server docroot on canopylake, TrueAPI over UNC is the sole reader).
  Thumbnails remain pdf-only (non-pdf 400s BEFORE the gate).

DEPENDENTS (change an apron shape and portland breaks SILENTLY — route any change
through senath first): portland (render), detroit (list projection + streaming),
lakeland (manual-drop writer), gainesville (portal-generate route).

### FILE CLASSES in outgoing/<companyId>/ (2026-08-05 — a census MUST classify)
Three classes now share the folder; do NOT count by extension:
  {name}.pdf   OR   {name}.<img ext>   — a DOCUMENT (manual-drop can be .jpg/.png).
  {name}.email.json                    — the APRON = the doc RECORD.
  {name}.pdf.thumbnail.png             — DERIVED SIDECAR (detroit /api/v1/portal/thumb,
                                         highlands create_thumbnail, regen on PDF mtime).
                                         NO apron, EXPECTED, NOT an orphan. i_portalList's
                                         sibling resolver excludes *.thumbnail.png.
ROBUST RULE for any census/orphan tool (mine or a peer's): a file is a LISTED
DOCUMENT iff it has a paired {name}.email.json apron. Classify by APRON-PRESENCE,
never by extension — because a manual-drop IMAGE is a .png that IS a doc (has an
apron), while a thumbnail is a .png that is NOT (no apron). Extension alone is
ambiguous; the apron is the discriminator. senath's own tools are already safe:
portal-status.js counts only /\.pdf$/i (thumbnails are .png, excluded; newest
iterates only that set), portal-gap.js membership-tests exact {apron}.pdf keys and
never orphan-hunts. Verified in code 2026-08-05, not inferred.

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

★ MEASURED POPULATION — WHOLE MEMBRANE, 2026-07-28 (supersedes an earlier WRONG
figure taken from the 57-message SES tag window, which reported 4 types and ZERO
passings. The membrane has accumulated since June; the tag window starts 07-22.
I had a bounded sample and described a population.):
  66 companies, 982 PDFs
  invoice 340 | passing 337 | bol 150 | saleconf 95 | repackreturn 28 |
  po 14 + purchaseorder 3 | rpkretrn 10 | return 3 | drivecheck 1 | frconf 1
NINE+ types entered a partner-visible surface with no content test ever applied.
Pre-cleared by libertyville: BOL, PASSING. UNASSESSED: saleconf, repack/returns,
po, drivecheck, frconf — and invoice (pricing; likely passes on the own-transaction
limb, but that is libertyville/vernal to rule, not senath).

HOW TO RESCAN (cheap, filenames only, no file reads):
  //15.30.60.44/canopylake/inode3/82/82vlsz7s/local_c/server/produceflow/portals/outgoing
  (bridge export — reachable from georg. Do NOT use C:/canopylake on georg: it is a
   STALE PARTIAL view with an empty local_c/server, per detroit gen-18.)
  The UNC in portal-config.json is \172.31.24.120... which is NOT reachable from
  georg; the bridge path above is the same tree.

EXTENSION SYMMETRY [REWRITTEN 2026-08-13 — the old claim went stale 08-05]:
my send write remains PDF-only (destPath always .pdf), but detroit's byte
route is FORMAT-AGNOSTIC since 2026-08-05 (George-ruled) — a non-pdf document
(manual-drop image, drag-accident png) both LISTS and SERVES inline. The old
"lists but fails to open" asymmetry is GONE. Consequence proven by the FARMER
case (08-13): any documented non-pdf in a company folder is fully
partner-visible AND partner-servable through the gated route — the write is
the disclosure decision for images exactly as for pdfs.

LESSON (detroit): two layers each assuming the other gated it is how a policy ends up
existing nowhere. A filter you do not have cannot be assumed.

### ★ OPEN DECISION FOR GEORGE — should PASSINGS be portal-visible?
(vernal gen-8, 2026-07-27, as authority owner: "your write path is not just
delivery, it is THE DISCLOSURE BOUNDARY". Writing a file into outgoing/<company>/
is a sharing decision with the same weight as a grant — there is no second check
behind it.)

vernal ruled the no-type-filter chain is THE DESIGN, not a gap: the folder is the
unit of grantor custody. The grantor decides WHAT by placing it; the gate decides
WHO may read it. A type filter at a read layer would put a sharing decision where
it cannot know intent, and create two things deciding one question. vernal would
push back on anyone adding one downstream.

CURRENT STATE IS ACCIDENTAL, NOT DECIDED: passings ARE emailed to external
addresses (lakeland, x7 on 2026-07-27) but are NOT in outgoing/ folders, so they
are not portal-visible. Nobody chose that.
  - If passings SHOULD be portal-visible: writing them makes it so, no approval
    needed, no code change anywhere else.
  - If they should NOT: that is enforceable ONLY in senath-s write path.
NOT URGENT (nothing in the closed exposure ruling turns on it) but it is MINE, and
better decided than inherited. DO NOT invent a filter on senath authority — it is
a George/business ruling.

### ★★ PROCEDURAL OBLIGATION ON THE WRITE PATH — THE CONTENT TEST
(libertyville gen-4, RULED + DEPLOYED 2026-07-27. This is a standing check, not
advice.)

vernal + libertyville ratified that an invitation confers the STANDARD SET
(documents + orders) with no ceremony. The justification for documents membership
was a CONTENT test — a domain qualifies when its content is the invitees OWN
transaction plus facts they would learn operationally from it. Documents passed
THAT TEST ON THE BASIS OF WHAT THE FOLDERS CONTAINED WHEN IT WAS APPLIED.

**Therefore: depositing a NEW DOCUMENT TYPE silently widens what every existing
invitation already conferred — no code change, no decision at any read layer, and
the test that justified membership is never re-applied.** libertyville extension
protocol governed adding a domain KEY; it did not cover a domains CONTENT widening
under an existing key. That hole is now closed and the policy point is named:
**for documents it is senath write path, solely.**

BEFORE DEPOSITING A NEW DOCUMENT TYPE, apply the test:
  Does it carry (a) customer identity as such, (b) pricing, (c) margins, or
  (d) another partys terms or contacts?
  If YES on any -> STOP. Take it to vernal + libertyville BEFORE it ships.
  If NO -> it ships on the existing ratification.
Pre-cleared by libertyville as they stand: BOL, PASSING.
Do NOT build a read-layer filter for this — vernal ruled type-agnostic reads are
THE DESIGN. The check lives here, at the write, or nowhere.
