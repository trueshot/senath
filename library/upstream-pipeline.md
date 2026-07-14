(unverified) Upstream Pipeline — How Data Reaches sendEmail.js

Sources: pullman:--facet-send-pipeline, savoy:--facet-handoff, and sendEmail.js itself (code-verified 2026-05-21, modern path verified 2026-05-23).

## Two Parallel Paths — Modern (`i_*`) vs Legacy

Modern docs are served by the `i_*`-prefixed files. Legacy by the un-prefixed.
The two never run in the same dataset directory — different files, same flow shape.

| Stage | Modern (i_*) | Legacy |
|-------|--------------|--------|
| HTML page | `docs/i_newbol.htm` | `docs/newbol.htm` |
| Email window/iframe | `i_emaillist.php` (pullman) | `emaillist.php` (pullman) |
| AJAX submitter | `docs/i_docsupport.js` (~docs infra) | `docs/docsupport.js` |
| PHP entry point | `i_saveAndEmail.php` (savoy) | `saveandemail.php` (savoy) |
| Carries pulpId? | YES (via PRINT_PULPID) | NO — legacy sends skip the person cache |

## 4-Stage Pipeline (modern path)

1. **emailThis()** (i_emaillist.php:~419, owner: pullman)
   - Green send button carries data-* attrs: email, name, pulp, dataset, companyid, companyname
   - Reads sender info from `window.top.Ouser`
   - Sets PRINT_* fields on `parent.prntData` — including `PRINT_PULPID`
   - Calls `parent.email_it(callback)`

2. **email_it()** (i_docsupport.js:14-31)
   - Adds load context: LOAD, WHO, EXT, ABC (= `loadObj.Mabc`)
   - Sets LEVEL=3 (email mode)
   - Captures BOL HTML
   - POSTs JSON to `../i_saveAndEmail.php` (resolves to `/i_saveAndEmail.php` at site root)

3. **i_saveAndEmail.php** (owner: savoy, c:/clients/willdev/i_saveAndEmail.php)
   - Saves HTML to `loads/prnthist/{LOAD}/{DATE}/{WHO}/{EXT}/`
   - **Line 132:** `exec(wkhtmltopdf ... http://george:matt@n2ag.com/{dataset}/...)` —
     synchronous fetch of the just-saved HTML over HTTP from a hardcoded `n2ag.com` URL,
     then converts to PDF. **Known hang point:** if n2ag.com is slow/unreachable from
     Hawk, the PHP hangs and nginx 504s. sendEmail.js never runs in that case.
   - Writes `email/{count}.json`
   - **Line 157:** `exec("node nodejs/sendemail.js -c {pdfPath}")` — synchronous, blocks PHP

4. **sendEmail.js** (me) — receives `-c {pdfPath}`, derives `email/{count}.json`, reads it

## The JSON Contract — email/{count}.json

CODE-VERIFIED — these are the fields sendEmail.js reads from the JSON (`obj`):

| Field | Meaning | Authority |
|-------|---------|-----------|
| name | Recipient contact name | — |
| email | Recipient email | — |
| subject | Email subject | — |
| fromName | Sender display name | — |
| fromEmail | Sender email (drives domain selection) | — |
| docName | Document type name (BOL, Invoice, PO...) | — |
| pdfFile | prnthist-relative PDF path | — |
| companyId | **ROOT code** — company identifier | pullman PEAR spec |
| companyName | Company display name | — |
| pulpId | **PULP code** — person identifier (numeric, ≤6 digits, portable) | pullman PEAR spec |
| pulpName | Contact's name | pullman PEAR spec |
| abc | `loadObj.Mabc` — load-context field; written to company cache | document infra |
| load | Load number (optional — code falls back to extractLoadFromPath) | — |

## NOT in the JSON — added by sendEmail.js

- `dataset` — from `process.env.TRUESHOT_DATASET` (.env file), fallback 'ACST'. Assigned to obj at line 646.
- `emailToken` — generated via `crypto.randomBytes(16)`. Assigned to obj at line 645.

Do not assume dataset/emailToken arrive in the JSON. They don't.

## Filename Casing Gotcha

Actual file on disk: **`sendEmail.js`** (capital E). The PHP `exec()` calls
`node nodejs/sendemail.js` (lowercase). This works ONLY because Windows is
case-insensitive. It would break on Linux. pullman's and savoy's facets both
write `sendemail.js` — the disk truth is `sendEmail.js`.

## Crew Map

| Stage | Owner | Modern file | Legacy file |
|-------|-------|-------------|-------------|
| emailThis | pullman | c:/clients/willdev/i_emaillist.php | c:/clients/prostan/emaillist.php |
| email_it | docs infra (not me, not savoy) | c:/clients/willdev/docs/i_docsupport.js | c:/clients/willdev/docs/docsupport.js |
| saveAndEmail | savoy | c:/clients/willdev/i_saveAndEmail.php | c:/clients/willdev/saveandemail.php |
| sendEmail.js | senath | c:/clients/willdev/nodejs/sendEmail.js | (same) |
| emailTemplate | emsworth | c:/clients/willdev/nodejs/emailTemplate.js | (same) |
