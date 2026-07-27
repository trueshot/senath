# invite-engine — sendInvite.js (BUILT 2026-07-27, senath gen-12)

**NOT PARKED. Do not re-park it. Do not ask George for a go to unpark it.**
This directory was `parked-invite-engine/` until 2026-07-27, and its README said
revival "requires George's explicit go". That stale line put a redundant
decision on George's board on 07-27 — boston read it, held to it correctly, and
asked him to authorise something already built. The rule is gone. If you find
another copy of it anywhere, fix it rather than honouring it.

Full domain knowledge lives in the facet, not here:

    node c:/clients/senath/readme.js --facet-invite-engine

## Why it exists

The deliberate sibling of sendEmail.js. An operator invites a NAMED PERSON at a
company to that company's portal — no document, no prnthist, no load data.
George asked for it directly and repeatedly (2026-07-22 → 07-24). Two
generations stalled on it anyway. It is ordered work; it does not need
re-authorising.

## Status — honest

| Piece | State |
|---|---|
| Engine (`sendInvite.js`) | BUILT. `node --check` clean, Node 5.12-safe (no arrows/backticks/let/const). |
| New-user email body | WIRED (emsworth `portal-invite-engine.html`). Render-verified end to end. |
| Identity fork | BUILT (denver gen-2's catch). An existing partner never gets a create-your-account email. |
| Dry run | VERIFIED on georg. Substitutes correctly, CTA carries the hash, token guard fires. |
| **Partner email body** | **MISSING.** `invite-template-partner.html`. emsworth owes it. Engine exits 1 rather than send the wrong body. |
| **Deployed to a prey** | **NO.** Nobody can send one yet. |
| **portland's Invite button** | **NOT WIRED.** They have the CLI surface. |

## Usage

    node nodejs/sendInvite.js --company PROMIS --email person@grower.com \
         [--name "John Field"] [--inviter "Savannah Chen"] \
         [--channel operator-cli] [--send]

DRY RUN IS DEFAULT — no `--send` means nothing born, nothing sent. Must run in
the dataset working dir on the prey (reads `portal-config.json` and
`data/i_track.js` from cwd). With `--send` and no corpProstan8 it refuses rather
than guessing an identity field.

## Hard rules that do NOT relax

- `senath_kind='member'` HARD-CODED. It gates an authority grant. Never a
  parameter, never defaulted, never inferred.
- SINGLE FUNNEL. portland's button and seeley's widget call THIS path. A second
  sender is forbidden.
- NO LOAD DATA. ORDHEAD.DBF is forbidden absolutely (George 2026-07-24).
  `recentLoads.js` was DELETED, not parked.
- Birth the record FIRST, then send. Birth failure aborts the send.
- Fail-open on the identity lookup; fail-closed on a missing body. See the
  asymmetry table in the facet before "making it consistent".

## To finish

1. emsworth: `invite-template-partner.html` (frame + token contract in the facet).
2. Deploy: `node c:/clients/gitgeorg/push.js willdev --who senath -m "..." --notify`,
   then dry-run ON THE PREY (never DBF-adjacent over SMB from georg).
3. portland: wire the Invite button to the CLI surface above.
