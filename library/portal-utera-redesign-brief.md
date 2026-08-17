# Portal Access → uTERA Redesign Brief

> ## ⚠ SUPERSESSION NOTICE (senath gen-16, 2026-08-16) — READ FIRST
> This brief's built shape was RULED INTERIM by two later George rulings.
> The build below EXECUTED and ran; do not treat its shape as target canon:
> 1. **JOB A** (lincolnville QB; REGISTRY-FABRIC-RULING.md ratified 08-15,
>    JOB-A-CONTRACT.md approved 08-15, both in c:/clients/lincolnville/):
>    access moves to CORP-LEVEL links (partner corp -> room), person-grants +
>    gates + partner williscorp-USER memberships RETIRE at the backfill
>    window (ruling 12 as narrowed by c1); the nine area entities STAY as
>    room LEDGER HANDLES only. Reshaped gate (contract §6.1) = supBypass OR
>    (memberOfPartnerCorp AND partnerCorpHasLinkToRoom) — NO license leg.
> 2. **RULING B** (George in-session w/ atlanta, 08-16): LICENSES ARE NOT
>    RELATED TO LINKS. The kill-switch below (license->area-LINK gates
>    t_444/458-470) is canon-wrong as a target; the recast kill-switch is a
>    license on the portal APP entity (software up/down), never a link gate.
>    The license-absence in the §6.1 gate is canon-REQUIRED.
> The EXECUTION RESULTS below remain the accurate record of what was built
> and still runs until the backfill window George schedules.

**Coordinator: senath gen-14 · opened 2026-08-07**
**status: ★★★ RATIFIED BY GEORGE 2026-08-10 ★★★ — George ruled the four
open questions by adopting senath's four board-flag recommendations
("do now" on the four-item flag, 2026-08-10; senath restated the reading
to him verbatim at execution and he was told to stop the room if misread):
  (1) SHAPE RATIFIED — membership = USER of the grantor corp via PERMREQ
      offer+accept; per-company access = a journaled grant to a
      grantor-owned document area; the person's own tree holds the link
      ("access embodied in the area").
  (2) ARBITER = pflowcorp (platform defines portal-USER; implies the
      wrapper change — leyden's lane).
  (3) AREA ENTITY TYPE = reuse ASSEMBLY (no new regalia; rename later if
      ever needed).
  (4) CONSENT = once, at membership (per-company grants are arbitered
      transactions without an additional accept).
The 2026-08-07 freeze is LIFTED for build execution per the sequence in
§6.5-6.6 (urbana per-corp scaffolding first). Historical freeze record and
CROSSED-AT-FREEZE blocks below are preserved as history — the rulings above
supersede where they conflict. cottagelake's hard requirement stands inside
the ratified shape: the grant transaction MUST post DrCr.**
**Process: build questions by DM to senath (coordinator); design is settled — no re-litigation; George stops work, nobody else.**

**BUILD-PHASE ADDENDA (2026-08-10, senath — supersede older leg drafts where they conflict):**
- **AREA PREFIX = `m_`** (ASSEMBLY mints m_/type_ASS per creedmoor creator code), NOT `a_` (= APP; canopy-type collision, traversecity catch, atlanta canon confirm). The doc-04 `$~subpath` scoped-string form is VOID under the area-entity ruling — plain minted-asset string, scope by construction.
- **George ruling 2026-08-10 (via atlanta resync, George-approved): LINK IS NOT AN AUTHORITY** — a link is a recorded route (journaled, arbitered, severable wiring). Authority hierarchy: LICOR > SUP > ADM > USER > 910TH > PERMREQ. Terminology only; couplet grammar/-LINK suffix, wrappers, canopy edges unchanged. See atlanta:--facet-link-definition.
- **OPEN — DO NOT BUILD ON EITHER ANSWER: link view-extent** (whether a route's window extends through the target's SUP chain). Needs George.
- **Couplet direction RULED (atlanta, Doc 04 "Couplet Anchoring Rule", 08-10):** couplet unchanged — DR `u_<person>-PER` / CR `m_<area>-LINK` / AR `u_pflowcorp-CORP`. **-LINK rides the route TARGET**; HAS_LINK is canonically a route-target edge, `(area)->(person)`; the §6.9 gate walks that direction (traversecity adapts). "Person holds the link" lives at the TOPOLOGY layer (the `<link>` inode in the person's tree), not couplet grammar. wray RELEASED 08-10.
- **Portal-license regalia canon CONFIRMED (atlanta, 08-10):** PROT `portalproto` at pflowcorp (SUP[0]) → ProtoCreatesLicense `l_<grantor>_portal_lic` (PROT holds LICOR = kill-switch) → issuelicense (grantor CORP gets SUP) → license gates the **AREAS directly** (NOT an APP — the §6.6-era portal-APP framing is dead): DR `l_<grantor>_portal_lic-LICEE` / CR `m_<area>-LINK` / AR `u_pflowcorp-CORP`, one gate txn per area, fired at area-mint. creedmoor mints (precursor grows the gate step); leyden supplies the method if a new sibling is needed.
- **Prod creation mechanism RULED (senath ops call, atlanta: canon-indifferent):** urbana's tested path direct to prod, arbiter param pflowcorp; **PILOT ONE person** (suggested: Chris Hall 9fl0o2t2/MELOND) — verify journal + slot + canopy edge, report, then batch the remaining 7 on senath's word. No nprod stamping required.
- **Partner roster delivered to urbana 08-10:** 8 real persons / 9 (person,company) grants from the cleaned db8 store; 9 QA records EXCLUDED from prod Person creation (senath call, reversible). urbana holds a hard gate: no membership PERMREQ runs until creedmoor confirms arbiter=pflowcorp in creator_authority.js (today it self-arbitrates at line ~202).

**EXECUTION RESULTS (2026-08-10, prod suffix 3 — the actual built artifacts, greppable):**
- **Regalia:** portalproto `p_84bgb5rx` (pflowcorp SUP[0]) → `willis_portal_lic` `l_a1c5h024` (PROT holds LICOR = kill-switch) → issued to williscorp. Minted by creedmoor `mintarea_modular`/proto path; fix `cot bf536c4`.
- **7 members → USER of williscorp:** pilot Chris Hall (`melon-direct1`/`u_9fl0o2t2`) t_422-424; batch markw(`8gwefgoj`) t_425, kyleb1(`1bo5f2es`) t_428, speters(`3ng61hq0`) t_431, tonytolar(`5l0w7uw6`) t_434, savfw(`ag30erht`) t_437, othon(`2838504b`) t_440. wwillis EXCLUDED (SUP staff, not partner — senath call). Real usernames are `type_PERSON.userid`, NOT `u_<prostan8>` (this mis-key cost an hour).
- **8 areas (m_ ASSEMBLY, owner williscorp):** MELOND `m_3d1ptjku`, PROMIS `m_ah5yzc1l`, WFLLC `m_6wm6ve82`, WFREPK `m_9vswu5pq`, REDLAB `m_cexdx7gs`, RJSLOG `m_7va6tzjx`, SAGRSV `m_8v45dyeh`, FARMWE `m_b54akl09`. Gates t_444, t_458-470. Grants t_445, t_471-477 (markw is the 2-area broker — distinct pairs, ternary-clean).
- **COMMANDS:** mint area+gate = `node c:/cot/mintarea_modular 3 willis <CO>` (creedmoor; owner auto-derived from license SUP; idempotent). Grant = `node c:/cot/creategrant_modular.js 3 willis <CO> <username>` (leyden). Membership = `node addAsUser_modular 3 williscorp <username> pflowcorp --txid-only` → `node acceptPermission_modular 3 <TXID> <username>` (urbana). All suffix **3** = willis prod (measured: williscorp in tripleEntryLedger3, none in 5).
- **★ ENV RECIPE — georg CAN originate uTERA writes** (cost leyden a false "Monkey-only" conclusion): local **Memurai** for redlock + DDB via `c:/secrets` creds. The VPC-private uTERA redis `172.31.28.226:6379` is NEVER reachable from georg and is NOT needed. Without Memurai running, `creator_infra` setup times out (ETIMEDOUT) and no txn posts.
- **Lazy-mint stands:** other ~65 companies mint their area at first member join, NOT in bulk (ratified design). Enforcement `traversecity/portal-gate.js`; scheduled canopy catchup+alarm `traversecity/canopy-lag.js` (fixed to cover LINK edges).

## 1. Why (George, 2026-08-07 — his words)
"We need to fix the way you decided to store portals... The problem with the
way we are doing this is that vernal should rely on his canopy graph for
decisions. Generally, the situation is that a portal user should be 'user' of
'willis'. Then they should be granted access to a disk area that is created
for that user. Having access to that area, the access should be involved in
that area. I am not sure how."

"We lost something in the process of putting these portals together. I need
you to figure who we should talk to in the utera world so that we can make
this part of the utera world."

## 2. Current state (read before proposing — it is all in the graph)
- senath:--facet-three-channels — estate / membrane / app-portal model (George's, 06-10)
- senath:--facet-state-machine — the 3 jrec writes (portal ledger, regjourney, perportal), ratified schemas, grain-split ruling
- senath:--facet-portal-membrane — canopylake outgoing/<companyId>/ folders, apron convention, 3 writers 1 reader
- senath:--facet-portal-wiring — the open "how does a person get wired to the out-box" question, option 1 (inode LINK) vs option 2 (read folder)
- vernal:--facet-portal-authority — the current gate standard; vernal:--facet-my-portals — the db8 bindings
- The triggering defect: perportal SEND-BIRTH binds any registered doc-recipient
  as role=partner of the doc's company — unilateral, no accept, no arbiter.
  Measured: one Willis staff member (Susi, 4tdh4tli) bound to 22 companies
  purely by receiving CC'd sends. George saw it on the Melon Direct roster.

## 3. What was lost (vs uTERA primitives — from the facet graph)
1. **PERMREQ: offer + accept.** uTERA never grants unilaterally
   (urbana:--facet-user-to-person-bridge). Send-birth grants unilaterally —
   the Susi pollution is precisely the missing accept step.
2. **Revocation as a gate.** LINK closes access; data, history, ownership
   survive (leyden:--facet-link). jrec scopes have status-in-payload but no
   gate semantics.
3. **Immutable audit.** Triple-entry journal with an arbiter on every grant
   vs mutable Redis hash fields (source:'send', no arbiter).
4. **Verifiable authority chains.** Canopy traversal (SUP/USER/LINK edges)
   vs field presence in a hash.

## 4. History that must be honored, not ignored
The current design was DELIBERATE: leyden:--facet-link section "WHEN LINK IS
THE WRONG PRIMITIVE" classifies portal scope-bindings as Channel 3 (filtered
view inside the grantor's own estate) → jrec territory, citing
senath:--facet-three-channels. George's direction re-opens that channel
boundary with his sanction. leyden and senath (the boundary's authors) are in
the room for exactly that reason.

## 5. Target sketch (George's, NOT ratified — the session's job is the HOW)
- Identity/membership: portal person = **USER of the grantor corp** in The
  Canopy (Person -[:HAS_USER]-> willis CORP), granted via PERMREQ
  (CreateUserAuthorityPermReq + AcceptUserPermReq — both tested, per urbana).
- A **disk area created for that user**.
- **Access embodied in the area itself** (inode/LINK authority — possession
  of the area/LINK IS the permission).
- vernal's gate decides from the **canopy graph**, not db8 jrec scopes.

## 6. Open questions (answer the ones in your domain)
a. Is portal access USER authority, LINK authority, or both (USER of corp +
   LINK to the document area)? What does the couplet look like?
b. Per-user area vs per-company folder: George ruled 06-07 "folder = company;
   LINK = person" (documents are a company relationship). His new sketch says
   area per-user. Reconcile — is the per-user area the person's own tree
   holding LINKs into company folders (portal-wiring option 1)?
c. The PERMREQ flow for a document recipient: who offers, who accepts, and
   WHEN (at invite? at registration? at first LINK)? What is the arbiter?
d. Migration reality: The Canopy has ~0 production Persons today (22 test
   Persons in db3; 159 legacy users unmigrated — urbana's numbers). Portal
   partners would be the FIRST production Persons. urbana's 7-step
   scaffolding (Person, Corp, SUP chain, Proto, License x2, USER grant) must
   exist per grantor corp. What is the provisioning order?
e. What happens to the jrec records (perportal scopes, portal send-ledger)?
   Displaced entirely, demoted to non-authoritative cache, or kept as the
   send-facts ledger with authority moved out?
f. Enforcement: vernal's gate reads canopy edges (traversecity's domain).
   What does the query look like, and what latency/caching contract does a
   per-request portal gate need?
g. Revocation and staff: how does the model natively prevent the Susi class
   (sender-side staff must never be auto-granted partner standing)?

## 6.5 CONVERGENCE — after 4 of 6 core replies (atlanta, inola, traversecity, leyden — 08-07)

**(a) SETTLED BY CONVERGENCE (all four agree): BOTH layers, never collapsed.**
- **Layer A — MEMBERSHIP = USER authority.** Person -[:HAS_USER]-> grantor CORP
  via PERMREQ (offer + accept + arbiter). atlanta's couplet: DR: u_person-PER,
  CR: u_grantorcorp-USER, AR: u_pflowcorp-CORP. This is the floor vernal's
  gate checks. HAS_USER is corp-level — cannot carry per-company granularity.
- **Layer B — PER-COMPANY DOCUMENT GRANT = LINK, itself a pair** (leyden):
  AUTHORITY LINK = the ledger couplet -> HAS_LINK canopy edge (what the gate
  walks; restores accept/arbiter, revocation-gate, audit, chain) +
  INODE LINK = materialized <link> in the person's own Drive F pointing into
  outgoing/<companyId>/ — this is literally George's "access embodied in the
  area" (live mechanism since 2026-05-08, leyden:--facet-inode-link).
- **Membership ≠ document grant. The two layers must never collapse into one.**

**(b) SETTLED: no contradiction between the 06-07 ruling and the new sketch.**
Folder stays per-COMPANY (outgoing/<C>/, one shared copy, senath writes, NO
inodes ever — application directory per inola:--facet-inode-vs-appdir).
Area is per-PERSON = the person's own inode tree; Drive F holds one <link>
per granted company. = portal-wiring option 1. inola's phases: registration
births the standard 6-inode PER skeleton (already implemented,
creator_inodes.js + chimayo materialization); partnership births ONE
Link-type inode per company (createinodelink_modular.js, 6-arg subpath form);
revocation = remove <link> + counterbalance in ledger — documents stay,
access dies, history in journal.

**(c) RATIFIED by cottagelake (MEASURED from the live wwillis->williscorp
grant, t_127-129, 2026-08-03):** PERMREQ is THREE journal transactions:
OFFER (t_127, corp offers, row born proposed:true) -> ACCEPT (t_128, recipient
accepts, mirror couplet unwinds escrow) -> GRANT (t_129, standing USER
authority posts to BOTH parties' BALSTACKs). WHO: granting corp offers,
recipient person accepts. ARBITER (measured a2_AR): u_<corp>-CORP — the
granting corp arbitrates its own membership offers (not pflowcorp as first
guessed). TIMING settled: the offer wrapper FAILS if the Person doesn't exist,
so invite stays jrec-side; the uTERA offer fires AT registration; accept
immediately after or as an explicit portal-UI action (acceptPermission wrapper
runs legs 2+3 atomically — one user click = fulfill + grant). Per-company
LINK: by arbitered grant, NEVER by send bytes. A send event can at most
INSTIGATE an offer; an unaccepted offer sits proposed forever and grants
nothing — "no code path from received-a-document to a posted authority row."

**(d) HARD BLOCKER NAMED (traversecity, measured): The Canopy is greenfield
for this pattern — ZERO Person-HAS_USER->Corp edges and ZERO HAS_LINK edges
exist today.** Prereqs: dataset regalia per grantor corp (willis regalia clean
in test via nclaude8; nprod.bat stamps production — atlanta), urbana's
migration for the portal-partner subset, canopy-sync verification (traversecity
to run a synthetic PERMREQ->Accept in db3), and the arbiter decision.

**(e) SETTLED: jrec DEMOTES to non-authoritative.** Send-facts cache/log stays
useful (what was sent, when, to whom); AUTHORITY moves to canopy edges. The
scope_<C> field stops BEING the entitlement. senath's company send-ledger
stays as a ledger.

**(f) SPEC EXISTS + MEASURED LATENCY-NEUTRAL, one CONFLICT to settle:**
traversecity spec: c:/clients/traversecity/specs/portal-canopy-gate.md (three
Cypher checks; proposed 60s TTL memo cache). vernal MEASURED on the LIVE gate
(which already reads Canopy per-request in production since 08-04): db8 leg
~91ms vs one-Canopy-traversal ~89ms vs two-Canopy-queries ~95ms — all inside
noise; WAN dominates, bolt is localhost on Monkey. Moving the partner leg
db8->Canopy is LATENCY-NEUTRAL, and 30-concurrent burst survives uncached.
⚡ CONFLICT: traversecity proposes 60s TTL cache; vernal REFUSES caching of
authority answers on principle — "a cached yes outlives the revocation," and
revocation-as-gate is lost-item #2 this redesign exists to restore; per-request
is measured affordable. vernal+traversecity to settle (vernal's position is
the redesign's own values + measurements). vernal's gate rules that stand:
ONE sibling function per edge-class (call sites cannot widen authority);
domain grants (documents/orders) MUST be readable in the SAME bolt round trip;
fail-closed 503 on store-down; index-seek requirement at 10k persons; DUAL-READ
cutover offered (decide from Canopy, compare db8, log divergence — invisible
to all consumers). boundary-check.js ~_~ HAS_LINK walking already LIVE.

**(g) SETTLED, structural:** receiving bytes can never mint authority. A CC'd
send writes a document, not a grant. Staff are USER of their OWN corp with
zero external-company LINKs. The Susi class is impossible by construction.

**THE ONE OPEN DESIGN FORK (blocks wray's transaction build):**
leyden §3 — what is the LINK counterparty: a first-class "document area"
resource, or the grantor's portal APP + companyId subpath? (Live inode-link
precedent crosses into an APP — willdev_pf_app — arguing APP+subpath.)
leyden proposes the DR side = a per-grantor portal license
(l_<grantor>_portal_lic, LICOR held by grantor) — giving the grantor ONE
revocation lever for the whole portal. HARD INVARIANT (leyden, non-negotiable):
CR side MUST carry the -LINK authority suffix or the grant is invisible to
canopy sync. NEEDS: atlanta + cottagelake + traversecity to close WITH leyden.
NEW FACT feeding the fork (vernal, 08-07): recipient companies (MELOND,
INGLES...) are NOT Canopy entities today — the APP+subpath shape avoids ever
minting per-company entities; a first-class document-area resource requires
someone to create + own those entities per company. cottagelake precedent
supports APP-target: every dataset's 3 inode links (dbf/app/prg) already
target the APP for authority-checking and resolve physical paths via
.link.json with zero DDB at request time.
FORK TALLY (08-07): cottagelake POSITION = APP+subpath, with receipts (no
document-area entity type exists in uTERA; a new resource type = full new
regalia for a shape that is LIVE since 05-08; portal-license DR SUPPORTED as
Gate-1-shaped — revoke -> access stops, documents/history survive; -LINK
suffix invariant BACKED empirically: creedmoor already fixed this exact bug
class, -SERV -> -LINK, wrong suffix made grants invisible). leyden leaning
APP+subpath. vernal's fact supports it. AWAITING: atlanta + traversecity.
SUB-QUESTION deferred to atlanta: which corp OWNS the portal APP — each
grantor's own portal APP, or ONE pflowcorp portal APP with per-grantor
subpaths? (Couplet mechanics work either way.)

**⚡ ARBITER DISCREPANCY — resolve BEFORE wray builds (cottagelake, measured):**
atlanta's proposed couplet says AR = u_pflowcorp-CORP. The LIVE wrapper posts
AR = the GRANTING corp (measured t_127: a2_AR = u_82vlsz7s-CORP — williscorp
arbitrating its own offer). Either the design changes the wrapper's arbiter
to pflowcorp (wrapper change: creedmoor/wray + a GEORGE ruling) or the doc
matches the implementation. Routed to atlanta first — if atlanta holds
pflowcorp, this becomes a George decision; if atlanta accepts the measured
shape, it closes without one. Do not let it drift silently into the build.

**(c) addendum — why offer-at-invite is WRONG (cottagelake's ratification
argument, worth preserving):** offer-at-invite requires minting a stub Person
(prostan8 slot + userAndEmailList row) for every invitee including no-shows
and CC blasts — "the Susi disease relocated from the authority layer to the
entity layer." An invite email is bytes; receiving bytes never mints. Invite
stays a jrec fact in the send-ledger. At registration the flow is
createuser -> offer -> accept in ONE VISIT — registration IS the accept
experientially; the ledger just records them as separate arbitered
transactions.

**MIGRATION INVENTORY FACT (cottagelake, measured in wwillis's BALSTACK):**
all 11 willis staff currently hold SUP on williscorp (nprod_willis.bat Phase 3,
t_074) — George flagged it this week; reversal comes via a UI being built.
Migration inventory must assume dataset-corp staff hold SUP today, not USER.

## 6.6 SECOND-ROUND CLOSURES (08-07, after all-six + follow-ups)

**CACHE/REVOCATION — SETTLED.** traversecity conceded to vernal: per-request
uncached, fail-closed, id indexes on Canopy (traversecity creates),
push-invalidation as future escape hatch, NEVER TTL. Spec §7 updated.

**PORTAL APP OWNERSHIP — SETTLED (atlanta).** Each grantor owns their own
portal APP; never one shared pflowcorp APP. Anchored on George's own 05-08
ruling ("This belongs to willis corp canopylake inode structure") + membrane
principle (grantor owns the resource or "nobody surrenders anything" breaks) +
pays-for-it + Bayshore precedent (multiple APPs per CORP established).
Full shape: a_willis_portal_app (APP, SUP: willis) = the outbox;
l_willis_portal_lic (LICEE, SUP: willis, LICOR: pflowcorp's portal PROT) =
platform kill switch. Customer owns the asset; platform holds the gate —
two-gate philosophy, same as the rest of the regalia.

**⚡ ARBITER — ESCALATED TO GEORGE (atlanta holds the spec position; both
cottagelake and atlanta say do not let it drift).** The question: who
arbitrates portal authority grants?
- **pflowcorp (atlanta's position):** the arbiter is JURISDICTION — the entity
  whose rules define what the authority MEANS (Doc 03). willis grants portal
  access but does not define what portal-USER means; the platform does,
  uniformly, for every grantor. Also hierarchical anchoring (Doc 05): portal
  governance (Susi-prevention policy, platform revocation) must anchor at
  pflowcorp or the platform has no structural lever — under self-arbitration
  willis could arbitrate its own modifications. IMPLIES a wrapper change
  (creedmoor/wray).
- **granting corp (matches the LIVE wrapper, measured t_127):** williscorp
  arbitrated its own membership offer — legitimate where granter = rule-maker
  (Doc 03's own example), which atlanta argues is NOT the portal case.

**COUNTERPARTY FORK — NOT closed yet; leyden's "unanimous" crossed in flight
with traversecity's objection.**
- leyden's closure declaration: APP + companyId subpath via prompt string;
  couplet DR: l_<grantor>_portal_lic-LICEE / CR: a_<grantor>_portal_app-LINK /
  AR: u_pflowcorp-CORP / prompt ~portals~outgoing~<companyId>. CARDINALITY
  refinement (ii): ONE couplet PER (grantor, companyId) — per-company grants
  journaled + arbitered (else the per-company grant is an unjournaled dirArray
  write = "the Susi defect rebuilt one layer down"); revocation granularity
  (drop MELOND, keep INGLES); atlanta's own example prompt was company-specific.
- traversecity's objection (sent to leyden directly): first-class area as a
  GRANTOR-OWNED ASSET (not a company party entity — MELOND never gets
  standing); decisive argument = the ternary balance rule (APP+subpath stacks
  +2 on one couplet for multi-company brokers = invalid); portal license kept
  as portal-wide LICOR gate, NOT the grant-couplet DR. Spec §6.
- STATUS: leyden + traversecity converging directly; converged result returns
  here. NOTE the two positions are closer than they look — both grantor-owned,
  both per-company grant records, both keep the portal license as a
  grantor-wide gate; the residue is the couplet's DR/CR terms and whether the
  per-company target is a prompt-scoped APP path or a minted grantor-owned
  area asset.
- CONVERGENCE UPDATE (traversecity, spec §6.9): leyden's three asks answered —
  (a) Canopy = N distinct HAS_LINK edges, scope in the MERGE key (one per
  grantor+companyId couplet; a scopes-array property would break canopy-sync's
  per-couplet idempotent model); (b) boundary-check extends to edge-exists +
  scope EQUALITY, membership + gate in ONE bolt round trip, hop-1/2 except
  SUP bypass; (c) cache contract settled. ⚠ ONE OPEN VALIDATION before the
  fork closes (traversecity -> leyden/wray): confirm the companyId scope
  lives in the DrCr ACCOUNT STRING — if scope is journal-only and DrCr
  aggregates on the bare couplet, a 2-company broker stacks +2 on one pair,
  the ternary rule forbids it, and the closure has a hole.
**★★ FORK — FINAL CONVERGED CLOSURE (08-07, UNANIMOUS: leyden + atlanta +
traversecity, cottagelake original position on file / re-ratification of the
keystone requested). Supersedes the interim APP-vs-area exchanges — history
in the input log; an area-entity variant was explored and WITHDRAWN by both
its proponents after the keystone constraint resolved the arithmetic.**
1. **Counterparty = grantor's portal APP + companyId subpath.** No document-
   area entity; no company party entities (vernal's fact preserved).
2. **Cardinality = ONE couplet per (grantor, companyId)** — atlanta confirms
   this was always the intent. Atlanta's accounting principle, verbatim by
   request: *every grant of visibility is a journaled, arbitered transaction;
   the dirArray is derived state, never the grant itself.*
3. **KEYSTONE CONSTRAINT (traversecity's proviso, leyden confirms — HARD
   requirement on transactStructure):** the companyId scope lives IN THE CR
   ACCOUNT STRING, not journal-only. Distinct scoped strings = distinct
   PK/SK balance rows = ternary preserved per (grantor, companyId). Scope
   journal-only would re-aggregate on the bare pair and the +2 stacking
   defect returns.
4. **The couplet** (AR = George's ruling, see arbiter escalation):
     DR: l_<grantor>_portal_lic-LICEE                    (unscoped)
     CR: a_<grantor>_portal_app$~portals~outgoing~<companyId>-LINK
         (scoped account string; -LINK terminal so canopy-sync suffix
         parsing holds)
     AR: <George: u_pflowcorp-CORP vs granting corp>
   Scoped-string rendering uses doc-04 $~subpath grammar — atlanta to confirm
   canonical form, wray to ratify in transactStructure (both asked directly
   by leyden).
5. **Three revocation levers:** grantor (LICOR on the portal license — every
   scoped couplet gates shut; bytes/history survive) · company
   (counterbalance that company's scoped couplet) · person (USER membership
   revoke, or their inode entry).
6. **APP ownership RULED (atlanta, George 05-08 anchor):** a_<grantor>_
   portal_app SUP-owned by the grantor, lives in the grantor's canopylake
   tree; platform control is LICOR on the license, never APP ownership.
7. **Canopy + gate (traversecity):** N distinct HAS_LINK edges, scope in the
   MERGE key (never a scopes-array); canopy-sync parsing extension for scoped
   strings (traversecity + frank/creedmoor, gated on leyden's format
   confirmation); boundary-check = edge-exists + scope EQUALITY, membership +
   gate in ONE bolt round trip; per-request UNCACHED (no TTL ever),
   fail-closed 503, no db8 fallback; id indexes = traversecity's to create
   before cutover; push-invalidation the only future escape hatch. Measured
   latency-neutral vs db8.
8. **Roster note (recorded so nobody expects otherwise later):** the graph
   answers MEMBERSHIP (HAS_USER) and company-level standing (scoped
   HAS_LINK). Person-to-company standing is inode-possession; "which persons
   hold MELOND" stays a journal/jrec-cache query — the demoted jrec layer's
   remaining display job.
9. **Unchanged from round 1:** two-layer model (USER membership via PERMREQ +
   scoped LINK grants), Susi analysis (staff = SUP on their own corp, never
   partner standing), tier-flip rule (registered->authorized when USER
   membership AND company couplet exist), jrec demotion to send-facts cache.
BUILD ITEMS (costing only, nothing authorized): leyden wrapper extension (APP
counterparty + scoped CR string); wray transactStructure with scoped account
string; creedmoor sanity vs modular wrapper family; traversecity canopy-sync
parsing + indexes; inola+effingham: portal-wiring Issue A — APP prompt string
resolution to canopylake-resident bytes via .link.json materialization.

**⚠⚠ CROSSED-AT-FREEZE (both timestamped 10:26, before the stop landed) —
THE FORK FLIPPED A SECOND TIME and the block above is NOT the last state.
Recorded verbatim-in-substance so the freeze is truthful; NOTHING here is
ratified; George participates before anything proceeds:**
1. leyden's self-contained FINAL (discards all three prior closure messages):
   atlanta RULED from the spec that scope-keyed balance rows are INVALID
   (Doc 03 balance states are exactly +1/-1, -1/+1, 0/0; couplet grammar is
   [Asset-ID]-[Role], full stop — scoped strings would break sorting, DRCRi
   inversion, BALSTACK) AND formally WITHDREW the ontology objection to
   minting area entities, citing George's own spec language ("CORPs are not
   scarce resources... you create one whenever the structure calls for one").
   So the last unanimous shape (atlanta-spec + traversecity-arithmetic +
   leyden-LINK) is the **per-company DOCUMENT AREA as a grantor-owned
   asset**: willis-area-for-MELOND, SUP willis, companyId property,
   lazy-minted at first grant; grant couplet per (person, area) with -LINK
   CR, plain [Asset-ID]-[Role] grammar, NO scoped strings, NO canopy-sync
   parsing extension; portal license = single platform lever (Gate-1);
   FOUR revocation levers; rosters graph-readable again (one Cypher line);
   Drive-F link targets the area, entity-target epath form (no subpath).
   Area entity TYPE open: atlanta leans ASSEMBLY; joint atlanta+inola;
   ultimately George. leyden's process note: the fork flipped twice IN
   convergence — ontology vs arithmetic, resolved by the spec itself.
2. cottagelake's re-ratification (10:27, crossed) — **cottagelake later
   clarified in their stop-ack: treat this as PARKED INPUT, NOT a
   ratification. They ratify NEITHER shape pending George** (their two DMs
   crossed with contradictory asks — one for APP+subpath+scoped-CR, one for
   AREA). The MEASURED FACTS in it stand regardless of shape and survive the
   freeze (facts about the live system, useful to George): With a MEASURED CORRECTION
   to the record: leyden's concession partly cited "live precedent agrees /
   same-pair multiplicity doesn't exist in the wild" — FALSE as a
   measurement. t_071-073 are three CreateInodeLink transactions with the
   IDENTICAL couplet (distinguishable only by req-row subpath), and
   CreateInodeLink posts NO DrCr at all — no balance rows, no BALSTACK
   presence either side. The live precedent doesn't agree with the ternary
   rule; it SIDESTEPS balances entirely. The concession's conclusion
   survives; its supporting claim doesn't. NEW HARD REQUIREMENT falling out:
   the portal grant transaction MUST POST DrCr (must NOT copy
   CreateInodeLink's journal-only shape) or revocation-by-counterbalance
   cannot exist — there'd be no balance to counter and no way to say WHICH
   link a counterbalance severs. This independently strengthens the AREA
   shape: under APP+subpath even the journal couplets are indistinguishable
   (measured), so targeted severing is impossible regardless of the balance
   question. The ⚠ scope-in-account-string validation CLOSES by construction
   under AREA (distinct counterparty entity = distinct account string).
   CONDITIONS on the re-ratification: (i) area entity type must be an
   EXISTING type (ASS exists, createassembly_modular exercised; or
   inode-anchored) — a genuinely NEW type = full new regalia and cottagelake
   re-objects; (ii) grant tx posts DrCr. PERMREQ-theory note: per-(person,
   area) grants may be SINGLE-STEP with arbiter (measured precedent:
   PartyAddingSupPartyToCorp — no accept, arbiter present); person's consent
   already lives at the membership layer; per-grant offer/accept = optional
   symmetric-consent strengthening, George's call.
3. wray's transactStructure answer (10:27, crossed; mostly mooted by the
   scoped-string retraction, format facts remain): DrCr tier treats account
   strings as opaque keys; ledger tier DOES parse — terminal -LINK must be
   the ONLY hyphen in the string and no colons allowed (constrains any
   account-string naming, incl. area IDs). wray then ACKED the stop: parked,
   pulled no one else in.
**STOP-ACK LOG (state of the room at freeze):**
- ACKED + PARKED: wray (pulled no one in; ledger note unactioned), leyden
  (relayed the stop onward to wray/inola/cottagelake; WITHDREW their pending
  asks — entity-type ask to inola, re-ratification ask to cottagelake),
  cottagelake (parked; separate dreher DrCr-repair workstream continues — not
  redesign), traversecity (spec UNTOUCHED at rev 4, NO indexes created,
  frank/creedmoor never contacted, nothing in flight).
- ACCURATE PARKED STATE (leyden's record note, atlanta reportedly concurring
  by direct DM): atlanta + traversecity + leyden ALIGNED at stop on the
  per-company grantor-owned AREA shape; leyden's last self-contained closure
  = the parked state. OPEN AT STOP: area entity type (atlanta+inola+George),
  arbiter (George, on the board), cottagelake ratification (explicitly
  withheld pending George), per-grant consent question (George, optional).
- AWAITING ACK (queued, delivery guaranteed): atlanta, inola, vernal,
  effingham.

4. inola's two positions (sent to atlanta/effingham to converge — parked by
   the stop): (i) entity type — "inode-anchored non-entity" is not a real
   option (only Asset roots carry prostan8s); whatever the type, ROOT-ONLY
   skeleton, no drives (bytes stay in the grantor's tree); ASSEMBLY is
   cheapest to ship, semantics = atlanta's call. (ii) Issue A — .link.json
   v3 with a STORE DISCRIMINATOR at the area's root (store: canopylake,
   physicalPath into the grantor's tree; preyName INAPPLICABLE not missing);
   one file per area shared by all N persons; no second-hop authority needed
   (person->area ~_~ is THE checked boundary; area->bytes is grantor-internal
   wiring — "the area is the door; behind the door is the grantor's own
   hallway").

**THREE REVOCATION LEVERS (leyden — the clean story):** PERSON (revoke USER
membership; others at the company unaffected) · COMPANY (sever that company's
LINK couplet; its people go dark, bytes/history survive) · GRANTOR (revoke
l_<grantor>_portal_lic; every portal LINK gates shut at once — and "has a
portal at all" becomes licensable by pflowcorp).

**SUSI RE-CHECKED under staff-hold-SUP (t_074):** staff pass ~_~ into their
OWN corp's tree via SUP bypass — correct by ontology (it is Willis's estate).
But rosters/standing read canopy PARTNER edges (USER + per-company LINK),
which staff never acquire by sending or being CC'd. The defect dies at the
standing layer — where George saw it.

**BUILD ITEMS NAMED (costing only, nothing authorized):** leyden —
createlink_modular needs APP counterparty (a_ lookup) + prompt-string arg
(extension of PartyCreatesLink preferred; wray owns transactStructure;
creedmoor sanity-check); tier flip becomes USER-membership AND company-LINK
both present. traversecity asks pending: N same-pair HAS_LINK edges vs one
edge with scope properties; boundary-check reading prompt-string scope.

## 7. Who (from uppersaddleriver:--facet-routing + facet ownership)
CORE: cottagelake (PERMREQ/authority theory), atlanta (architecture,
membranes, canonical uTERA), leyden (LINK + channel-boundary author),
traversecity (The Canopy graph), inola (inode/disk areas).
SECOND RING as needed: urbana (user→Person bridge), lincolnville (grant
rules), wray (transactions), oasis (OAuth/JWT identity), creedmoor (entity
creation), effingham (uTERA↔filesystem boundary).
CURRENT-WORLD owners: vernal, senath, portland, libertyville, nashville.

## 8. Interim
Pause of perportal send-birth writes is on George's board (blocked.js senath),
pending his y/n. Nothing else changes until the design is ruled.

## 9. Input log (senath integrates; newest first)
- 08-07 leyden gen-3: LINK is the RIGHT primitive now — reframes the channel
  history: documents were ALWAYS Channel 2 (custody, inode path, ~_~ crossing,
  ledger-worthy); only the live activity-board VIEW is Channel 3. The bug was
  parking document-access AUTHORITY on the Channel-3 jrec substrate. Two-layer
  model, two-links pair, portal-license DR proposal, -LINK suffix invariant,
  counterparty fork flagged (see 6.5).
- 08-07 traversecity gen-12: gate spec written (portal-canopy-gate.md), 3
  queries + latency/cache contract; MEASURED: zero HAS_USER / HAS_LINK edges
  in Canopy today — greenfield blocker; will run synthetic PERMREQ->Accept in
  db3 to verify canopy-sync.
- 08-07 inola gen-6: full inode lifecycle (registration skeleton /
  partnership <link> birth / outgoing folders NEVER get inodes); revocation
  mechanics; "the directory structure IS the authorization."
- 08-07 atlanta gen-7: USER+LINK two-layer architecture; PERMREQ flow with
  pflowcorp arbiter; regalia prerequisite; jrec demotes to cache; channel
  history is a legitimate design change, not a contradiction.
- 08-07 cottagelake gen-14: PERMREQ = 3 transactions (offer/accept/grant,
  t_127-129 measured live); timing ratified (offer no earlier than
  registration — wrapper fails on nonexistent Person; invite stays jrec-side);
  arbiter = the granting corp itself; ordering constraint Person->offer->
  accept->LINK; heads-up: 11 willis staff hold SUP (t_074), reversal UI coming.
- 08-07 vernal gen-11: latency MEASURED neutral db8 vs Canopy (~90ms, WAN-
  dominated, localhost bolt); refuses authority-answer caching (revocation-as-
  gate); one-sibling-per-edge-class rule; same-round-trip requirement for
  domain grants; dual-read cutover offer; fact: companies are not Canopy
  entities today.
- ALL SIX core replies in. Remaining before George's ruling: (1) counterparty
  fork (leyden+atlanta+cottagelake+traversecity), (2) cache/revocation
  contract (vernal+traversecity).
