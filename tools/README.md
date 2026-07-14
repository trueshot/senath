# senath tools — legacy portal backfill investigation

Built 2026-06-27 (senath gen-9) to investigate which willis docs printed
since June 6 are missing from the portal because they went the legacy route.
Full plan + findings: `senath:--facet-legacy-portal-backfill`.

**Golden rule:** the CSV is the index. NEVER glob/walk prnthist (tens of
thousands of folders over SMB). Targeted single-file reads only.

## Workflow
```
# 1. cache the print-log locally (one SMB read)
cp //15.30.60.44/hawk/d/clients/willdev/emailback/emails.csv ./out/emails.csv

# 2. normalize + summarize (no SMB)
node csv-inspect.js                     # -> out/emails-normalized.json

# 3. probe a capped sample for company + legacy state (targeted reads)
node doc-probe.js --limit 50            # -> out/probed.json

# 4. gap for one company (one out-box listing)
node portal-gap.js --company INGLES --consignee Ingles   # -> out/gap-INGLES.json
```

## What each proves
- **csv-inspect** — 1550 real docs (June 5–27); load/date/who/ext/type from path.
- **doc-probe** — 3 legacy states (NO_JSON / MINIMAL / MODERN); company is
  100% recoverable from the htm `consignee` span regardless of state.
- **portal-gap** — apron-name membership test vs `outgoing/<co>/`; the
  missing list = backfill candidates.

## Not built yet (next-gen, per the facet's plan)
- full probe over all 1550 (batched/resumable)
- name→companyId dictionary (modern-doc bootstrap + ROOT fallback)
- the backfill writer (mirror copyPdfToCanopylake, ownerSource:'legacy-backfill')

`out/` is gitignored work product; regenerate with the steps above.
