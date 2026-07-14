(unverified) Four Access Tiers — Portal Membrane Progression

=== SETTLED 2026-06-09 — TIER WRITER SPLIT (senath/leyden/George/seeley) ===

  WHO WRITES tier — resolved, no longer disputed:
    - senath  writes tier=anonymous at BIRTH (email send). The one moment
              sendEmail.js is actually running.
    - leyden  writes the authorization transition (tier -> authorized) in the
              SAME handler that mints the PER LINK (createinodelink), via
              require('./libertyville/jrec'), against libertyville's schema.

  WHY leyden, not senath (both decisive, both initially missed):
    1. Cold path: sendEmail.js is fire-and-exit. For a recipient who registers
       days later, senath is DEAD at LINK-creation time. It cannot write the
       flip without becoming a watcher (the anti-pattern libertyville names:
       "react to another billet's write later -> separate jrec or explicit
       re-entry, not silent re-read"). Only leyden is present at LINK creation.
    2. Materialization: LINK is canonical, tier is its reflection. leyden
       materializes the reflection in the LINK handler so the tracker reads
       tier off the record — no join back to the inode store.
  tier is a STATE-MACHINE field (libertyville:--facet-pattern 2b): unprefixed,
  per-transition write authority, validate-enforced. leyden writing it fulfills
  his declared contract; it is NOT trespassing in senath's record.

  GRAIN RULED 2026-06-10 (George): THE SPLIT. Company facts (senath send
  ledger) stay on jrec:portal:<dataset>:<companyId> — accumulating ledger,
  NO coherence scalar anymore. NEW per-person record (prostan8-keyed,
  nashville-born at registration) carries tier + the channel-3 scope
  binding. tier MOVES to the per-person record. senath NO LONGER births
  tier — ANONYMOUS = no per-person record exists yet; the company
  send-ledger is the anonymous-state evidence. leyden's authorized-flip
  lands on the per-person record once libertyville ratifies the schema.
  STILL GATING ratification: revocation writer must be NAMED; role
  assignment (PULP-auto vs explicit grantor action) + grantor-app billet
  owner unsettled. See senath:--facet-three-channels for the full model.
  VOCAB: resolved 2026-06-10 — libertyville purged the 4-tier ladder from
  their facets; value-set is anonymous/authorized everywhere. (Facet body
  below still has stale 4-tier prose — historical, superseded by this
  block and the split.)

NOT THE SAME as the "Four Storage Systems" in --facet-prnthist-bridge.
That facet is about disk layout (Loads / Prnthist / Inbox / Portal Cache).
THIS facet is about WHO has what kind of access to portal documents and
how that access escalates over time.

=== THE FOUR TIERS ===

A recipient progresses through up to four access tiers. The folder on
canopylake is the same in all tiers — what differs is whether (and what
kind of) authority structure has been built over it.

Tier 1 — ANONYMOUS
  Known at send: email address only
  Mechanism:     hard-to-guess token (32 chars from crypto.randomBytes(16))
                 + three cache JSON files (modern path, gen-6):
                   portal/cache/email/{token}.json       — per-send doc access
                   portal/cache/company/{token}.json     — per-company aggregate
                   portal/cache/person/{dataset}-{pulpId}.json  — binary isMember marker
  Authority:     none — token IS the grant
  Who builds:    senath (all three caches in sendEmail.js)
                 denver (token generation patterns — see denver:--facet-portal-tokens)
                 emsworth (upgrade-CTA template shown to anonymous recipients)
  When promoted: every send IS anonymous; no promotion needed
  Live today:    YES — three-cache write live as of 2026-05-23 on modern path
                 (i_newbol.htm → i_saveAndEmail.php). Legacy newbol.htm path
                 doesn't carry pulpId, skips the person cache.

Tier 2 — PROVISIONAL
  Known at send: email address only
  Mechanism:     a per-recipient folder exists on canopylake under
                 outgoing/<recipient>/ — waiting for the recipient to register
  Authority:     none — held in custody until recipient becomes a PER
  Who builds:    senath (writes the folder via SMB through the bridge)
                 boston (the "warmth" — see boston:--facet-seeddrop-warmth)
                 emsworth (upgrade-CTA template — see emsworth:--facet-upgrade-cta)
  When promoted: same send as tier 1 — every anonymous IS provisional until
                 the recipient registers (tier 3) OR they never do (stays at 1/2)
  Live today:    NO — designed; portal/cache/ folder lands on prey disk;
                 the canopylake outgoing/<recipient>/ design is not yet built

Tier 3 — INDIVIDUAL PER LINK
  Known at send: recipient is a PER (has a prostan8) in ProduceStandards
  Mechanism:     <link> inode in the recipient PER's tree -> grantor's
                 outgoing/<recipient>/. ~_~ boundary fires the authority check.
  Authority:     recipient PER (USER authority granted at registration)
  Who builds:    leyden (createinodelink_modular.js — already exists, see
                          leyden:--facet-inode-link, inola:--facet-inode-link-creation)
                 inola (inode + .link.json spec, see inola:--facet-link-resolution)
                 traversecity (authority check at ~_~, boundary-check.js)
                 creedmoor (LICEE<->LINK authority couplet via createlink_modular.js,
                            see creedmoor:--facet-link)
  When promoted: at recipient registration. Today nashville's createSeedDropStructure
                 builds the seeddrop/<prostan8>/ disk and vernal posts
                 /createUserAuthorityPermReq. Nothing in that flow creates the
                 portal-membrane PER LINK yet — that's the missing leg.
                 (See mississippistate:--facet-flow for the full registration chain.)
  Live today:    API is now LIVE — prosser shipped POST /createLink on
                 Monkey:3005 (2026-05-23). Wraps creedmoor's creator_link.js.
                 What's still missing is the trigger in the nashville/vernal
                 registration flow that calls it for portal membranes.

Tier 4 — DROPPED 2026-05-24 (gen-8) when the company-folder concept was
removed from the portal model. Company-level access (CORP-CORP LINK) is
no longer part of the tier progression. CORP-level identity and grants
still exist in uTERA / atlanta's membrane model but are out of scope for
senath's tier ledger now. The three remaining tiers cover the full
recipient lifecycle:

=== THE PROGRESSION (3 TIERS, post gen-8) ===

  1 (anonymous) ──────► 2 (provisional)
                        every send IS provisional until recipient registers

  2 (provisional) ────► 3 (individual PER LINK)
                        trigger: nashville/register.html completes registration,
                                 persia issues prostan8 via GodCreatesPerson,
                                 jrec.transition closes regjourney + advances
                                 portal anonymous→provisional. THEN leyden
                                 creates the LINK + advances provisional→individual.

  REGISTERED-RECIPIENT EDGE CASE (no registration event fires):
                        when identityCheck.isRegistered=true at send time,
                        the recipient never goes through nashville again.
                        senath writes senath_recipientProstan8 onto the portal
                        record at birth. leyden watches for tier=anonymous +
                        senath_recipientProstan8 present + custody record
                        exists; fires createinodelink_modular and advances
                        tier directly anonymous→individual. NOT BUILT —
                        leyden has working code, needs caller/watcher.

The folder NEVER MOVES across tiers. Only the LINK targets change.
This is the gen-5 conclusion with George (2026-05-21): "Store first.
Grant later when the grantee entity exists." The provisional folder
doesn't relocate when the recipient registers — their new PER just gets
a LINK edge pointing at where the documents already sit.

=== STATE MACHINE FRAMING (libertyville) ===

The four-tier progression is a textbook fit for libertyville's lifecycle
state machine pattern (see libertyville:--facet-pattern when written, and
boston:--facet-state-machine for the original instance).

Proposed Redis HASH:

  KEY:    portal:<grantor>:<recipient>   e.g. portal:willis:farmwey
  STAGE:  anonymous -> provisional -> individual -> company
  FIELDS: per-specialist, three-state values ("true"/"false"/"unknown")

Who writes what (proposed contract — to be refined with libertyville):

  senath writes:
    emailToken, companyToken, cacheCreated="true", firstSentAt
    outgoingDirCreated="true"|"false"|"unknown", canopylakePath, provisionalAt
  nashville writes:
    recipientProstan8, personRegisteredAt
    (later) recipientCorpProstan8, corpCreatedAt
  leyden writes:
    perLinkCreated="true", perLinkInodeId
    (later) corpLinkCreated="true", corpLinkInodeId
  atlanta writes (later):
    userGrants (array of u_<prostan8> for individuals in the CORP)

Stage transitions written by:
  anonymous -> provisional: senath (when outgoing/<recipient>/ lands)
  provisional -> individual: leyden (when perLinkCreated fires)
  individual -> company:     leyden (when corpLinkCreated fires)
                             — but the TRIGGER for that work is nashville
                             noticing recipient now has a CORP

=== DISAMBIGUATION ===

NOT the same as:
  --facet-prnthist-bridge "Four Storage Systems" (Loads/Prnthist/Inbox/PortalCache)
       — that's disk layout, not access tiers.
  amarillo:--facet-product-tiers (ProduceFlow vs SeedDrop vs ProduceStandards)
       — that's product line, not access progression.
  progressvillage:--facet-tiers (Public vs ProStan Identity)
       — that's a 2-tier auth model, not the 4-tier portal-membrane progression.

=== CTAS IN THE EMAIL — TIER MAPPING ===

The email produced by sendEmail.js + emailTemplate.js has THREE CTAs.
Every one of them is a Tier-1 (anonymous) grant at issue time. The
third is also the Tier-1 → Tier-3 PROMOTION TRIGGER.

(1) "View Document"
    URL:       https://{dataset}.produceflow.com/portal/document/{docName}?token={emailToken}
    Tier:      1 — ANONYMOUS (single-doc grant)
    Built by:  senath buildDocumentUrl()       sendEmail.js line 148
    Cache:     portal/cache/email/{emailToken}.json   (line 472, gen-6)
    Token:     emailToken — 32-char hex from crypto.randomBytes(16)
    Authority: token IS the grant; no login

(2) "View All {Company} documents"
    URL:       https://{dataset}.produceflow.com/portal/company/{companyToken}
    Tier:      1 — ANONYMOUS (multi-doc, accumulating)
    Built by:  senath buildCompanyPortalUrl()  sendEmail.js line 153
    Cache:     portal/cache/company/{companyToken}.json  (createCompanyPortalCache, line 543)
    Token:     companyToken — SHA-256 of {dataset}:{companyId}:portal_salt_2025
    Behavior:  accumulates up to 500 recentDocuments[] over time
    Authority: token IS the grant; no login

(3) "Create your industry identity"
    URL:       https://producestandards.org/register
                 ?source=email
                 &token={emailToken}
                 &company={companyId}
                 &email={recipientEmail}
                 &dataset={dataset}
                 &name={recipientName}
                 &load={loadNumber}
                 &doctype={bol|invoice|po|receipt|document}
    Tier:      1 → 3 PROMOTION TRIGGER (Cruise Mississippi launch URL)
    Built by:  senath buildContextualUpgradeUrl()  sendEmail.js line 287
    Shown to:  new users only (identityCheck.isRegistered === false)
                conditional in emsworth createConditionalHtmlEmail()
    Cache:     portal/cache/person/{dataset}-{pulpId}.json  (isMember=false marker, gen-6)
    Promotion: recipient registers → nashville/register.html
               → persia issues prostan8
               → leyden createinodelink_modular builds PER LINK
               → recipient becomes Tier 3
               (See mississippistate:--facet-flow for the full chain.)

The first two CTAs are token-IS-the-grant — they work at email time, no
identity required. The third is the funnel into the four-tier progression
itself: anonymous → individual PER LINK (Tier 3) → company CORP LINK (Tier 4).

(Authored: senath gen-8 2026-05-23 — preserves the CTA→tier mapping that
kept getting re-derived from scratch.)

=== SEE ALSO ===

  senath:--facet-portal-membrane       Structural (outgoing/incoming, ~_~ boundary)
  senath:--facet-access-layer          Tier 1 mechanism (anonymous token cache)
  senath:--facet-journey-metadata      Tier-promotion analytics
  denver:--facet-portal-tokens         Token generation patterns (verified)
  inola:--facet-inode-link-creation    <link> inode spec (verified)
  inola:--facet-inode-vs-appdir        What needs an inode record vs plain dir (verified)
  leyden:--facet-inode-link            createinodelink_modular.js
  atlanta:--facet-membranes            LINK + USER + arbiter pattern
  boston:--facet-state-machine         The state-machine pattern (verified)
  mississippistate:--facet-flow        Full SeedDrop registration chain
  seeley:--facet-full-flow             End-to-end SeedDrop (verified)

=== STATUS ===

This facet captures a design that emerged in gen-5 with George and is now
being operationalized via libertyville's state-machine pattern (see RECOMMENDATIONS
in c:/clients/libertyville/). The progression is conceptually agreed; the
state-machine Redis instance is pending libertyville's first-day work with senath.
