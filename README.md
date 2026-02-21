# Core Senath

**sendEmail.js Document Delivery Engine**

Owns the `sendEmail.js` process — the document delivery email system that transforms every outbound document email into an identity acquisition opportunity for ProduceStandards.org.

## What It Does

- Sends enhanced HTML emails with document portal links via AWS SES
- Checks recipient identity status against Monkey:3006 verifyApi.js
- Generates contextual 8-parameter ProduceStandards.org registration URLs
- Creates portal cache files (email + company) with journey metadata
- Routes emails through verified domains (produceflow.com, producestandards.org, prodicon.com, jungledevices.com)

## Source File

`c:/clients/willdev/nodejs/sendEmail.js` — runs on all active Prey servers

## Cruise Participation

**Cruise Mississippi** — SeedDrop Registration Workflow (Step 1: Document Delivery)

## Related Islands

| Island | Role |
|--------|------|
| Core Denver | Email engine umbrella |
| Core Nashville | Registration UI (register.html) |
| Core Atlanta | Identity verification (verifyApi.js, prostanEntityApi.js) |
| Core Detroit | Enhanced portal (SeedDrop portal system) |
