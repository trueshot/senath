# PARKED — invite-send engine (DO NOT DEPLOY AS-IS)

Parked 2026-07-24 by senath gen-11 at George's order, mid-verification.
Cleaned 2026-07-24 by senath gen-12: recentLoads.js DELETED, loads machinery
stripped from sendInvite.js. Contract below corrected per George's brief.

## THE RATIFIED CONTRACT (George's brief to gen-12, 2026-07-24)

The production entry point for a DELIBERATE INVITATION — inviting a named
person to a portal without sending them a document.

- Takes {companyId, inviteeEmail, inviteeName}.
- Reached ONLY through detroit's operator-gated route — never browser-direct
  to a send.
- Sends the invitation email AND births the tracked invite record — the same
  journey class nashville's registration resolves, so the person's link
  attaches them to the right company.
- kind='member', HARD-CODED, never a parameter. Story is SeedDrop portal —
  never SpringForward, never employee, never settlement promises.
- SINGLE FUNNEL: the Portal Manager Invite button and seeley's widget both
  call this ONE path. Nothing else ever sends an invite. The A0 email George
  received was a one-off prototype script, NOT this path — a second sender
  is forbidden by the ratification.
- Delivery shows on the Sent page (doctype=invite tag).
- NO LOAD DATA. An invitation is about identity and company attachment.
  ORDHEAD.DBF is forbidden absolutely (George, verbatim: "There is no place
  on this earth that you should be opening that file. period."). The
  recentLoads.js reader was deleted, not parked.

## THE TWO GATES — build waits for BOTH, neither has opened

1. denver's corrected two-email SeedDrop copy lands with senath.
2. George BLESSES email #1 (the ask was never actually put in front of him).

gen-11's failure was building ahead of these gates. Do not repeat it.

## What is preserved here

- `sendInvite.js` — engine skeleton: dry-run default; on --send births
  jrec:invite FIRST (senath_kind='member' hard-coded) then sends via SES
  (From invitations@producestandards.org, display name carries sharer, tags
  doctype=invite + invite=<hash> → Sent page + mechanical bounce join).
  Birth failure aborts the send. Node 5.12-clean (node --check passed after
  the 7/24 gen-12 cleanup). {loadsLine} slot now gets one generic sentence.
- `invite-template.html` — v0 PLACEHOLDER copy only. denver/emsworth own the
  words; the real template arrives via gate 1 above.

## To revive

BOTH gates open (denver's copy in hand + George's blessing of email #1) AND
George's explicit go on resuming this build. Then: wire behind detroit's
operator-gated route, re-verify dry-run ON THE PREY (never demo DBF-adjacent
things over SMB from georg), deploy via willdev chain.
