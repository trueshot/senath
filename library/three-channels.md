(unverified) Three Channels — How a SeedDrop Entity Touches the Network

Articulated by George 2026-06-10, committed by senath gen-9. Detailed
treatment with per-specialist asks: http://localhost:3500/senath/ ("Three
Channels" tab). This facet is the compact canonical statement.

=== THE MODEL ===

A SeedDrop entity (e.g. "Acme Produce", a grower whose stuff Willis sells)
touches the network through THREE channels. Each has a different compute
home and a different authorization regime. Conflating them is the main
design error this model exists to prevent.

CHANNEL 1 — THE ESTATE (their own identity, resources, light code)
  What:     Account management, asset/authority drilldown (uwchlan
            Resource Accounting tab — already live), their inode tree +
            disk resources, their own uCode2 programs (brooklyn).
  Compute:  vernal's entity APIs (Monkey) + THE BROWSER (bronx uCode2
            interpreter). A SeedDrop entity has NO server of their own.
  Authz:    JWT identity (prostan8). Their own data.
  Code:     There is NO per-user server code. Multi-tenant platform —
            sunrise's pages + vernal's APIs are "the code that is run";
            the per-user part is purely data keyed by prostan8. The
            uwchlan tab is live because it follows this rule; hardcoded
            parts of home.html are dead because they don't.
  Storage:  Inode tree on canopylake (always). Bytes: A-drive (documents,
            uploads, reports) belongs IN-TREE on canopylake (the no-prey
            entity class; portal outgoing/ precedent proves bytes-in-tree
            works). T-drive/inbox (thumbnails, processing, session) =
            compute scratch, stays near the processing server. F-drive =
            the membrane (channel 2 mounts).

CHANNEL 2 — THE DOCUMENT MEMBRANE (bytes in custody, crossing estates)
  What:     incoming/{grantor}/ LINK in recipient's tree -> grantor's
            outgoing/{recipientCompanyId}/. Read-only documents.
  Compute:  None. It's storage.
  Authz:    uTERA LINK + ~_~ boundary test (traversecity). Ledger-backed
            (creedmoor LICEE+LINK couplet -> HAS_LINK in Canopy),
            severable by the grantor, materialized by chimayo/inola.
  Writers:  senath (outgoing bytes at send), leyden (the LINK + tier
            flip, per the settled 2026-06-09 writer split).

CHANNEL 3 — THE APPLICATION PORTAL (grantor's compute, rented view)
  What:     Live application experience on the GRANTOR's system: grower
            portal in willis — activity board for their loads, print
            BOLs. Willis data, willis logic, willis prey.
  Compute:  The grantor's SpringForward system (PHP APIs that mutate and
            retrieve — only exist there).
  Surface:  iframe embedded in producestandards.org home.html. This is
            the ESTABLISHED pattern, not a hack: home.html is sunrise's
            iframe-nav platform; uwchlan's tab itself authenticates as an
            iframe via window.parent._app; SSO (oauth_session -> silent
            authorize -> stage-6 exchange) already carries the session
            into {dataset}.produceflow.com.
  Authz:    APPLICATION DISCIPLINE — the grantor's app scopes the view.
            NOT the membrane test. This is correct, not a compromise:
            it is the read-side twin of the trusted-code write path.
            The grantor has SUP over its own estate and delegates a VIEW,
            not custody. ~_~ governs bytes crossing estates; an activity
            board is live app state inside one estate.
  Economics: Compute stays with the paying SpringForward customer. The
            portal is the showroom of the flywheel's upgrade step —
            grower gets real utility free; wanting to RUN their own
            operation = SpringForward dataset.

=== THE KEYSTONE: THE SCOPE BINDING ===

Channel 3's entire security model is one record: which scope is this
PER vetted for at this grantor?

  prostan8  <->  (grantor dataset, companyId, pulpId)

The SeedDrop journey ALREADY carries everything needed: senath's
regjourney birth fields hold (dataset, companyId, pulpId, email); at
registration nashville holds the new prostan8 AND that journey context
in the same instant. That moment is when the binding is written — onto
the portal jrec, where the grantor's app (trusted server-side code,
already has the ElastiCache db 8 connection pattern) reads it at iframe
load.

THE BINDING IS NOT A LINK. No inode, no couplet, no boundary test. It is
relationship state on the jrec substrate. Do not conflate with channel 2.

GRAIN CONSEQUENCE: the binding is per-PERSON (this PER, this scope, this
grantor) even though the scope it grants is a companyId. Channel 3
therefore REQUIRES the per-person portal jrec grain — a company-keyed
scalar cannot say "gburt is bound, an unknown PER is not."

RULED 2026-06-10 (George): THE SPLIT (libertyville refinement, senath
endorsed). Company facts (senath send ledger) STAY on
jrec:portal:<dataset>:<companyId> — pure accumulating ledger, no
coherence scalar. NEW per-person record jrec:perportal:<ds>:<prostan8>
carries tier + scope bindings. ANONYMOUS = no per-person record exists.

BUILT + TESTED GREEN 2026-06-10 (live willis production). Final rulings
(senath, under George's delegation): scope is PAYLOAD not key (one
scope_<companyId> field per relationship); TWO birth paths (nashville at
registration, senath at send for known-registered — registration fires
once, relationships accrue forever); prostan8 in keys is BARE (strip u_);
tier registered->authorized (leyden flips at LINK creation); binding
admin = dataset-app billet (role override + revocation =
status:'revoked' in the payload, never HDEL); cross-ref one-way. First
live record: jrec:perportal:WILLIS:bk6l2u8y with scope_INGLES. Remaining
build: nashville registration birth rewire, leyden flip, portland reader
confirm. See senath:--facet-state-machine for the exact write contract.

=== WHO OWNS WHAT (build list) ===

  George        Grain ruling (per-person portal jrec) — gates everything
  senath        regjourney birth fields (DONE — already carries context);
                thin ?jrec= link (agreed, pending)
  nashville     Write the binding at registration (prostan8 onto portal
                jrec via senath_relationshipKey cross-ref)
  libertyville  Schema: per-person entitySpec + binding fields ratified
  leyden        Channel 2 LINK + tier flip ONLY (settled split). Channel 3
                does not involve leyden.
  sunrise       home.html embed slot (iframe-auth pattern = uwchlan's)
  dataset app   The grower-portal page itself (willis logic, JWT + binding
                -> filtered view). pilotbird/true1 territory.
  progressvillage  WHAT home.html shows (PM)
  seeley        Lifecycle doc: add channel 3; regjourney terminal gains a
                second consumer (the binding write)

=== OPEN QUESTIONS ===

  1. Who assigns the ROLE on the binding (e.g. role=grower)? Derived
     automatically from PULP/blue-test data, or an explicit grantor-side
     admin action? (PULP already maps people to companies — the data
     exists in the grantor's estate.)
  2. Iframe mechanics: X-Frame-Options/CSP across domains, token handoff
     into the frame (sunrise + oakley).
  3. A-drive in-tree provisioning at registration: nashville's
     createSeedDropStructure shifts from Hawk-local mkdirs to canopylake
     SMB mkdirs (nashville + chimayo born-over-SMB rules).

=== SEE ALSO ===

  senath:--facet-portal-membrane     Channel 2 structure (outgoing/incoming)
  senath:--facet-access-tiers        Tier writer split (settled 2026-06-09)
  prospect:--facet-flywheel          Why: authority accumulation, upgrade path
  uwchlan:--facet-iframe-auth        The iframe auth pattern channel 3 reuses
  brooklyn (all facets)              Channel 1 user-customizable code (uCode2)
  vernal:--facet-resolve             Channel 2 read path (built, verified)
  nashville:--facet-seeddrop-structure  The A/F/T drive layout

— senath gen-9, from George's articulation 2026-06-10
