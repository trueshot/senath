(unverified) Server Topology — Where sendEmail.js Runs

Source: serenada's facets (servers:--facet-prey-architecture, servers:--facet-portmap)

## Predators (coordination, no datasets)

| Server | Public IP | Private IP | Tinc | Key Ports |
|--------|-----------|------------|------|-----------|
| Eagle | 54.173.45.122 | 172.31.29.227 | 15.30.60.7 | 6379 Redis (Nimbus), 3001 prostanEntityAPI |
| Monkey | 54.209.69.205 | 172.31.28.199 | 15.30.60.40 | 3006 verifyApi (MY identity check), 3005 prosserEntityAPI (createLink), 3456 Spawner, 3100 gitgeorg notify-pull |
| Frog | 54.173.177.227 | 172.31.26.116 | 15.30.60.8 | 7721 Redis (production, requires auth) |

## ElastiCache (jrec / state machine substrate, gen-8 2026-05-24)

Different from Frog/Eagle Redis. This is AWS managed.

| Endpoint | Port | Auth | DBs in use |
|----------|------|------|-----------|
| my-redis-cluster.3jytjd.0001.use1.cache.amazonaws.com | 6379 | NONE (just SELECT) | db 7 boston, db 8 libertyville/jrec |

DBs are allocated by redingtonbeach. Do not hunt for an ElastiCache
password — there isn't one. SELECT 8 after connecting; that's it.

Connection discipline: reuse one client across all calls in a process;
quit() before exit. Per-call connections without quit() leak (this
caused an OOM incident — redingtonbeach's note).

## Prey (dataset hosting — sendEmail.js runs on ALL of these)

| Server | Private IP | Tinc | SMB from Monkey |
|--------|------------|------|-----------------|
| Hawk | 172.31.31.8 | 15.30.60.19 | c:\hawk |
| Alligator | 172.31.16.16 | 15.30.60.3 | c:\alligator |
| Buffalo | 172.31.18.14 | 15.30.60.4 | c:\buffalo |
| Cheetah | 172.31.16.23 | 15.30.60.5 | c:\cheetah |
| Deer | 172.31.28.226 | 15.30.60.18 | c:\deer |
| Iguana | 172.31.22.52 | 15.30.60.20 | c:\iguana |
| Jaguar | 172.31.20.214 | 15.30.60.21 | c:\jaguar |

Each prey runs: nginx (80), TrueAPI (3001), Apache (80xx), Redis (6379).
sendEmail.js lives at D:\clients\willdev\nodejs\sendEmail.js on each prey.
SES credentials at D:\secrets\config.json on each prey.
Monkey SMB path: c:\{server}\d\clients\willdev\nodejs\sendEmail.js

## CRITICAL: AWS CLI is NOT installed on Hawk

Discovered gen-8 2026-05-24 when savoy's shell-out `aws s3 cp` failed
silently with "'aws' is not recognized as an internal or external
command". Do NOT recommend installing AWS CLI on prey servers.

Use AWS SDK in Node instead — it's ALREADY LOADED in sendEmail.js
(originally for SES). Same require, same creds:

  var AWS = require('aws-sdk');
  AWS.config.loadFromPath("d:/secrets/config.json");
  var s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  s3.putObject({ Bucket, Key, Body, ContentType, ACL }, cb);

The same lesson applies to any other AWS service: SDK in Node, not CLI
in shell.

## SMB Read Access from georg (via bridgeport)

Discovered gen-8 2026-05-24. CLAUDE.md says "no SMB to AWS servers,"
which is true for WRITES via the prey servers — but georg DOES have
SMB READ access via the bridgeport gateway at 15.30.60.44:

  \\15.30.60.44\hawk           (Hawk's D: drive)
  \\15.30.60.44\canopylake     (the inode tree for portal-membrane)
  \\15.30.60.44\legacylake     (the older storage tier)

Verify: `net use` shows the active connections.

Use this for INSPECTION only — verifying deploys, reading log files,
checking working-tree state. Writes go through gitgeorg (for source
files) or through prey servers (for runtime data).

Common diagnostics this enables:
  cat \\\\15.30.60.44\\hawk\\d\\clients\\willdev\\sendemail_last.log
  diff \\\\15.30.60.44\\hawk\\d\\clients\\willdev\\nodejs\\file.js c:/clients/willdev/nodejs/file.js
  stat \\\\15.30.60.44\\hawk\\d\\clients\\willdev\\latest_debug_email.html

NEVER ls broad directories under hawk\\d\\clients\\willdev\\loads —
millions of files, will hang or crash the SMB connection. Specific file
paths only.

## Identity Check Path

sendEmail.js on any prey → POST http://172.31.28.199:3006/api/check-prostan-partner
That's Monkey's private IP. All prey are in the same VPC, so private IP works.

## How to Deploy sendEmail.js (verified gen-7, 2026-05-23)

Source of truth is georg: `c:/clients/willdev/nodejs/sendEmail.js`.
Push to Hawk via gitgeorg (auto-commits, pushes to GitHub, notifies Monkey):

```
cd c:/clients/willdev
node c:/clients/gitgeorg/push.js willdev --notify
```

What that does:
1. `git add -u && git commit -m "Update" && git push` (georg → GitHub)
2. POSTs to Monkey:3100 → Monkey runs `git pull` in `c:/hawk/d/clients/willdev`
   (which is Hawk's `D:\clients\willdev\` via SMB)
3. Mirrors (willis, acmedev, rrsweet) also pull from their repo-config targets

Hawk's deployed file: `D:\clients\willdev\nodejs\sendEmail.js`.
Other prey (Alligator, Buffalo, etc.) do NOT auto-pull — they would need
their own `?base=c:/{server}/d` calls per gitgeorg:--facet-targeted-pull.

DO NOT edit sendEmail.js directly on prey — the next gitgeorg push from any
corporal will overwrite it. Always edit on georg and push. (The old gen-2
"deploy reverts your edits" lesson was about this — edits made on prey, not
edits made on georg.)

## Georg (dev laptop)

Georg is NOT a prey server. Paths are c:\ not d:\.
Secrets at c:\secrets\config.json. Cannot SMB to AWS servers.
Use gitgeorg (above) — not SSH/SCP — for sendEmail.js deploys.
