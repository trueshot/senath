(unverified) Simple Email Send — When You Don't Need the Pipeline

## When to Use sendEmail.js vs a Simple Sender

sendEmail.js is the SeedDrop document delivery pipeline. It does 6 things:
1. Reads identity JSON from prnthist email/{count}.json
2. Creates portal cache files (email + company tokens)
3. Updates EMAILPRT.DBF via i_emlpart
4. Checks recipient identity against Monkey:3006
5. Builds branded HTML email with registration CTA
6. Sends via AWS SES

If you just need to email a file or text — use a simple SES script instead.

## Simple SES Pattern

Requirements:
- AWS SDK: `var AWS = require('aws-sdk')`
- Credentials: `AWS.config.loadFromPath("d:/secrets/config.json")` (Monkey/Jaguar) or `c:/secrets/config.json` (Georg)
- Must send FROM a verified domain: produceflow.com, producestandards.org, prodicon.com, jungledevices.com

Working example: `c:/clients/willdev/nodejs/test-email-emerson.js` (~35 lines)

```javascript
var AWS = require('aws-sdk');
AWS.config.loadFromPath("d:/secrets/config.json");
var ses = new AWS.SES({ apiVersion: '2010-12-01' });

ses.sendEmail({
  Source: 'documents@produceflow.com',
  Destination: { ToAddresses: ['recipient@example.com'] },
  Message: {
    Subject: { Data: 'Subject here', Charset: 'UTF-8' },
    Body: { Text: { Data: 'Body here', Charset: 'UTF-8' } }
  }
}, function(err, data) {
  if (err) { console.error(err); process.exit(1); }
  console.log('Sent:', data.MessageId);
  process.exit(0);
});
```

## To Email File Contents

Read the file first, pass as body:
```javascript
var fs = require('fs');
var body = fs.readFileSync(process.argv[2], 'utf8');
// then use body as the Data in Body.Text
```

## Verified Sending Domains

Only these work as Source address (SES will reject others):
- produceflow.com
- producestandards.org
- prodicon.com
- jungledevices.com

Domain selection logic: see `--facet-access-layer` or denver's `--facet-verified-domains`.

## Common Mistake

Don't use sendEmail.js for simple sends. It will:
- Fail if there's no email/{count}.json in the expected path
- Create portal cache files you don't want
- Try to hit Monkey:3006 for identity check
- Generate branded HTML when you just want plain text
