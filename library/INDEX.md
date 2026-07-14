# Senath Library Index

## Documents

| File | Description |
|------|-------------|
| access-layer.md | Portal cache as anonymous access layer — email cache + company cache |
| access-tiers.md | The 3-tier (was 4) progression: anonymous → provisional → individual. Tier 4 dropped gen-8 with company-folder removal. |
| portal-membrane.md | uTERA canopylake outgoing/incoming structure — the Tier 2/3 destination. Updated gen-8 with live infra status. |
| state-machine.md | jrec library wiring (libertyville substrate), schemas, ElastiCache db 8, the senath_* prefix convention |
| doc-delivery-failures.md | NEW 2026-06-07 — triage map for "the document email doesn't work": 413/gateway limit, base64 image inlining, image URLs, PDF-gen chain, willis-not-willdev |
| company-ledger.md | (DEPRECATED gen-8) Company cache accumulation. Folder + i_emlpart writes disabled. |
| journey-metadata.md | Conversion tracking metadata for SeedDrop identity acquisition |
| prnthist-bridge.md | How portal cache references prnthist document storage |
| identity-check.md | Monkey:3006 partner check — the new-user vs partner fork |
| template-handoff.md | Contract between senath and emsworth (emailTemplate.js) |
| emailprt-dbf.md | (DEPRECATED gen-8) EMAILPRT.DBF schema — schema preserved, writes disabled |
| upstream-pipeline.md | 4-stage send pipeline: green button → emailThis → email_it → saveandemail → sendemail.js |
| simple-send.md | Simple SES email pattern — when you don't need the full pipeline |
| server-topology.md | Prey/Predator/ElastiCache servers. Updated gen-8 with bridgeport SMB read access + no-AWS-CLI-on-Hawk warning. |
| domain-selection.md | How the SES From address is chosen — selectSendingDomain logic |
| graph-access.md | How to read/write the facet graph — Cypher queries, sync, states |
