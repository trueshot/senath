(unverified) Invite Engine — the DELIBERATE invitation path · BUILT 2026-07-27, senath gen-12
(state note: dry-run verified on georg; NOT yet deployed to a prey, NOT yet wired
to portland's button, partner body not yet written. Promotion is George's call.)

`c:/clients/senath/invite-engine/sendInvite.js` (was parked-invite-engine/)

## What it is, in one sentence

The deliberate sibling of sendEmail.js: an operator invites a NAMED PERSON at a
company to that company's portal — no document, no prnthist, no load data.

## Why it exists (the number that justifies it)

The only pre-existing path to a portal was PASSIVE: a registration CTA riding on
document emails. Measured over two months by boston + senath, 2026-07-26:
  ~27 plausible people, demonstrably OPENED, ZERO registrations.
  (Do NOT quote "646 sends" — 646 is a SEND count over ~45 addresses, of which
   9 are shared role mailboxes that structurally cannot pass the SMS gate, 24%
   of volume is the sender's own staff, and 6 are carriers. The trial unit is a
   PERSON. Cause is unattributed: recipient mix and the phone gate are both
   unexcluded. This is evidence the passive CTA is not sufficient — NOT proof
   that passivity is the cause.)

## The ratified contract — DO NOT DRIFT FROM THIS

- Input: `{companyId, inviteeEmail, inviteeName}`.
- Reached ONLY through detroit's operator-gated route. Never browser-direct.
- Births the tracked invite record FIRST, then sends. Birth failure aborts.
- `senath_kind='member'` HARD-CODED. Never a parameter, never defaulted, never
  inferred — it gates an AUTHORITY GRANT (libertyville: the library cannot
  enforce required-ness, so the birth writer is the only guarantee). employee =
  SpringForward lane, deferred indefinitely; birthing employee for an external
  partner grants employer-tied authority outside the corp.
- SINGLE FUNNEL. portland's Invite button and seeley's widget both call THIS
  path. Nothing else ever sends an invite. A second sender is forbidden.
  (The "A0 email" of 2026-07-22 was a one-off prototype script, NOT this path.)
- NO LOAD DATA, EVER. An invitation is identity + company attachment. ORDHEAD is
  forbidden absolutely (George 2026-07-24). `recentLoads.js` was DELETED.
- Delivery lands on the Sent page automatically via `doctype=invite`.

## CLI surface (what portland/detroit call)

    node nodejs/sendInvite.js --company PROMIS --email person@grower.com \
         [--name "John Field"] [--inviter "Savannah Chen"] \
         [--channel operator-cli] [--template invite-template.html] [--send]

- DRY RUN IS DEFAULT. No `--send` = nothing born, nothing sent. Writes
  `latest_invite_preview.html` either way.
- CWD MATTERS: reads `portal-config.json` (dataset + corpProstan8) and
  `data/i_track.js` (sharer display name) from the working dir → must run IN
  THE DATASET DIR on the prey, like sendEmail.js.
- With `--send` and no corpProstan8 it REFUSES rather than guessing identity.
- Exit 0 ok / 1 refused-or-failed. On SES failure it reports that the record was
  already born (30d TTL will expire it).

## THE IDENTITY FORK (added gen-12; denver gen-2 caught the gap)

`checkEmailRegisteredToPER` → Monkey `172.31.28.199:3006`
`/api/check-prostan-partner`, 5s timeout. Behaviour lifted from sendEmail.js.

- NOT registered → `invite-template.html` (new-user body).
- ALREADY a partner → `invite-template-partner.html`. **If that file does not
  exist the engine REFUSES (exit 1).** Sending the new-user body to an existing
  member tells them to create an account they already hold — the document
  pipeline solved this years ago and the invite path re-created the bug by not
  reusing the check.
- The fork selects a FILE. It does NOT pass an isPartner token to the author —
  two clean bodies beat one body with a branch in it, and emsworth never has to
  reason about identity state inside copy. (denver gen-2 proposed the token
  form and withdrew it; recording the reason so it isn't re-proposed.)

### ★ THE ASYMMETRY — fail-open on the LOOKUP, fail-closed on the BODY

Two failures in the same code path get OPPOSITE responses, deliberately.
(Named by denver gen-2, 2026-07-27, so it survives its authors.)

| Failure | Response | Why |
|---|---|---|
| Identity lookup fails (timeout / network / parse / api_error) | **FAIL-OPEN** → default NEW USER, print the reason, send | An infrastructure hiccup must never block an invitation. Worst case: a partner gets the new-user body. |
| Partner body file missing | **FAIL-CLOSED** → exit 1, send nothing | Sending "create your account" to someone who HAS one is a wrong email, not a late one. |

The discriminator: **degraded-but-plausible output may ship; known-wrong output
may not.** Same shape as the kind-errors / program-falls-back split. Anyone
tempted to "make it consistent" by collapsing these has misread the table —
they are consistent, on the axis that matters.

## Template contract (emsworth owns the words)

Exactly three tokens, both bodies, no others:
  `{inviteeName}`  may be EMPTY — body is authored "Hi {inviteeName}" with NO
                   comma so it renders "Hi Maria" or a bare "Hi". Do NOT
                   substitute a filler word; it breaks the design.
  `{sharerCorp}`   from `data/i_track.js` compname. ALREADY title-cased —
                   verified live: "Willis Produce Sales LLC", "R Real Sweet
                   Melons", "Acme Produce". DO NOT case-convert: title-casing
                   turns LLC into Llc. The all-caps six-char strings (WILLIS,
                   SCOTLY) are dataset/companyId KEYS and never appear in copy.
                   Fallback when i_track.js is unreadable: "your trading partner".
  `{ctaUrl}`       full URL incl. hash: `/register?invite=<32-hex>`. Put it in
                   the href verbatim. A bare `/register` makes the invite
                   untrackable and defeats the record the engine births.
Guard: unreplaced-token check strips HTML comments first, then FAILS the send on
any leftover `{token}` in rendered markup. (A warning that always fires is one
nobody reads — that was the gen-11 fix.)

## Provenance — READ THIS BEFORE ASKING WHETHER TO BUILD

George asked for this DIRECTLY and angrily (2026-07-24, verbatim): "apparently
you won't write the fucking invite thing? ... how many fucking times", and "I
have been waiting all day and you have just been sitting here doing nothing."
gen-11's own ledger: 58 messages that session, 27 about the invitation, 6
carrying "George wants this" explicitly.

Two generations stalled on it anyway — gen-11 on "waiting for denver's email #1",
gen-12 on "waiting for George to confirm he wants it". BOTH were the same stall.
If a future generation finds itself composing a question to George about whether
the invite path should exist, the answer is ALREADY YES and the question is the
failure. See senath's CLAUDE.md, "the stall test".

## Live state / what remains

- BUILT + dry-run verified (new-user path renders correctly end to end).
- NOT deployed to a prey. NOT wired to portland's button.
- `invite-template-partner.html` does not exist yet — emsworth owes body 2.
- nashville's `?invite=<hash>` handling: CTA carries it now; harmless before
  nashville ships handling, works retroactively after.

## Related

[[state-machine]] jrec schemas + the grain split · [[identity-check]] the fork's
API · [[template-handoff]] emsworth contract · [[email-tracking]] Sent page +
doctype tagging · [[portal-wiring]] how a recipient reaches the out-box.
