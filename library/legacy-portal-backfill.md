(unverified) Legacy Portal Backfill — Including Print/Legacy Docs in the Portal

Authored senath gen-9 2026-06-27 from a live investigation, FOR my next
generation. George: "many of these were printed via the legacy system,
INGLES's portal is very incomplete; help include them even if they went
the legacy route." This is the plan + the tools I built to investigate.

=== THE PROBLEM ===

The portal (outgoing/<companyId>/ + aprons, read by portland's manifest)
is only populated by (a) the MODERN send path (sendEmail.js writes the
PDF+apron) and (b) portland's one-time 6/3 backfill (log-correlated SENDS
only). Documents printed/emailed via LEGACY paths never land in the
out-box, so the portal is missing most recent docs. Live proof: of a
50-doc sample from June, only 5 were modern; 45 were legacy.

=== THE DATA SOURCE — THE CSV IS THE INDEX. NEVER WALK PRNTHIST. ===

D:\clients\willdev\emailback\emails.csv on Hawk (bridge:
//15.30.60.44/hawk/d/clients/willdev/emailback/emails.csv) is a directory
dump of every PDF printed since ~2026-06-05. 1670 rows; 1550 real docs
(118 drivecheck test-noise, 2 _test). Columns: folder,file,size,type,
created,mod,accessed. prnthist has tens of thousands of folders — DO NOT
glob/walk it (billet warning). Work from the CSV; do TARGETED single-file
reads only, at paths derived from CSV rows.

Real docs live at the load layout:
  ...\prnthist\{load}\{date}\{who}\{ext}\{load}_{type}_{n}.pdf
So load/date/who/ext/type/n are recoverable FROM THE PATH (zero SMB).
Sample inventory: 637 invoice, 509 bol, 222 passing, 131 harvesterlotreport,
38 repackreturn, 7 purchaseorder, 4 saleconf; 506 loads; June 5–27.

=== THE THREE LEGACY STATES (the key finding) ===

Probing each doc's email/{n}.json companion classifies it:
  state3 MODERN   email json WITH companyId/pulpId  -> already portal-ready
  state2 MINIMAL  email json, NO companyId/pulpId    -> legacy email path;
                  has recipient EMAIL but no identity fields
  state1 NO_JSON  no email/{n}.json at all           -> print-only; never
                  emailed (so portland's send-log backfill never saw it);
                  no recipient known
50-doc sample: 25 MINIMAL, 20 NO_JSON, 5 MODERN. (Proportion likely skews
by date — modern rollout was progressive; run the full probe for truth.)

=== UNIVERSAL COMPANY RECOVERY — THE HTM CONSIGNEE ===

Every doc has a sibling {load}_{type}_{n}.htm (what wkhtmltopdf rendered),
present in ALL states. It carries the company in known spans:
  id="consignee">Ingles Markets   (also id="id_name">...)
Sample recovery rate: 50/50 (100%), including every NO_JSON doc. So the
company is recoverable for EVERY doc regardless of legacy state — this is
the backbone of the backfill. (ext code is NOT a reliable key: xlq alone
is 182 docs across many salesmen = catch-all. Use the htm, not ext.)

CAVEAT: consignee is the company NAME ("Ingles Markets"); the out-box
folder is the companyId CODE (INGLES). You need name->companyId:
  - bootstrap from MODERN docs (they carry BOTH companyId and an htm
    consignee — harvest the pairs);
  - fall back to the company registry (ROOT / companies table) for
    companies with no modern doc.

=== THE TOOLS (c:/clients/senath/tools/, committed) ===

  csv-inspect.js   parse CSV -> out/emails-normalized.json + summary.
                   Reads one local file. `node csv-inspect.js [csv]`
  doc-probe.js     TARGETED per-doc probe (capped): reads email/{n}.json
                   (state) + htm (consignee). `node doc-probe.js --limit N
                   [--type bol] [--base UNC]` -> out/probed.json
  portal-gap.js    one out-box listing + apron-name membership test ->
                   which probed docs are MISSING from outgoing/<co>/.
                   `node portal-gap.js --company INGLES --consignee Ingles`
                   -> out/gap-INGLES.json
Cache the CSV locally first (one SMB copy) so tools never re-hit the share.

=== TWO LAYERS OF "INCLUDE IN THE PORTAL" ===

1. THE FOLDER (bytes, per-company) — backfillable for ALL states, because
   company comes from the htm. Copy each CSV doc's PDF to
   outgoing/<companyId>/ with a portland-convention apron
   ({date}_{who}_{ext}_{stem}.pdf + .email.json). This is portland's
   stage4_copy pattern, but CSV-driven instead of log-correlated, so it
   catches print-only (NO_JSON) docs the send-log missed.
2. THE ACCESS (who may see it, per-person) — the perportal scope binding
   (senath:--facet-three-channels). A registered person bound to INGLES
   sees the WHOLE INGLES out-box, so per-doc recipient is NOT required for
   access — which is good, because NO_JSON docs have no recipient. The
   binding is company-grained for visibility; the doc just needs to be in
   the folder.

=== UPDATE 2026-06-27 — portland's canopy manifest changes the gap method ===

portland built make_manifest_canopy.js (c:/clients/portland/) which reads
the OUT-BOX APRONS DIRECTLY (ground truth), not the frozen portal_sends.json.
Live result: 44 companies / 504 docs in the out-box (INGLES 50, MELOND 85,
HARTEE 64). This is the listing side of option (b) (still a snapshot;
request-time reader gated through detroit is portland's next step).

CONSEQUENCE FOR THE GAP METHOD: don't list per-company with portal-gap.js.
Instead diff TWO sets by apron-name:
  PRINTED (1550)  = out/emails-normalized.json  (my CSV index)
  PRESENT (504)   = portland's portal-manifest-willis.json  (out-box truth)
  GAP = PRINTED minus PRESENT  -> the legacy docs to backfill (all companies
        in ONE manifest read; no per-company SMB listing).
The 1550-vs-504 delta (~1000) is the legacy gap quantified. After the
backfill writes docs into the out-box, RE-RUN make_manifest_canopy.js to
surface + verify (the count rises). portland's builder and my backfill are
complementary: I WRITE legacy docs into outgoing/<co>/; portland's builder
LISTS what's there. Sequence: backfill -> rebuild manifest -> visible.

=== THE BACKFILL PLAN (next-gen, in order) ===

  1. Full probe: run doc-probe.js over all 1550 (batched, e.g. 200 at a
     time with resume; each is one targeted read — slow but not a search).
     Get true state distribution + consignee per doc.
  2. Build name->companyId dictionary (modern-doc bootstrap + ROOT
     fallback). Flag consignees with no mapping for George.
  3. Per company, run portal-gap.js -> the missing list.
  4. Backfill writer (new tool, mirror copyPdfToCanopylake): for each
     missing doc, copy prnthist PDF -> outgoing/<companyId>/ with apron
     (ownerSource:'legacy-backfill', recipient from state2/3 email json or
     null for state1). UNC path, not M: (per-session trap; see
     --facet-portal-membrane). Non-fatal per doc; log skips.
  5. Trigger portland manifest regen (or the live reader) so the docs show.

=== OPEN QUESTIONS FOR GEORGE ===

  1. PRINT-ONLY (NO_JSON) docs: belong in the portal at all? They were
     printed but never shared with anyone (no recipient). The folder is
     per-company so they CAN go in, but should "never emailed" docs be
     visible to a partner? (My lean: include — the portal is the company's
     document history, and access is gated by the binding anyway.)
  2. name->companyId authority: is ROOT/companies the canonical map, and
     who owns resolving consignee-name ambiguity (e.g. "Harris Teeter -
     Greensboro" vs "Harris Teeter - Indian Trail" = same companyId?).
  3. Doc-type scope: backfill ALL types, or only customer-facing ones
     (bol/invoice/passing) and skip internal (harvesterlotreport)?
  4. Is emailback/emails.csv a one-shot export or refreshed? If one-shot,
     the steady-state answer is still "modern path + live reader," and
     this backfill is a one-time catch-up for the June legacy gap.

=== APRON CONTRACT — RATIFIED WITH portland gen-2 (2026-06-27) ===

portland confirmed the whole plan and pinned the exact contract his canopy
builder (make_manifest_canopy.js) needs. The step-4 backfill writer MUST
emit aprons to this spec or docs won't list:

  FILENAME (convention, builder DERIVES date/who/ext from it):
    {date}_{who}_{ext}_{stem}.email.json   with matching {stem}.pdf -> .pdf
  APRON JSON minimum fields:
    owner       (companyId)            REQUIRED — builder keys on this
    load                               REQUIRED
    recipients[]                       (may be [] for NO_JSON print-only)
    sentAt
    docType     (builder falls back to parsing the stem if absent)
    deal        (null OK if unknown)
    ownerSource:'legacy-backfill'      (builder is source-agnostic:
                                        live-send/log-correlation/legacy-backfill
                                        all list identically)
Bottom line (portland's words): "as long as the filename follows convention
and the apron has owner+load, it'll list correctly."

GAP METHOD confirmed authoritative: my CSV(1550) MINUS portland's canopy
manifest(504) by apron-name. His manifest is the authoritative PRESENT set.
SCALE: manifest re-run reads aprons over the bridge ~60-90s/504, so ~3-4min
for the post-backfill 1550. Batch-fine, not instant. When option-b
(request-time reader, gated through detroit) lands, the re-run step vanishes.

HANDSHAKE: portland will re-run make_manifest_canopy.js + redeploy once I
ping that a batch is copied. So the sequence is: copy batch -> ping portland
-> he rebuilds + redeploys -> verify count rose.

GATE: do NOT start the backfill batch until George answers OPEN QUESTIONS
Q1 (include NO_JSON print-only?) and Q3 (which doc types?) — they change
WHICH docs get written. Contract + tooling are ready; the go-decision is
George's.

=== SEE ALSO ===
  senath:--facet-portal-membrane     out-box structure, apron convention, UNC rule
  senath:--facet-three-channels      the binding (access layer)
  senath:--facet-portal-wiring       how a recipient connects to the out-box
  portland:--facet-portal-build      stage4_copy (the pattern to mirror)
  leyden/portal-wiring-plan.md       the live cross-team coordination doc

— senath gen-9 2026-06-27 (apron contract ratified w/ portland gen-2, senath gen-10)
