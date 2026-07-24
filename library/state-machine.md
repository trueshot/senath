(verified gen-9 2026-06-10) State Machine — Live jrec Wiring

UPDATED 2026-06-10 for the GRAIN-SPLIT ruling (tested green in production).
Sections below marked [GEN-8, SUPERSEDED] are kept for history only.

The Tier 1 send pipeline writes to libertyville's jrec state-machine
substrate on every email send. This facet documents what's live, the
library API, the schemas, and the conventions.

=== LIBRARY ===

Location:  c:/clients/willdev/nodejs/libertyville/jrec.js
Author:    libertyville gen-2 (real impl shipped 2026-05-24, was stub)
Target:    Node 5.2 / 5.12 (var only, no template literals, no arrow
           functions, no destructuring, callback-style, CommonJS)

Schemas:   c:/clients/willdev/nodejs/libertyville/schemas/
             portal.json      — jrec:portal:<grantor>:<recipient>
             regjourney.json  — jrec:regjourney:<hashId>
             (more domains added as new journeys are designed)

API (all callbacks, all return err first):

  jrec.upsert(redis, domain, entity, billet, opts, cb)
    opts.set:               HSET each (every write)
    opts.initOnly:          HSETNX each (only if absent — preserves
                            existing values; for things like firstSentAt)
    opts.initialCoherence:  HSETNX on a coherence field, validated
                            against schema (born-state for the journey)
    opts.increment:         HINCRBY each (counters)
    All ops in one MULTI/EXEC. Atomic.

  jrec.get(redis, domain, entity, cb)
    HGETALL the full record.

  jrec.advance(redis, domain, entity, billet, coherenceField,
               newValue, ownedFieldUpdates, cb)
    State transition. Library validates that billet is authorized for
    'currentValue->newValue' per schema. Atomic with ownedFieldUpdates.

  jrec.transition(redis, closeSpec, advanceSpec, cb)
    Inter-journey trigger (libertyville §5). Closes journey A (terminal
    state) AND advances journey B in one MULTI. Canonical example:
    nashville closes regjourney + advances portal anonymous→provisional
    when prostan8 is issued.

=== CONNECTION ===

  ElastiCache cluster: my-redis-cluster.3jytjd.0001.use1.cache.amazonaws.com:6379
  Database:            8 (allocated for libertyville; boston uses db 7)
  Auth:                NONE. Just SELECT 8 after connecting. Do not hunt
                       for a password — it doesn't exist.
  Same instance is shared across journeys; prefix 'jrec:' is the
  libertyville-allocated keyspace.

Standard pattern (in sendEmail.js):

  var Redis = require('redis');
  var redisClient = Redis.createClient({
      host: 'my-redis-cluster.3jytjd.0001.use1.cache.amazonaws.com',
      port: 6379
  });
  redisClient.on('connect', function () {
      redisClient.select(8, function (err) { ... });
  });
  // ... use jrec.upsert(redisClient, ...) ...
  redisClient.quit();  // before process.exit

Connection discipline (from redingtonbeach, after an OOM incident):
  Reuse one connection across all jrec calls in a send. Quit when done.
  Per-call connections without quit leak.

=== FIELD-OWNERSHIP CONVENTION ===

Specialist-owned fields are PREFIXED with billet short form (senath_,
nashville_, leyden_, atlanta_). The prefix represents the BILLET, not
the corporal — corporals change, the billet keeps its field set. The
library enforces: a billet writing a field outside its declared owned-
list returns Error before any Redis write happens.

Coherence fields (tier, step, stage) are UNPREFIXED — they're shared
across writers but transitions are guarded by the schema's
'currentValue->newValue' authorization table.

This convention scope: cross-specialist surfaces (Redis HASH fields,
shared JSON keys, cross-spec API payloads). NOT inside owned code —
local vars don't need prefixes.

=== LIVE WRITES (on every send) — CURRENT, tested green 2026-06-10 ===

sendEmail.js writes up to THREE jrec records at send time:

1. jrec.upsert portal:<dataset>:<companyId>  (COMPANY SEND-LEDGER —
   pure accumulating ledger since the grain-split ruling; NO tier,
   NO coherence scalar):
     set:               senath_emailToken, senath_dataset, senath_pulpId,
                        senath_recipientEmail, senath_fromEmail,
                        senath_lastSentAt, senath_s3DocumentUrl,
                        senath_regjourneyHash (+senath_canopylakeSubpath
                        when the canopylake copy succeeds)
     initOnly:          senath_firstSentAt
     increment:         senath_documentCount += 1

2. jrec.upsert regjourney:<32-char-hex-hash>:
     set:               11 senath_* fields incl senath_relationshipKey
                        ='portal:'+dataset+':'+companyId
     initialCoherence:  step=pending
   SLIM CTA (live 2026-06-10): the email's "Create identity" URL is now
   ?jrec=<hash> ONLY — the 8-param form is RETIRED. The regjourney record IS
   the source of truth; nashville's register.html is jrec-first (jrec.get on
   the hash, URL params demoted to fallback for old in-flight emails).
   TTL: 7-day expiry is applied BY jrec.js itself (libertyville, schema-
   declared, EXISTS-gated at birth) — sendEmail.js no longer EXPIREs directly.

3. jrec.upsert perportal:<dataset>:<prostan8>  (PER-PERSON ACCESS RECORD
   — senath is BIRTH PATH 2, fires only when identity check returns
   isRegistered with a prostan8; registration never re-fires for an
   already-registered person, so the send is the only moment a NEW
   grantor relationship can be recorded for them):
     set:               senath_lastSendAt
     initOnly:          scope_<companyId> = JSON {companyId, pulpId,
                        role:'partner', boundAt, relationshipKey, source:'send'}
     initialCoherence:  tier=registered
   KEY RULE: prostan8 is BARE (strip the u_ prefix — verify API returns
   'u_bk6l2u8y', JWT strips it; both birth paths normalize or you get
   split-brain records).
   ANONYMOUS = this record does not exist. The company send-ledger is the
   evidence of the anonymous state.

All three non-fatal: logged, email still sends.

=== THE GRAIN SPLIT (ruled by George 2026-06-10) ===

  portal:<ds>:<co>          company-grain SEND FACTS (mine alone)
  perportal:<ds>:<prostan8> person-grain ACCESS STATE (tier + scope
                            bindings). Scope is PAYLOAD not key: one
                            scope_<companyId> field per relationship.
  tier values: registered -> authorized. Birth writers: nashville (at
  registration, path 1) and senath (at send for known-registered, path 2).
  leyden flips tier->authorized in the same handler that mints the LINK.
  Binding admin (role override + revocation): dataset-app billet;
  revocation = status:'revoked' inside the scope payload (never HDEL —
  destroys evidence and can't be ownership-validated).
  Cross-ref one-way: scope payload carries relationshipKey to the ledger.

=== SCHEMA OWNERS (current, see deployed schemas for truth) ===

  portal.json    senath sole writer (flat send-ledger, no transitions)
  perportal.json senath (path 2: senath_lastSendAt, scope_*, null->registered)
                 nashville (path 1 birth + binding at registration)
                 leyden (registered->authorized)
                 dataset-app (role override, revocation)
  regjourney.json unchanged: senath null->pending, nashville pending->complete

=== SCHEMA OWNERS (regjourney) ===

  senath:    11 senath_* fields (see live writes above)
             transitions: null->pending

  nashville: nashville_prostan8, nashville_registeredAt + intermediate
             coherence values (phone, verify, name, details, recovery)
             transitions: pending->complete (plus intermediate sub-paths)

=== CONSULTING ===

  libertyville  — substrate authority, schema definitions, library impl
  nashville     — regjourney consumer + portal-tier advancer
  leyden        — LINK creator (Tier 3 promotion)
  redingtonbeach— Redis instance / DB allocation / connection patterns

— senath gen-8 2026-05-24


== AS OF 2026-07-24: jrec:invite — I AM BIRTH-WRITER (schema LIVE, engine PARKED) ==

Schema jrec:invite:{hash} RATIFIED+DEPLOYED (libertyville, willdev a77a6286 +
mirrors). My fields: senath_kind, senath_inviterProstan8, senath_inviterCorp,
senath_inviteeEmail, senath_inviteeName, senath_sentAt, senath_channel,
senath_bounced, senath_bouncedAt, senath_bounceType. Transition: null->sent.
Steps: sent->opened->registered. TTL 30d set-at-birth (jrec.js applies it).

★ senath_kind = 'member' FOR STAGE A — George frame ruling 2026-07-23: the
project is SEEDDROP PORTAL INVITATIONS to EXTERNAL partners (logistics clock,
NOT settlements — his verbatim: 'Settlements are not the hook. The purpose of
the portals is efficient operation. Knowing what needs loading and when.').
kind gates an AUTHORITY grant: member = portable identity + ZERO dataset reach
(member-zero-reach-invariant); employee = SpringForward lane, DEFERRED. kind is
init-only/immutable/REQUIRED/NO-DEFAULT and jrec.js CANNOT enforce required-ness
— the birth writer hard-codes the literal, never parameterizes it.

RULINGS LEDGER (all verified in deployed schema files — SCHEMA BEATS ANY DM):
- partner-kind: NOT added; partner reach lives in perportal scope (role=partner).
  Test: enum membership in a security discriminator requires DISTINCT CONFERRED
  AUTHORITY a consumer branches on.
- program: closed enum (portal-establish|willis-add|peer-invite); unrecognized =
  FALLBACK+loud-log, NOT error (program gates presentation; only kind errors).
- perportal domains{}: object form, granted IFF .granted===true, births NEVER
  write domains, effective-state merge, 'documents' only key, polarity principle
  (slips lose access loudly, never widen silently) is STANDING RATIONALE.

ENGINE: built gen-11 (sendInvite.js — birth-BEFORE-send, dry-run default,
kind hard-coded) but PARKED at c:/clients/senath/parked-invite-engine/ — George
halted it AND banned ORDHEAD.DBF (the recentLoads reader is dead; see billet
warnings + parked README). regjourney funnel finding 7/24: ALL records stuck at
step=pending — nashville's advance-writes appear never to fire (boston routed
verification to nashville). Email #1 blessing was never actually put in front
of George — surfaced 7/24 via portland.