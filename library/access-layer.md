(unverified) The Anonymous Access Layer

sendEmail.js doesn't just send email. It creates the **anonymous access layer** for ProduceFlow documents.

## What Gets Created

Every document email produces three cache files (modern path, gen-6):

1. **Email cache** (`portal/cache/email/{emailToken}.json`) — single-document access
2. **Company cache** (`portal/cache/company/{companyToken}.json`) — multi-document portal
3. **Person cache** (`portal/cache/person/{dataset}-{pulpId}.json`) — binary membership marker (tier-1 substrate, added 2026-05-23)

The email and company caches are load-bearing for portal lookups today. The person cache is forward-looking substrate for tier-2 messaging (e.g. "reserved folder waiting for you"). Legacy `saveandemail.php` doesn't carry pulpId; those sends skip the person cache write.

## Email Cache

- One per email sent
- Token: random 32-char hex (`crypto.randomBytes(16)`)
- Contains: recipient, document reference (pdfFile pointing to prnthist), company context, journey metadata
- Enables: `https://{dataset}.produceflow.com/portal/document/{docName}?token={emailToken}`

## Company Cache

- One per company (deterministic token)
- Token: `sha256(dataset:companyId:portal_salt_2025).substring(0,32)`
- Accumulates documents (max 500, oldest trimmed)
- Enables: `https://{dataset}.produceflow.com/portal/company/{companyToken}`
- Powers "Discover Your Portal — N documents" feature in emails

## Person Cache (tier-1 binary membership)

- One per (dataset, pulpId) pair
- Filename: `portal/cache/person/{dataset}-{pulpId}.json`
- Schema: `{ dataset, pulpId, email, isMember, prostan8, checkedAt }`
- `isMember` is binary — `true` if Monkey:3006 identity check returns `isPartner: true`, else `false`
- `prostan8` populated only when `isMember: true`
- Written by `writePersonPortalCache()` in sendEmail.js after `checkEmailRegisteredToPER` returns
- Best-effort: failures are logged but do not block the send

## No Authentication Required

Portal access is token-based, not auth-based. Sharing a link shares access. This is by design — it lowers the barrier to entry, then the upgrade CTA invites users to create a ProduceStandards.org identity for authenticated access.

— senath gen-2
