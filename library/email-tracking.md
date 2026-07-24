(unverified) Email Delivery Tracking — Per-Message SES Log · BUILT + LIVE as of 2026-07-22, senath gen-10
(state note: the SYSTEM is live and test-verified end-to-end; the facet is
"unverified" only because promotion to (verified) is George's call, not mine.)

Built 2026-07-14 after the load-33316 dispute (3 recipients claimed non-receipt;
answering it took hours of forensics because no per-message record existed).
It is LIVE and capturing production traffic. Cost: <$1/month.

=== WHAT IT IS ===

AWS-side. NOT EMAILPRT revived (that stays dead, see --facet-emailprt-dbf).

  sendEmail.js SES send
    -> config set 'produceflow-tracking' (DEFAULT config set on all 4 verified
       identities, so EVERY send logs with ZERO code change)
    -> EventBridge rule 'ses-email-events' (pattern {"source":["aws.ses"]})
    -> CloudWatch Logs group /aws/events/ses-produceflow   (us-east-1, 400d retention)
    -> DLQ sqs 'ses-events-dlq' catches delivery failures

A ROW IS AN EVENT, NOT AN EMAIL. One email emits Send, then Delivery or Bounce,
then possibly Open. Group by mail.messageId to get one message.

Account 631217702207. Suppression list ENABLED (bounce+complaint).
SNS 'ses-bounce-alerts' -> gburt@prodicon.com exists but the subscription was
NEVER CONFIRMED as of 2026-07-22 — bounces are recorded but nobody is emailed.

=== THE TOOLS (c:/clients/senath/tools/) ===

  email-lookup.js <recipient|subject|load|messageId> [--days N] [--json]
      One-command "did X get their email?" Groups events per message.
  email-log-ui.js            -> http://localhost:3777
      Local web UI, search + status pills. LOCAL TO GEORG ONLY, not the ERP page.
  load-history.js <load> [--dataset willis]
      Whole delivery history for a load in one shot from prnthist: per doc,
      PDF present?, emailed?, to whom, and auto-flags malformed recipients.
      ~20s (SMB-bound). Blind to sends that died at the POST (413) — those
      leave NOTHING in prnthist.

=== WHAT IT HONESTLY CLAIMS (the whole point — do not soften this) ===

Bounce data DOES flow in asynchronously with the RECEIVING SERVER'S OWN WORDS
('550 5.1.1 user unknown' / '250 Ok'). So it is real delivery state, not
accepted-only. FOUR LIMITS any UI must respect:

 1. "Delivered" = THEIR MAIL SERVER ACCEPTED IT. NOT that a human saw it.
    Load 33316: two Fresh House recipients were Delivered (Mimecast accepted)
    and still never saw the mail — quarantined. Render "accepted by their
    server", never "they got it".
 2. Events are ASYNC. Outcome lands seconds-to-minutes after Send. A just-sent
    email must read "sent, awaiting confirmation", never an optimistic
    "delivered".
 3. LOG STARTS 2026-07-14. Nothing earlier exists, ever. "No record" must NOT
    render as "not sent".
 4. OPEN is WEAK EVIDENCE BOTH WAYS. Image-blocking hides real opens; provider
    image-proxies fire false ones (2 Google-IP opens logged on one test).

Status vocabulary: bounced / accepted by their server / opened /
sent, awaiting confirmation / no tracking data.

THREE ERAS (lakeland gen-3's framing, better than mine):
  pre-2026-07-14   no tracking data at all
  07-14 -> 07-22   events exist, NO tags -> not filterable by load/company
  07-22 forward    fully tagged

=== SES MESSAGE TAGS (live 2026-07-22) ===

Seven tags on every send, verified landing on Send/Delivery/Open:
  dataset=willis company=INGLES load=33316 doctype=bol
  date=20260707 who=mwillis doc=33316_bol_3

SENT AS A RAW MIME HEADER, DELIBERATELY NOT THE SDK Tags PARAMETER:
  'X-SES-MESSAGE-TAGS: dataset=willis, company=INGLES, ...'
WHY: the preys run an ancient aws-sdk on Node 5.12 where an unsupported
parameter could throw ON A REAL SEND in the live document path. A header
cannot. Same result in the log, zero SDK dependency. SES strips the header;
recipients never see it.

TAG RULE: names/values are [A-Za-z0-9_-] ONLY, max 256. AN EMAIL ADDRESS IS
NOT A LEGAL TAG VALUE (@ and . rejected). Recipient email is native in the log
as mail.destination, so this costs nothing — but do not design a join expecting
an email in a tag.

=== HOW TO QUERY IT (the commands that cost time to find) ===

  # Git Bash MANGLES leading-slash AWS args. Use node spawnSync(shell:true):
  node -e "var r=require('child_process').spawnSync('aws',['logs',
    'filter-log-events','--log-group-name','/aws/events/ses-produceflow',
    '--region','us-east-1','--start-time',String(Date.now()-3600000),
    '--output','json'],{encoding:'utf8',shell:true,maxBuffer:64*1024*1024});
    console.log(r.stdout.slice(0,500))"

  # Tags live at detail.mail.tags — values are ARRAYS: {"company":["INGLES"]}

=== GOTCHAS THAT COST REAL TIME ===

1. GIT BASH PATH MANGLING ON AWS ARGS. '/aws/events/...' becomes
   'C:/Program Files/Git/aws/events/...'. The '//' escape does NOT fix it — it
   CREATES A RESOURCE LITERALLY NAMED '//aws/...'. Silent split-brain: creation
   succeeds, writes go to the real '/aws/...', reads return nothing, and the
   DLQ says NO_RESOURCE. Use PowerShell or node spawnSync(shell:true) for ANY
   aws arg starting with '/'.
2. EventBridge->CloudWatch failures are SILENT — only the FailedInvocations
   metric moves. ATTACH AN SQS DLQ to the target and read ERROR_CODE /
   ERROR_MESSAGE. That turned a guessing loop into a one-look diagnosis.
3. `aws ses send-raw-email --cli-input-json`: pass the RAW MIME in
   RawMessage.Data and let the CLI encode. Passing base64 yourself gets
   "Header section too long" (double-encode).
4. spawnSync with a ~110KB base64 argument blows cmd.exe's arg limit and dies
   with status null. Write to a file, use --cli-input-json file://...
5. SES MAILBOX SIMULATOR tests the whole chain without touching reputation or
   real customers: success@simulator.amazonses.com / bounce@simulator.amazonses.com
6. SES has NO per-message searchable history of its own. get-send-statistics is
   AGGREGATE only. Without this event log you CANNOT answer "was message X
   delivered" after the fact — that is exactly why this exists.

=== CREDENTIALS — TESTED, NOT INFERRED (2026-07-22) ===

The prey AWS key (d:/secrets/config.json on hawk, AKIA...FL5T) resolves to
arn:aws:iam::631217702207:user/George_Burt — THE SAME IAM USER as georg.
serenada confirmed no EC2 instance profiles exist except the two samba bridges;
the whole fleet uses static keys.

*** THAT USER ALREADY HAS logs:FilterLogEvents ON THIS LOG GROUP. ***
I tested the actual permission with the prey key and it returned events. So the
"IAM policy edit needed before a route can read the log" blocker that serenada,
hubbard and I all assumed DOES NOT EXIST. Empirical beat inferential — test the
permission, don't reason about the role.

=== SEE ALSO ===
  --facet-doc-delivery-failures  triage map (which layer failed)
  --facet-pdf-attach             per-customer PDF attachment
  detroit:--facet-auth-model     ANY route exposing this MUST self-gate:
                                 it returns recipient emails + subject lines

— senath gen-10, 2026-07-22


== AS OF 2026-07-24: THE CUSTOMER-FACING SENT PAGE IS LIVE (gen-11) ==

George's original ask is SHIPPED: willis.produceflow.com/sent.html renders real
delivery data against an operator session. THE FULL CHAIN (every hop verified):
  browser Bearer -> oakley mint (/api/v1/email-log/) -> detroit i_emailLog route
  (session-gated; reads secret from ElastiCache DB10 key senath:emaillog:secret;
  injects x-senath-key) -> prosser-mounted reggi-emaillog.js on Reggi:3005
  (READS FILES ONLY, never AWS) -> data from D:/clients/senath/data/emaillog/
  <DATASET>.json written by extract-email-log.js on Monkey (schtasks task
  senath-extract, every 15 min, SYSTEM; aws-sdk in D:/clients/senath/node_modules).
Secret: serenada set it in BOTH Reggi env (SENATH_EMAILLOG_SECRET) and DB10,
sha256-matched; proven 503->401->200. Page contract: honest-status vocabulary
(bounced/accepted-by-their-mail-server/opened/awaiting), bounce shows verbatim
server words, coverage note states log-start 7/14 + tagging-live 7/22 + legacy
exclusion. My repo deploys to MONKEY (gitgeorg repo-config senath entry);
prey-runtime code lives in willdev/nodejs (portal-status.js precedent).

SES TAGS as of 7/22: seven per doc send (dataset company load doctype date who
doc) — doctype is the 'came from my path' marker the extractor keys on.
Invite sends (parked engine) would add doctype=invite + invite=<hash>.

BOUNCE ALERTING as of 7/24: SNS topic ses-bounce-alerts
(arn:aws:sns:us-east-1:631217702207:ses-bounce-alerts) receives Bounce+Complaint
from ALL 4 identities (verified via get-identity-notification-attributes). The
THREE-TIME failure of gburt@prodicon.com to confirm is diagnosed as a corporate
link-scanner traversing SNS lifecycle links (evidence: pending entry decayed to
Deleted with no human click; same scanner class fires false opens).
imtrueshot@gmail.com subscribed 7/24 -> PendingConfirmation, awaiting George's
click. Poll: aws sns list-subscriptions-by-topic --topic-arn <arn>.

SEEDDROP DELIVERY JOIN (7/24): tools/seeddrop-delivery-join.js joins
jrec:regjourney pending records to SES events by email+time-proximity (~3.5 min
runtime from georg — SMB/CLI latency), output tools/out/seeddrop-delivery.json
keyed by regjourney hash; BOSTON OWNS THE ONLY REFRESH CLOCK (15-min staleness-
gated timer in their console). Measured result that reframed SeedDrop: 145/145
delivered, 0 bounces, 30/34 people opened, ZERO registrations — the cliff is
the CLICK/story, not delivery. regjourney TTL is 7 DAYS — pending cohorts
erode by design; never read shrinkage as conversion.