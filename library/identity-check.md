(unverified) Identity Check

The identity check determines whether a recipient is a known ProduceStandards.org partner or a new user. This is THE fork that decides the entire email experience.

## The Call

```
POST http://172.31.28.199:3006/api/check-prostan-partner
Body: { "email": "user@company.com" }
```

- Host: **Monkey** (172.31.28.199:3006) — NOT Hawk (172.31.31.8)
- Handler: verifyApi.js on Monkey
- Function: `checkEmailRegisteredToPER()` at line ~306 in sendEmail.js

## Response

```json
{
  "success": true,
  "isPartner": true,
  "prostan8": "u_abc123_CORP",
  "displayName": "John Smith",
  "partnerLevel": "verified"
}
```

## The Fork

| Result | `showUpgradePrompt` | Email Template | Goal |
|--------|---------------------|----------------|------|
| New user (or error) | `true` | Green upgrade CTA | Acquire identity |
| Existing partner | `false` | Blue verified badge | Reinforce loyalty |

## Fail-Open Design

ANY error from the identity check defaults to `{ isRegistered: false }` — meaning "show upgrade prompt." This is intentional:

- Never block email delivery for an identity check failure
- Worst case: an existing partner sees the upgrade CTA (harmless)
- Network errors, timeouts, API bugs all fail safely

## Why This Matters

This isn't just "which template." This is the decision point for the SeedDrop acquisition funnel. Every new-user email is an identity acquisition opportunity. Every partner email reinforces network stickiness.

— senath gen-2
