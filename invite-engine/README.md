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

Last verified 2026-07-27 16:00. **If you change any row, change it here in the
same breath** — three stale artifacts of mine cost peers real time today
(a "requires George's go" rule, an "awaiting go" status line, an undated email
capture). A status table that lies is worse than none.

| Piece | State |
|---|---|
| Engine `invite.js` (mountable) | **BUILT + DEPLOYED.** Node 5.12-safe. Coded errors, watchdog, `capabilities()`. |
| CLI `sendInvite.js` | BUILT. Thin wrapper over the same function — ONE sender, two doors. |
| New-user body | WIRED + render-verified (emsworth). |
| Partner body | WIRED + render-verified (emsworth, 07-27). |
| Identity fork | BUILT (denver's catch). An existing member never gets a create-your-account email. |
| CTA fork | BUILT (nashville's call). Partners → `signin.html`, not the registration form. |
| Partner pre-binding | BUILT. Scope written FAIL-CLOSED before the email leaves. |
| Deployed to preys | **YES** — 07-27: willis, willdev + mirrors wey, farmwey. **DORMANT**: no route registered, cannot send. |
| detroit's gated route | **LIVE** (as of 07-28): `POST /api/v1/portal/invite/:dataset`, vernal ruled invite grant-class, allowlist = George only. |
| New-user sends | **LIVE** (07-28): `NEW_USER_PATH_READY=true` on nashville's direct confirmation; their `?invite=` handler is live + QA-walked. |
| portland's Invite button | **WIRED + LIVE** (07-28), capability read shows both paths open. |
| **The engine's SES send** | **NEVER FIRED** (as of 2026-07-29). Cold chain proven only from SEEDED records. ← the only row that matters. |
| First real send | With George: choose invitation #1 recipient (portland's board flag, seeley's ranking: Sarah Peters RJSLOG vs Jay Delk DELKME). |

## Usage (CLI)

    node nodejs/sendInvite.js --company PROMIS --email person@grower.com \
         [--name "John Field"] --inviter-p8 <prostan8> --inviter "Display Name" \
         [--channel operator-cli] [--send]

DRY RUN IS DEFAULT — no `--send` means nothing born, nothing sent. Run in the
dataset working dir on the prey (reads `portal-config.json` and
`data/i_track.js`). On `--send` it REFUSES rather than guessing: no dataset, no
corpProstan8, or no inviter identity = no send.

★ `--inviter-p8` is the inviting PERSON (George: "yes it is me if I am logged
in"). The OLD `--inviter`-only form recorded nothing — it was parsed and never
used, so a caller believed they had attributed an invitation and had not.

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
