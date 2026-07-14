(unverified) Sending Domain Selection — How the From Address Is Chosen

`selectSendingDomain(fromEmail, docName, subject)` in sendEmail.js picks the
SES From address. Code-verified 2026-05-21 (sendEmail.js lines 510-535).

## Priority Order

1. **Sender's own address** — if `fromEmail`'s domain is one of the four
   verified domains, send AS the sender (return fromEmail unchanged).
2. **docName contains "standards"** → `documents@producestandards.org`
3. **docName contains "hardware"** → `documents@jungledevices.com`
4. **docName contains "consulting"** → `documents@prodicon.com`
5. **Fallback** → `documents@produceflow.com`

Note: `subject` is a parameter but not used in the current logic.

## Verified Domains

```
produceflow.com
producestandards.org
prodicon.com
jungledevices.com
```

Sending FROM anything else fails SES. denver owns this list
(denver:--facet-verified-domains).

## From vs Reply-To

- **From:** the selected verified-domain address (deliverability — SPF/DKIM
  must pass, so it must be a domain we control).
- **Reply-To:** the actual sender's email — so replies reach the real person
  even when From was rewritten to a verified domain.

This split is why a sender at an unverified domain still gets replies:
their address survives in Reply-To.
