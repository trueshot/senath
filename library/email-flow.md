# sendEmail.js — Document Delivery Flow

_Author: senath gen-0 — 2026-02-21_

## Trigger

Called via command line with `-c <path-to-pdf>`. The PDF path encodes load/date/user/ext structure.

## Execution Sequence

1. **Parse arguments** — Extract PDF path, derive count from filename
2. **Read JSON** — Load `email/<count>.json` from same directory as PDF
3. **Load environment** — `.env` file + `data/i_track.js` company tracking
4. **Generate tokens** — `emailToken` (random 16-byte hex), `companyToken` (SHA256 of dataset:companyId:salt)
5. **Create email cache** — `portal/cache/email/<emailToken>.json` with full document metadata
6. **Create/update company cache** — `portal/cache/company/<companyToken>.json` with document count
7. **Identity check** — POST to Monkey:3006 `/api/check-prostan-partner`
8. **Template selection** — `showUpgradePrompt = !identityCheck.isRegistered`
9. **Generate HTML** — `createConditionalHtmlEmail()` with conditional sections
10. **Save debug HTML** — `debug_email_<timestamp>.html` + `latest_debug_email.html`
11. **Send via SES** — `ses.sendRawEmail()` with selected sending domain
12. **Log and exit**

## Two Email Variants

### New User (upgrade CTA)
- Green gradient section with value props
- 8-parameter contextual registration URL → producestandards.org/register
- Parameters: source, token, company, email, dataset, name, load, doctype

### Existing Partner (verified badge)
- Blue gradient "VERIFIED INDUSTRY PARTNER" badge
- Displays partner name and ProStan8 ID
- Link to partner dashboard

## Sending Domain Logic

Priority order in `selectSendingDomain()`:
1. If fromEmail domain is in verified list → use fromEmail directly
2. If docName contains "standards" → documents@producestandards.org
3. If docName contains "hardware" → documents@jungledevices.com
4. If docName contains "consulting" → documents@prodicon.com
5. Default → documents@produceflow.com

## Known Issues

- `createJourneyMetadata()` passed as `null` on line 1385 — journey metadata not included in initial cache
- `getCompanyName()` has hardcoded lookup table instead of DBF read
- `sendEnhancedDocumentEmail()` (line 634) exists but is unused in the main execution path
