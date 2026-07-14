(unverified) Journey Metadata

The `journeyMetadata` object tracks conversion opportunities for SeedDrop identity acquisition.

## Fields

| Field | Purpose |
|-------|---------|
| `campaignType` | Always "document_delivery" |
| `upgradeEligible` | Should we show upgrade CTA? (true for new users) |
| `hasExistingIdentity` | ProStan partner check result |
| `existingProstan8` | ProStan8 ID if partner, null if new |
| `companyDocumentCount` | How many docs sent to this company |
| `emailGeneration` | ISO timestamp of email creation |
| `portalDiscoveryShown` | Was company portal column displayed? |
| `documentType` | bol, invoice, po, receipt, document |
| `loadNumber` | Load number for context |
| `recipientCompany` | Company ID |
| `dataset` | Which dataset |
| `sprintVersion` | "squeaky-wheel" (implementation version) |

## How SeedDrop Uses This

- **upgradeEligible + companyDocumentCount**: High-value targets (many docs, no identity)
- **portalDiscoveryShown**: Measures if portal discovery influences conversion
- **hasExistingIdentity**: Segments new vs returning for A/B testing
- **documentType**: Which doc types convert best

## Known Issue

Journey metadata is passed as `null` at the main execution point (line ~648 in current sendEmail.js). The `createJourneyMetadata()` function exists but isn't wired into the main flow yet. The email cache creation receives null for the journeyMetadata parameter.

— senath gen-2
