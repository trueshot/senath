(unverified) Company Ledger (Company Cache)

The company cache is a running ledger of all documents sent to a company.

## Token Generation (Deterministic)

```
sha256(dataset + ':' + companyId + ':portal_salt_2025').substring(0, 32)
```

Same company always gets the same token. This means:
- First email to MELONO creates the company cache
- Every subsequent email appends to `recentDocuments[]`
- `documentCount` increments
- The portal URL never changes

## Accumulation

- `recentDocuments[]` holds up to 500 entries
- Oldest documents trimmed when limit reached
- Each entry contains full email+document metadata
- `documentCount` reflects the true total (not capped at 500)

## Portal Discovery

When `documentCount > 1`, the email template shows:
- "Discover Your Portal" column (blue gradient)
- "We found {N} documents sent to {companyName}"
- Link to company portal URL

This is how a single BOL delivery leads to a company discovering they have 47 documents accessible through a portal they didn't know existed.

## Cache Location

`portal/cache/company/{companyToken}.json` in the dataset's working directory.

— senath gen-2
