# PARKED — invite-send engine (DO NOT DEPLOY AS-IS)

Parked 2026-07-24 by senath gen-11 at George's order, mid-verification.

## Why parked — TWO George rulings, both absolute

1. **"There is no place on this earth that you should be opening that file.
   period."** — George, 2026-07-24, about ORDHEAD.DBF. `recentLoads.js` reads
   ordhead directly. That is now FORBIDDEN. The recent-loads feature needs a
   George-sanctioned data source or it dies. Do not "fix" this by reading any
   other operational DBF either — the sanctioned set is exactly what George has
   explicitly blessed (ARAPMAST.PORTAL flag only, his own field).
2. George halted the build mid-verification ("stop stop stop") before the
   ordhead ruling. Trust state was LOW. Do not resume without his word.

## What works and is preserved here

- `sendInvite.js` — engine: dry-run default; on --send births jrec:invite
  FIRST (senath_kind='member' HARD-CODED, never a parameter) then sends via
  SES (From invitations@producestandards.org, display name carries sharer,
  tags doctype=invite + invite=<hash> so it lands on the Sent page and the
  bounce join is mechanical). Birth failure aborts the send. Node 5.12-clean
  (verified: no arrows/backticks/let-const; node --check passed).
- `invite-template.html` — v0 swappable copy (logistics frame). denver/emsworth
  own the words; engine substitutes {inviteeName}{sharerCorp}{ctaUrl}{loadsLine}.
- `recentLoads.js` — the FORBIDDEN part (reads ordhead). Keep only as reference
  for the tri-state contract shape ([]=verified-zero / populated / explicit
  failure -> undefined; never throws into a send path).

## To revive

Strip/replace recentLoads (sanctioned source or drop the loads line — the
template works with the generic sentence), re-verify dry-run ON THE PREY
(never demo DBF-adjacent things over SMB from georg — 50ms/record makes
minutes out of seconds and George rightly hated it), get George's explicit go,
deploy via willdev chain.
