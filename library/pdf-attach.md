(unverified) Per-Customer PDF Attachment · BUILT + LIVE as of 2026-07-16, senath gen-10
(state note: shipped and test-verified; promotion to (verified) is George's call.)

Ships the document PDF as a real email attachment for SELECTED customers,
IN ADDITION to the S3 View Document link (the link is unchanged — belt and
suspenders, George's call 2026-07-16). Live on willis. FARMWE is the only
customer switched on as of 2026-07-22.

=== WHY IT WAS LINK-ONLY BEFORE ===

The original design deliberately sent NO attachment ("Create email WITHOUT PDF
attachment" is still in the sendEnhancedDocumentEmail comment) to force a portal
click, which is what drives ProduceStandards identity acquisition / journey
tracking. Attaching softens that funnel. George accepted that trade knowingly
for customers who ask for the PDF in hand. Do not "fix" this back without asking.

=== THE SWITCH — WHERE IT LIVES AND WHY ===

The switch is a per-customer preference, so it belongs WITH THE CUSTOMER, not
in code. Two phases, ONE interface, so the code never changes again:

  INTERFACE (permanent):  obj.attachPdf  in email/{n}.json
  PHASE 1 (live now):     email-options.json in the willdev repo ROOT
                          { "attachPdfCompanies": ["FARMWE"] }
                          Deploys with the code to every mirror.
  PHASE 2 (not built):    an ATTACHPDF flag on the customer's company record,
                          read by the email-window/saveAndEmail.php, written
                          into email/{n}.json as attachPdf. Then Willis manages
                          it themselves; senath's code needs NO change.

shouldAttachPdf(obj) honors obj.attachPdf === true FIRST, then falls back to the
company list. That ordering is what makes phase 2 a drop-in.

ADDING A CUSTOMER TODAY: add their companyId to email-options.json, then
  node c:/clients/gitgeorg/push.js willdev --who senath -m "attach: <CO>"

ANTI-PATTERN: never hardcode company codes inside sendEmail.js — that needs a
deploy to change and buries business config in the send path.

=== HOW IT'S BUILT ===

Single text/html message becomes multipart/mixed:
  part 1  text/html          the existing email, link untouched
  part 2  application/pdf    base64, Content-Disposition: attachment;
                             filename="{pdf basename}"  e.g. 33316_bol_3.pdf

  fs.readFileSync(obj.pdfFile).toString('base64').replace(/(.{76})/g,'$1\r\n')

Node 5.12-safe (Buffer/fs/base64 only). PDF read failure is caught and FALLS
BACK to the link-only email — an attachment problem must NEVER block a send.

SIZE: these PDFs run ~80KB (~110KB base64), far under the SES 10MB raw limit.

VERIFIED 2026-07-16: real SES send of an actual willis BOL in this exact MIME
shape landed in Gmail INBOX (not spam), attachment opened cleanly, View Document
link still present above it.

=== SEE ALSO ===
  --facet-email-tracking   the delivery log (attach does not affect it)
  --facet-portal-membrane  copyPdfToCanopylake is INDEPENDENT of this — the
                           membrane copy is identical attached or not

— senath gen-10, 2026-07-22
