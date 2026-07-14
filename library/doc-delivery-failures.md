(verified gen-8 2026-06-07) Document Delivery Failure Modes — Hard-Won Triage

When a document email "doesn't work," the failure is almost never in
sendEmail.js. It's upstream (PDF never generated) or in the delivery
chain. This facet is the triage map, built from a full day of debugging
willis invoice failures.

=== THE DOCUMENT LINK IN THE EMAIL ===

Final design (2026-06-07):
- View Document link = the S3 URL ONLY. senath uploads the PDF to
  produceflow-documents-temp (AWS SDK, 6-month lifecycle) and puts that
  URL in templateData.s3DocumentUrl.
- templateData.documentUrl (the legacy willis.produceflow.com/portal/
  document/{docName}?token=... URL) was REMOVED entirely. That endpoint
  never served documents — it 302/404s or redirects into the docs app.
- emsworth's template: if s3DocumentUrl is empty, render a "Request Copy"
  mailto button to the sender. Never fall back to a portal URL.
- So: working PDF => S3 link. No PDF => mailto. Never a broken link.

=== CANOPYLAKE WRITE FAILS BUT EMAIL WORKS (added gen-9, 2026-06-10) ===

Symptom: log shows "canopylake mkdir failed (non-fatal): ENOENT ...
M:\inode3\..." while the SAME path works fine in an interactive console.
Cause: mapped drive letters are PER-LOGON-SESSION. The Apache service
session that PHP-execs sendEmail.js never ran net use; M: is undefined
there (hence ENOENT, not access-denied). Fix: portal-config.json must
carry the UNC path (\\172.31.24.120\canopylake\...) — needs no mapping,
works from any session. Fixed + verified live on willis 2026-06-10.
Second check if PDFs land but the portal page doesn't show them: every
PDF needs its .email.json APRON next to it (portland's reader renders
from aprons) — sendEmail.js writes both since gen-9; a bare PDF means
the write predates the apron alignment or the apron write failed.

=== THE PDF GENERATION CHAIN (where failures actually live) ===

For the email to have a working link, a PDF must exist. The PDF comes
from savoy's saveAndEmail.php running wkhtmltopdf on the document HTM.
If the PDF doesn't exist, senath's S3 upload fs.readFile ENOENTs,
s3DocumentUrl stays null, recipient gets the mailto fallback.

Three real failure modes seen, in order of likelihood:

## 1. POST body too large -> 413 (THE willis invoice failure, 2026-06-07)

  Symptom: browser console "POST https://{dataset}.produceflow.com/api/
  saveAndEmail 413 (Content Too Large)". The doc never reaches the PHP;
  no .htm saved, no PDF, nothing downstream.

  Root cause: gainesville's rebuilt doc templates (post-2026-05-27)
  INLINE images as base64 data URLs (data:image/png;base64,iVBOR...).
  A single logo PNG is 50-200KB of base64. The POST body (prntData with
  THECODE = full <DocContent> innerHTML) blows past Express's DEFAULT
  body-parser limit of 100KB on detroit's /api/saveAndEmail gateway.

  Owner of the fix: detroit (gateway). bodyParser.json({limit:'5mb'}) or
  express.json({limit:'5mb'}); also nginx client_max_body_size 5m; if
  fronted. ALSO worth raising with gainesville: base64-inlining every
  image bloats every send; a plain <img src="http://n2ag.com/..."> URL
  is ~80 chars vs 100KB+.

## 2. Broken/slow image URL stalls wkhtmltopdf (silent fail)

  Symptom: .htm exists in prnthist, NO matching .pdf. Silent — savoy's
  exec() return isn't checked (savoy:--facet-wkhtmltopdf gotcha).

  CAUTION on the diagnosis: wkhtmltopdf uses an OLD WebKit. The theory
  "it chokes on produceflow.com HTTPS/TLS" was PLAUSIBLE but probably
  WRONG once we found base64 inlining — if gainesville's bind step
  fetches the URL and inlines it at bind time, wkhtmltopdf never sees the
  URL at all (it sees the data: URL). So a URL fetch failure would break
  the BIND, not wkhtmltopdf. Verify which layer actually fetches before
  blaming wkhtmltopdf.

  The image-URL fact that IS true:
    http://n2ag.com/images/X.png       -> 200, works (no TLS)
    https://produceflow.com/images/X.png -> 200, SAME BYTES (not "broken")
    https://n2ag.com/...                -> no HTTPS on n2ag, TLS fails
  goodyear:--facet-public-images documents produceflow.com/images ALB
  behavior. The two hosts serve identical bytes.

  Fix applied 2026-06-07: swapped https://produceflow.com/images/ ->
  http://n2ag.com/images/ in willis deployed doc templates
  (i_invoice/i_passing/i_purconf/i_saleconf .htm + 6 .design.json
  sidecars). i_newbol.htm already used the n2ag URL — which is why BOLs
  worked and invoices didn't. doc-builder.html on georg still has the
  produceflow default (gainesville's source; one-line cleanup pending).

## 3. Recipient mailbox / delivery (NOT a code failure)

  SES sends successfully (Message ID in log) but no email arrives.
  gburt@produceflow.com is NOT provisioned in Google Workspace; use
  gburt@prodicon.com (ImprovMX catch-all -> imtrueshot@gmail.com).
  Check SES suppression list + the actual mailbox before touching code.

=== TRIAGE ORDER (do this, don't theorize) ===

1. Did the POST even succeed? Check browser console for 413/4xx. If 413,
   it's detroit's gateway limit — STOP, nothing downstream ran.
2. Does a .pdf exist next to the .htm in prnthist? No PDF => wkhtmltopdf
   failed. Diff the failing .htm's <img> tags against a WORKING doc's
   (i_newbol.htm is the known-good reference). Check savoy's new
   wkhtmltopdf stderr capture.
3. PDF exists but no email link? Check sendemail_last.log for "S3 upload
   OK" — if missing, S3 upload failed (creds/bucket).
4. Email sent (Message ID logged) but not received? Mailbox/SES issue,
   not code.

=== PRODUCTION IS WILLIS, NOT WILLDEV ===

Biggest time-waster of the session: I kept reading willdev logs. willdev
is the DEV dataset. Production sends George tests are the WILLIS dataset:
  //15.30.60.44/hawk/d/clients/willis/sendemail_last.log
Other live datasets: acmedev, rrsweet (gitgeorg mirrors of bocchi1).
When a send "fails," check the dataset George actually used. willdev and
willis have SEPARATE deployed copies of everything.

=== KEY LOG PATHS (Hawk, via bridgeport SMB read) ===

  //15.30.60.44/hawk/d/clients/willis/sendemail_last.log   (senath stdout, overwritten per send)
  //15.30.60.44/hawk/d/clients/willis/sendeml_command.txt  (savoy's exec line)
  //15.30.60.44/hawk/d/clients/willis/s3upload_last.log    (savoy's old aws-cli attempt; senath does S3 in Node now)
  //15.30.60.44/hawk/d/clients/willis/latest_debug_email.html (rendered email)
  prnthist .htm/.pdf:  loads/prnthist/{LOAD}/{Ymd}/{WHO}/{EXT}/  (NEVER ls the loads tree — millions of files)

=== OWNERS ===

  detroit    — /api/saveAndEmail gateway (body-parser limit, 413)
  savoy      — saveAndEmail.php, wkhtmltopdf exec, prntData/THECODE
  gainesville— modern doc templates + i_docbind.js (base64 inlining, image URLs)
  emsworth   — emailTemplate.js (the email itself, View Document button)
  goodyear   — produceflow.com/images ALB routing
  senath     — sendEmail.js (S3 upload, jrec, canopylake write, SES)

— senath gen-8 2026-06-07

=== PER-MESSAGE TRACKING — LIVE 2026-07-14 (senath gen-10) ===

Built after the load-33316 dispute (3 recipients claimed non-receipt; took
hours of forensics). Now ONE command:

  node c:/clients/senath/tools/email-lookup.js <recipient|subject|msgId> [--days N]

Shows per message: SEND / DELIVERY (receiving server's SMTP response, e.g.
"250 Ok") / BOUNCE (Permanent/Transient + the server's 550 diagnostic naming
the address) / OPEN (recipient viewed it). Log began 2026-07-14 — nothing
before that date is in it. Retention 400 days.

THE PLUMBING (all AWS, ~$0.50/mo at our volume):
  SES config set produceflow-tracking (event dest -> EventBridge default bus)
  -> EventBridge rule ses-email-events -> CW Logs /aws/events/ses-produceflow
  DLQ: sqs ses-events-dlq (delivery failures land there with ERROR_CODE).
  Config set is the DEFAULT on all 4 verified identities (produceflow.com,
  producestandards.org, prodicon.com, jungledevices.com) -> every send logs
  with ZERO code change on the preys (Node 5.12 untouched).
  Account suppression list ENABLED (bounce+complaint).
  Bounce/complaint alerts: SNS ses-bounce-alerts -> gburt@prodicon.com
  (subscription pending George's confirm click).

GOTCHAS LEARNED WIRING IT:
  - Git Bash mangles leading-slash AWS args (/aws/events/... ->
    C:/Program Files/Git/...). The "//" escape trick CREATES A RESOURCE
    LITERALLY NAMED //aws/... — silent split-brain (writes go to /aws/...,
    NO_RESOURCE). Use PowerShell or node spawnSync(shell:true) for any AWS
    arg starting with /.
  - EventBridge->CWL failures are silent (FailedInvocations metric only).
    Attach an SQS DLQ to the target and read ERROR_CODE — minutes, not
    guessing.
  - SES mailbox simulator (success@/bounce@simulator.amazonses.com) tests
    the full chain without touching reputation or real customers.
