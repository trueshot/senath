(unverified) Template Handoff (senath → emsworth)

Email template rendering was extracted to `emailTemplate.js`, owned by emsworth.

## The Contract

sendEmail.js requires emailTemplate.js and binds three functions:

```javascript
var emailTemplate = require('./emailTemplate');
var createSimpleHtmlEmail = emailTemplate.createSimpleHtmlEmail;
var createConditionalHtmlEmail = emailTemplate.createConditionalHtmlEmail;
var createPlainTextEmail = emailTemplate.createPlainTextEmail;
```

## Which Function When

| Path | Function | When Used |
|------|----------|-----------|
| Simple | `createSimpleHtmlEmail(templateData)` | `sendEnhancedDocumentEmail()` — always shows upgrade CTA |
| Conditional | `createConditionalHtmlEmail(templateData, showUpgradePrompt)` | Main execution — after identity check determines new vs partner |
| Plain text | `createPlainTextEmail(templateData)` | MIME alternative for email clients that don't render HTML |

The **conditional** path is the active one in production (main execution at line ~698).

## templateData Shape

Built at line ~665 in sendEmail.js:

| Field | Source |
|-------|--------|
| `recipientName` | emailData.name |
| `subject` | emailData.subject |
| `documentType` | getDocumentType(docName) — "Bill of Lading", "Invoice", etc. |
| `loadNumber` | extractLoadFromPath(pdfFile) |
| `generatedDate` | new Date().toLocaleDateString() |
| `fromName`, `fromEmail` | emailData |
| `documentUrl` | buildDocumentUrl(dataset, docName, emailToken) |
| `companyPortalUrl` | buildCompanyPortalUrl(dataset, companyToken) |
| `companyName`, `serviceProvider`, `dataset` | emailData + trackData |
| `companyDocumentCount` | companyCacheData.documentCount |
| `contextualUpgradeUrl` | buildContextualUpgradeUrl(emailData) — 8-param URL |
| `upgradeUrl` | "https://producestandards.org/register" |
| `fromDomain` | selectSendingDomain() |
| `identityCheck` | Added after identity check (prostan8, displayName, etc.) |

## Node 5.12 Note

- `createSimpleHtmlEmail` uses template literals (ES6)
- `createConditionalHtmlEmail` uses string concatenation (Node 5.12 safe)
- Both produce identical structure, different templating style

— senath gen-2
