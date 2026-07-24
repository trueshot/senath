(verified) Portal Status Surfaces — arapmast PORTAL flag + live tri-state route (as of 2026-07-24, gen-11)

Two LIVE production surfaces I own that answer "who has a portal", plus the
hard-won gotchas from building them. Nothing here is planned — all shipped.

== 1. ARAPMAST.PORTAL FLAG (the durable ERP-side fact) ==

George added PORTAL l(1) to the arapmast template; I populate + maintain it.
- One-shot/reconciler: c:/clients/senath/tools/populate-portal-flag.js
  (dry-run default; --write; --only <CO> sets ONE company T without touching
  any other row — used for PROMIS, George's pre-provisioned grower).
  T iff canopylake outgoing/{ID_NO}/ exists; explicit F elsewhere.
- ONGOING: sendEmail.js setPortalFlag() fires ONLY when copyPdfToCanopylake
  creates a company folder (once per company lifetime) — same event that makes
  the flag true, so no drift. Structure gates (reclen + field presence) abort
  on any table drift; wholly non-fatal to the send. Deployed to preys 7/23.
- willis populated 7/23: 62 T (61 folders + AUBURN duplicate ID_NO — two master
  rows share it, both T) / 1113 F. willdev dbf NOT restructured yet (70 fields,
  no PORTAL) — helper skips harmlessly there until the template is applied.
- This flag = "has portal documents waiting", NOT "someone can see them".

== 2. LIVE TRI-STATE ROUTE (the fresh page-side fact) ==

c:/clients/willdev/nodejs/portal-status.js — prey-runtime (deploys with the
willdev chain like sendEmail.js; my senath repo deploys to MONKEY, never the
prey — this split cost a wrong handoff once, remember it).
- Mounted by detroit: GET /api/v1/portal/status/:dataset (i_portalStatus,
  per-dataset module resolve from clientConfig, vernal operator gate).
- getStatus(opts, cb), opts={outgoing, dataset, redisClient} — the EXPORTED
  module requires NO redis lib (a top-level require crashed TrueAPI at load on
  prey Node 5.12); detroit passes a CONNECTED node-redis 2.8 client on db 8 and
  owns its lifecycle. scanMembers uses the 2.8 scan API (cursor loop).
- Merges canopylake folder readdir (docCount + newest FROM THE DATE-PREFIXED
  FILENAME — zero stats) with jrec:perportal:{DATASET}:* active scopes.
  States: active | documents-waiting | bound-no-docs | none. COUNT-ONLY by
  design (zero PII = secord-clean); member ROSTER is vernal's lane.
- Live finding 7/23: WILLIS 63 folder-companies -> 30 active,
  33 documents-waiting (docs nobody can see — the actionable third).
- KEY CASE TRAP: perportal keys + folders are UPPERCASE (WILLIS); lowercase
  silently drops the whole member join.
- Allow-path still 403s pending vernal's Canopy operator grant; deny paths
  verified live. Future direction (George-affirmed, PARKED): salem-growler
  per-company derived doc; my module is the render half; preamble pinned in
  task #15 (two change feeds, dirty-mark-not-mtime, tmp+rename atomic — my
  extract-email-log.js writeJson() is the proven atomic-write pattern).

== HARD-WON GOTCHAS (grep bait — each of these cost real time) ==

- ★ ORDHEAD.DBF IS FORBIDDEN (George 2026-07-24, absolute — see billet
  warnings). Also NEVER per-record-scan ANY DBF over SMB from georg:
  ~50ms/record round-trip means 6000 records ≈ 5 minutes for nothing. On the
  prey the same read is local and instant. Demo prey-code ON the prey.
- ★ Edit-tool \u0000 escapes become LITERAL NULL BYTES in the written file
  (JSON layer decodes before write). Symptom: grep calls the file "binary",
  Edit can't match lines cat shows, git sees binary. Diagnose with cat -A
  (shows ^@). Fix: git checkout the file, re-edit using character classes
  like [^A-Za-z0-9_] instead of null escapes.
- ★ convo2 messages: NEVER put backticks in the message string — bash command-
  substitutes them and the text ships with silent holes exactly where the
  emphasized words were.
- node --check passes on Node-22 syntax that CRASHES prey Node 5.12. Scan for
  violations separately: arrows (=>), backticks, ^\s*(let|const)\s. String
  .includes is ES2015 — use indexOf like the rest of sendEmail.js.
- gitgeorg auto-pull to Monkey needs one-time on-Monkey:
  git config --global --add safe.directory D:/clients/senath   (SMB-cloned
  repos are "dubious ownership" to Monkey's Administrator git). And hand-copied
  files block the first pull as untracked — remove them, then pull.
- Reggi (Monkey 3005) mount pattern: file OUTSIDE host repo, hostRequire
  (require.main.require) for express, secret-first middleware, 503-if-data-dir-
  missing, router error backstop. prosser's DynamoDB landmine: NEVER touch
  AWS.config globals in anything that could load in Reggi.
- Monkey periodic jobs = Windows schtasks (fleet pattern; bat-loop is for
  daemons). Mine: senath-extract, 15 min, SYSTEM.
- SNS email subscriptions die behind corporate link-scanners (lifecycle links
  get pre-fetched; pending entries decay to Deleted with no human click; same
  scanner class fires false SES opens). Use an unscanned inbox (gmail).
- SES message tags ride X-SES-MESSAGE-TAGS raw header (NOT the SDK Tags param
  — ancient prey aws-sdk could throw on a real send). Values [A-Za-z0-9_-]
  only. Tag values are case-preserved: the log contains WILLIS and willis —
  normalize on read.
