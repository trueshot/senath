(deprecated 2026-05-24, gen-8) EMAILPRT.DBF Integration — DISABLED

## STATUS

The EMAILPRT.DBF write is DISABLED in production as of 2026-05-24. Both
the caller (senath/sendEmail.js) AND the writer (palmbeach/i_emlpart.prg)
have been cut:

  - sendEmail.js: the `exec('i_emlpart ' + emailToken)` block in
    createEmailPortalCacheEnhanced was REMOVED. The portal/company/{id}/
    directory is no longer created.
  - i_emlpart.prg (palmbeach gen-2): the per-company DBF append block is
    wrapped in `IF .F. ... ENDIF`. The .exe still runs and parses the
    JSON, but the DBF row never gets written.

Belt-and-suspenders: if any other caller still execs i_emlpart, it's
also gated off internally.

## WHY KEEP THIS FACET

The destination may move (different folder structure, different identifier
shape) and the field set is useful reference. Schema preserved verbatim
below. Easy to re-enable: flip `IF .F.` to `IF .T.` in palmbeach's PRG;
restore the exec block in sendEmail.js.

## HISTORICAL CONTEXT — Why It Was Killed

The company-folder concept (portal/company/{companyId}/) was dropped when
George removed company-level access from the portal model 2026-05-24.
The EMAILPRT.DBF lived in that folder and had no other consumer that we
could identify (denver had documented the schema historically but did
not actively read it). The Tier 1 portal/cache/email/{token}.json file
(per-recipient, on prey local disk) survived. Future: even that may move
to canopylake outgoing/{recipient}/ — see --facet-portal-membrane.

## EMAILPRT.DBF Schema (19 fields, frozen)

From denver gen-1. pulpid/pulpname/companyid meanings corrected 2026-05-21
against pullman:--facet-pear-spec (PULP/ROOT = person/company codes, NOT load).

| Field | Type | Description |
|-------|------|-------------|
| recipname | C | Recipient name |
| recipient | C | Recipient email |
| fromname | C | Sender name |
| fromemail | C | Sender email |
| subject | C | Email subject |
| docname | C | Document name (BOL, INV, etc.) |
| pdfpath | C | Path to PDF file |
| docid | C | Composite document ID |
| pulpid | C | PULP code — person identifier (numeric ≤6 digits, portable across datasets; pullman is authority) |
| pulpname | C | Contact's name |
| companyid | C | ROOT code — company identifier (pullman is authority) |
| load | C | Load number |
| date | D | Date sent |
| user | C | User who sent |
| ext | C | Extension type |
| emailnum | N | Email sequence number |
| timestamp | C | ISO timestamp |
| emailtoken | C | 32-char email token |
| matchtype | C | Always 'email_portal' |

## DBF Location (historical)

`portal/company/{companyId}/emailprt.dbf` — folder no longer written.

## Token Formulas (historical)

- **Email token**: `crypto.randomBytes(16).toString('hex')` — random 32-char hex (STILL USED for portal/cache/email/{token}.json)
- **Company token**: `sha256(dataset:companyId:portal_salt_2025).substring(0,32)` — DEAD; generateCompanyToken function still exists in sendEmail.js as harmless dead code, no callers.

— senath gen-2, deprecated gen-8 2026-05-24
