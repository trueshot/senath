#!/usr/bin/env node
// MAINTAIN: Before updating this file, audit what exists:
//   1. ls c:/clients/senath/*.js
//   2. Run each tool with --help or no args
//   3. Document every mode — what EXISTS, not what you remember
//
// Author: senath gen-0
// Created: 2026-02-21

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

// DEFAULT: Helpful orientation — NOT TOOLS.md
if (args.length === 0) {
  console.log(`# Core Senath — sendEmail.js Document Delivery Engine

I own sendEmail.js — the email process that delivers document emails (BOLs, invoices, POs)
to trading partners and turns every delivery into a ProduceStandards.org identity opportunity.

## Source File
  c:/clients/willdev/nodejs/sendEmail.js  (1479 lines, runs on all Prey servers)

## What It Does
  1. Reads document JSON from command line path
  2. Checks recipient identity against Monkey:3006 /api/check-prostan-partner
  3. Sends conditional HTML email via AWS SES:
     - New users: green upgrade CTA with 8-param contextual registration URL
     - Existing partners: verified industry partner badge
  4. Creates portal cache files (email + company) with journey metadata

## Key Functions (line numbers)
  checkEmailRegisteredToPER()     line 792   Identity check vs Monkey
  createConditionalHtmlEmail()    line 924   Template: new user vs partner
  buildContextualUpgradeUrl()     line 767   8-param registration URL
  selectSendingDomain()           line 1247  Domain routing (4 verified domains)

## Cruise Participation
  Cruise Mississippi — SeedDrop Registration Workflow (Step 1: Document Delivery)
  Downstream: Nashville register.html → Atlanta verifyApi.js → Detroit portal

## Warnings
  Node 5.12 compat — no modern JS in conditional template path
  Identity check: Monkey (172.31.28.199:3006) NOT Hawk (172.31.31.8)
  NEVER glob in c:/hawk/d/clients/willdev/loads/ — millions of files

## Library
  library/email-flow.md          Complete execution flow with decision points
  library/identity-check.md      Identity check mechanics and migration history
  node readme.js --library       Show library INDEX.md

## More Info
  node readme.js --functions     All key functions with line numbers
  node readme.js --flow          Email delivery flow diagram
  node readme.js --library       Library document index
  node readme.js --tools         Full TOOLS.md
  node readme.js --json          Structured data

## Questions?
  DM senath`);
  process.exit(0);
}

// --functions: Key functions reference
if (args.includes('--functions')) {
  console.log(`# sendEmail.js — Key Functions Reference

Source: c:/clients/willdev/nodejs/sendEmail.js (1479 lines)

## Data Loading & Setup
  loadEnvFile()                   line 30    Load .env file
  (track data loading)            line 60    Load company data from data/i_track.js

## Token & URL Generation
  generateEmailToken()            line 110   Crypto random 16-byte hex token
  generateCompanyToken()          line 114   SHA256 hash of dataset:companyId:salt
  buildDocumentUrl()              line 138   Per-document portal URL
  buildCompanyPortalUrl()         line 143   Company portal URL
  buildContextualUpgradeUrl()     line 767   8-param ProduceStandards.org registration URL
  buildUnsubscribeUrl()           line 155   Unsubscribe link

## Identity Check
  checkEmailRegisteredToPER()     line 792   POST to Monkey:3006 /api/check-prostan-partner
                                             Graceful degradation on any failure → "new user"

## Email Templates
  createSimpleHtmlEmail()         line 175   Template literal version (upgrade CTA always shown)
  createConditionalHtmlEmail()    line 924   String concat version (conditional on identity check)
  createPlainTextEmail()          line 724   Plain text fallback
  getPortalOrSupportColumn()      line 900   Right column: portal discovery or support

## Journey & Analytics
  createJourneyMetadata()         line 882   Conversion analytics metadata
  getDocumentTypeCode()           line 783   Map docName → type code (bol/invoice/po/receipt)

## Cache Management
  createEmailPortalCacheEnhanced() line 1154 Email cache with journey metadata → portal/cache/email/
  createCompanyPortalCache()       line 1274 Company document aggregation → portal/cache/company/
  createDocId()                    line 119  Document ID from PDF path components

## Email Delivery
  sendEnhancedDocumentEmail()     line 634   Full email assembly + SES (unused in main flow)
  selectSendingDomain()           line 1247  Route: produceflow/producestandards/prodicon/jungledevices

## Main Execution                 line 1379  Entry point: cache → company cache → identity check → send

## Verified Domains
  produceflow.com, producestandards.org, prodicon.com, jungledevices.com`);
  process.exit(0);
}

// --flow: Email delivery flow
if (args.includes('--flow')) {
  console.log(`# sendEmail.js — Document Delivery Flow

  Command Line (argv.c = PDF path)
       │
       ▼
  Parse path → Read JSON from email/<count>.json
       │
       ▼
  Load .env + company tracking data (i_track.js)
       │
       ▼
  Generate tokens (emailToken, companyToken)
       │
       ▼
  Create email portal cache (portal/cache/email/<token>.json)
       │
       ▼
  Create/update company portal cache (portal/cache/company/<token>.json)
       │
       ▼
  Check recipient identity ──► POST Monkey:3006/api/check-prostan-partner
       │                              │
       │                    ┌─────────┴──────────┐
       │                    │                    │
       ▼                    ▼                    ▼
  showUpgradePrompt    isPartner=false      isPartner=true
       │               (or any error)       (existing user)
       │                    │                    │
       ▼                    ▼                    ▼
  Build template    Green upgrade CTA     Blue verified badge
       │            + 8-param reg URL     + partner dashboard
       │                    │                    │
       └────────────────────┴────────────────────┘
                            │
                            ▼
                   Assemble raw email (HTML)
                            │
                            ▼
                   Save debug HTML files
                            │
                            ▼
                   AWS SES sendRawEmail()
                            │
                            ▼
                   Log result + exit`);
  process.exit(0);
}

// --library: Library index
if (args.includes('--library')) {
  const indexPath = path.join(__dirname, 'library', 'INDEX.md');
  if (fs.existsSync(indexPath)) {
    console.log(fs.readFileSync(indexPath, 'utf8'));
  } else {
    console.log('No library/INDEX.md found.');
  }
  process.exit(0);
}

// --tools: Full TOOLS.md
if (args.includes('--tools')) {
  const toolsPath = path.join(__dirname, 'TOOLS.md');
  if (fs.existsSync(toolsPath)) {
    console.log(fs.readFileSync(toolsPath, 'utf8'));
  } else {
    console.log('No TOOLS.md found yet. This repo is the intelligence layer for sendEmail.js.');
  }
  process.exit(0);
}

// --json: Structured data for cr.js whois
if (args.includes('--json')) {
  console.log(JSON.stringify({
    repo: 'senath',
    domain: 'sendEmail.js document delivery engine — identity-aware email with SeedDrop integration',
    island: 'core-senath',
    billet: 'senathSendEmail',
    sourceFile: 'c:/clients/willdev/nodejs/sendEmail.js',
    cruises: ['mississippi'],
    tools: [],
    connections: {
      upstream: [],
      downstream: [
        { island: 'core-nashville', role: 'Registration UI receives CTA clicks' },
        { island: 'core-atlanta', role: 'Identity check via Monkey:3006' },
        { island: 'core-detroit', role: 'Portal reads journey cache' }
      ],
      umbrella: 'core-denver'
    },
    verifiedDomains: [
      'produceflow.com',
      'producestandards.org',
      'prodicon.com',
      'jungledevices.com'
    ],
    status: 'operational'
  }, null, 2));
  process.exit(0);
}

// --connections: Declared couplets
if (args.includes('--connections')) {
  const connFile = path.join(__dirname, 'connections.json');
  let connections = [];
  if (fs.existsSync(connFile)) {
    try { connections = JSON.parse(fs.readFileSync(connFile, 'utf8')); }
    catch(e) { connections = []; }
  }
  console.log(JSON.stringify({
    billet: 'senathSendEmail',
    connections: connections
  }, null, 2));
  process.exit(0);
}

// --help: All available options
if (args.includes('--help')) {
  console.log(`# Core Senath readme.js — Available Options

  node readme.js                Helpful orientation (what I do, key info)
  node readme.js --functions    All key functions with line numbers
  node readme.js --flow         Email delivery flow diagram
  node readme.js --tools        Full TOOLS.md content
  node readme.js --json         Structured data (for cr.js whois)
  node readme.js --library      Library document index
  node readme.js --connections  Declared couplets
  node readme.js --help         This message`);
  process.exit(0);
}

// Unknown flag
console.log('Unknown option: ' + args.join(' '));
console.log('Run: node readme.js --help');
process.exit(1);
