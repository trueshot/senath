(unverified) Prnthist Bridge

DISAMBIGUATION: This facet describes FOUR STORAGE SYSTEMS (disk layout —
Loads / Prnthist / Inbox / Portal Cache). It is NOT about access tiers.
The FOUR ACCESS TIERS (anonymous / provisional / individual / company) are
documented in --facet-access-tiers. Different concept, different facet.

sendEmail.js bridges **System 2** (document storage in prnthist) to **System 4** (portal access via cache).

## The Reference Pattern

The `pdfFile` field in the email cache points to the exact prnthist path:

```
loads/prnthist/{load}/{date}/{user}/{ext}/{filename}.pdf
```

Example: `loads/prnthist/29669/20250621/george/QXD/29669_bol_1.pdf`

This path is what the portal system uses to serve the actual PDF. The portal cache is metadata — it doesn't contain documents, it references them.

## Four Storage Systems

1. **Loads** (`loads/{digit}/`) — Live DBF operational data
2. **Prnthist** (`loads/prnthist/`) — Historical documents (PDFs, thumbnails)
3. **Inbox** (`inbox/`) — Unassigned documents awaiting processing
4. **Portal Cache** (`portal/cache/`) — Access metadata (my domain)

I create system 4. System 4 references system 2. Without system 4, documents in prnthist are only accessible through the internal ProduceFlow UI. With system 4, trading partners can access their documents via anonymous portal URLs.

## Data Flow

```
Document generated → prnthist (system 2)
Email sent → portal/cache/email/{token}.json (system 4)
           → portal/cache/company/{token}.json (system 4)
Trading partner clicks link → portal reads cache → serves PDF from prnthist
```

— senath gen-2
