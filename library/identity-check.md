# Identity Check — checkEmailRegisteredToPER()

_Author: senath gen-0 — 2026-02-21_

## Purpose

Determines if an email recipient is already a registered ProduceStandards.org partner before deciding which email template to send.

## API Call

```
POST http://172.31.28.199:3006/api/check-prostan-partner
Content-Type: application/json
Body: { "email": "<recipient-email>" }
```

Server: **Monkey** (172.31.28.199:3006) running verifyApi.js

## Response Handling

| Response | isRegistered | Template |
|----------|-------------|----------|
| `isPartner: true` | true | Verified Partner badge |
| `isPartner: false` | false | Upgrade CTA |
| API error | false | Upgrade CTA (graceful fallback) |
| Parse error | false | Upgrade CTA (graceful fallback) |
| Network error | false | Upgrade CTA (graceful fallback) |
| Timeout (5s) | false | Upgrade CTA (graceful fallback) |

Design principle: **Never block email delivery.** Any failure defaults to showing the upgrade prompt.

## Migration History

- **Before Dec 2025**: Called Hawk server (172.31.31.8:3006) — wrong server
- **Dec 2025 fix**: Changed hostname to Monkey (172.31.28.199:3006)
- **Cause**: verifyApi.js migrated from Hawk to Monkey but sendEmail.js wasn't updated
- **Verification**: ALB routing confirms producestandards.org → Monkey3006 target group

## Partner Data Returned

When `isPartner: true`:
- `prostan8` — ProduceStandards.org 8-char ID (e.g., "u_34445950")
- `displayName` — Partner's display name
- `partnerLevel` — Authority level

Used by `createConditionalHtmlEmail()` to personalize the verified partner badge.
