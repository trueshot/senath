// sendInvite.js — PORTAL INVITATION send + jrec:invite birth (Stage A step 4).
//
// OWNER: senath (billet: senathSendEmail | repo: c:/clients/senath)
// The deliberate-channel sibling of sendEmail.js: no document, no prnthist —
// an operator (or portland's console via detroit's gate) invites a company's
// person to their portal. SeedDrop portal invitations, kind='member' ONLY
// (George's frame ruling 2026-07-23: external partners, logistics clock;
// employee-kind is the deferred SpringForward lane and does NOT ship here).
//
// USAGE (runs on the prey, in the dataset working dir, like sendEmail.js):
//   node nodejs/sendInvite.js --company PROMIS --email person@grower.com --name "John Field"
//                             [--inviter "Savannah Chen"] [--channel operator-cli]
//                             [--template invite-template.html] [--send]
//   DRY RUN IS THE DEFAULT: renders everything (incl. recent-loads copy ladder),
//   writes latest_invite_preview.html, sends NOTHING, births NOTHING.
//   --send does both, in this order: jrec birth FIRST, then the SES send —
//   an invitation that exists untracked is worse than one delayed a beat.
//
// WHAT IT DOES on --send:
//   1. Births jrec:invite:{hash} (db 8, jrec.js applies the 30d TTL itself):
//      senath_kind='member' (EXPLICIT LITERAL — it gates an authority grant;
//      never a parameter, never defaulted, never inferred), inviterProstan8,
//      inviterCorp, inviteeEmail, inviteeName, sentAt, channel; step='sent'.
//      Only the RATIFIED fields — program/bindTarget/sharerCorp land when
//      libertyville deploys that scaffold (additive; do not pre-write).
//   2. Sends via SES from invitations@producestandards.org (verified domain),
//      display-name carries the sharer's voice, CTA carries ?invite={hash} —
//      harmless until nashville ships hash handling, works retroactively after.
//   3. SES tags: doctype=invite (so it appears on the Sent page automatically —
//      the extractor keys "our path" on doctype), invite={hash} (the ratified
//      8th tag: makes Delivery/Bounce/Open -> senath_bounced correlation
//      mechanical), dataset, company.
//
// COPY: the engine composes {loadsLine} per the ratified honest ladder
// (measured 7/24: SHIP_DATE is a SCHEDULED date, 50% populated; ORDER_DATE
// 99.7%; a past-tense claim requires shipDate present AND <= today). The
// template file is denver/emsworth's to overwrite; the engine re-reads per send.
//
// Node 5.12 compatible: no template literals, no arrows, no let/const.
// Author: senath gen-11 — 2026-07-24

var fs = require('fs');
var crypto = require('crypto');

// ---------------------------------------------------------------- args
var argv = process.argv;
function opt(name, def) {
    var i = argv.indexOf('--' + name);
    return (i !== -1 && argv[i + 1] && argv[i + 1].indexOf('--') !== 0) ? argv[i + 1] : def;
}
var SEND = argv.indexOf('--send') !== -1;
var companyId = opt('company', null);
var inviteeEmail = opt('email', null);
var inviteeName = opt('name', '');
var inviterName = opt('inviter', '');
var channel = opt('channel', 'operator-cli');
var templatePath = opt('template', 'invite-template.html');

function fail(msg) { console.error('BLOCKED: ' + msg); process.exit(1); }
if (!companyId) fail('--company required (the invitee\'s company id, e.g. PROMIS)');
if (!inviteeEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteeEmail)) fail('--email required and must be a valid address');

// ---------------------------------------------------------------- context
// portal-config.json: dataset + corp prostan8 (preston provisions it per prey).
var portalConfig = null;
try { portalConfig = JSON.parse(fs.readFileSync('portal-config.json', 'utf8')); } catch (e) {}
var dataset = (process.env.TRUESHOT_DATASET || (portalConfig && portalConfig.dataset) || 'ACST').toUpperCase();
var inviterProstan8 = (portalConfig && portalConfig.corpProstan8) || null;

// sharer display name from the company track record (same source sendEmail uses)
var sharerCorp = 'your trading partner';
try {
    var trackJson = JSON.parse(fs.readFileSync('data/i_track.js', 'utf8'));
    if (trackJson.track && trackJson.track[0] && trackJson.track[0].compname) {
        sharerCorp = String(trackJson.track[0].compname).trim();
    }
} catch (e) {}

if (SEND && !inviterProstan8) fail('portal-config.json missing corpProstan8 — cannot attribute the inviter corp. Fix config; not guessing an identity field.');

var inviteHash = crypto.randomBytes(16).toString('hex');
var ctaUrl = 'https://producestandards.org/register?invite=' + inviteHash;

// ---------------------------------------------------------------- loads line
// Ratified honest-copy ladder. recentLoads NEVER throws; ok:false -> neutral
// line with NO load claim (never render a lookup failure as "no loads").
var getRecentLoads = require('./recentLoads').getRecentLoads;

function todayIso() {
    var d = new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}
function humanDate(iso) {
    var MO = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var p = String(iso).split('-');
    return MO[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10);
}
function composeLoadsLine(result) {
    if (!result || result.ok !== true) {
        // lookup failed -> NEUTRAL, no load claim at all (tri-state: undefined)
        return 'Everything ' + sharerCorp + ' moves for you shows up here as it happens.';
    }
    var loads = result.loads || [];
    if (loads.length === 0) {
        // VERIFIED zero -> the empty variant IS the launch case (Promiseland)
        return 'The portal is ready and waiting \u2014 when your first load moves, you\u2019ll see it here as it happens.';
    }
    var today = todayIso(), i, L;
    for (i = 0; i < loads.length; i++) {          // a. past-tense: shipDate present AND <= today
        L = loads[i];
        if (L.shipDate && L.shipDate <= today) {
            return 'Load ' + L.loadNumber + ' went out ' + humanDate(L.shipDate) + ' \u2014 it and everything else ' + sharerCorp + ' moves for you is in here.';
        }
    }
    for (i = 0; i < loads.length; i++) {          // b. future-tense: scheduled
        L = loads[i];
        if (L.shipDate && L.shipDate > today) {
            return 'Load ' + L.loadNumber + ' is scheduled to go out ' + humanDate(L.shipDate) + ' \u2014 you\u2019ll see it move in here, along with everything else ' + sharerCorp + ' handles for you.';
        }
    }
    L = loads[0];                                  // c. order-date / dateless concrete
    if (L.orderDate) {
        return 'Load ' + L.loadNumber + ', ordered ' + humanDate(L.orderDate) + ', is in motion \u2014 it and everything else ' + sharerCorp + ' moves for you is in here.';
    }
    return 'Load ' + L.loadNumber + ' is moving for you now \u2014 it and everything else is in here.';
}

// ---------------------------------------------------------------- template
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderTemplate(loadsLine) {
    var html;
    try { html = fs.readFileSync(templatePath, 'utf8'); }
    catch (e) { fail('cannot read template ' + templatePath + ': ' + e.message); }
    html = html.split('{inviteeName}').join(esc(inviteeName || 'there'))
               .split('{sharerCorp}').join(esc(sharerCorp))
               .split('{ctaUrl}').join(ctaUrl)
               .split('{loadsLine}').join(loadsLine);   // engine-composed, already safe text
    var leftovers = html.replace(/<!--[\s\S]*?-->/g, '').match(/\{[a-zA-Z]+\}/g);
    if (leftovers) fail('template has UNREPLACED tokens in rendered markup: ' + leftovers.join(', '));
    return html;
}

// ---------------------------------------------------------------- main
getRecentLoads(companyId, {}, function (ignored, loadsResult) {
    var loadsLine = composeLoadsLine(loadsResult);
    var html = renderTemplate(loadsLine);
    var subject = sharerCorp + ' set up your portal on ProduceStandards';

    console.log('dataset:   ' + dataset);
    console.log('company:   ' + companyId);
    console.log('to:        ' + (inviteeName ? inviteeName + ' <' + inviteeEmail + '>' : inviteeEmail));
    console.log('from:      ' + sharerCorp + ' via ProduceStandards.org <invitations@producestandards.org>');
    console.log('subject:   ' + subject);
    console.log('kind:      member (Stage A, hard-coded — gates authority, never a parameter)');
    console.log('invite:    ' + inviteHash);
    console.log('loadsLine: ' + loadsLine +
        (loadsResult && loadsResult.ok === false ? '   [LOOKUP FAILED: ' + loadsResult.error + ' — neutral line used]' : ''));

    try { fs.writeFileSync('latest_invite_preview.html', html); console.log('preview:   latest_invite_preview.html'); } catch (e) {}

    if (!SEND) {
        console.log('');
        console.log('DRY RUN — nothing sent, nothing birthed. Re-run with --send.');
        process.exit(0);
    }

    // ---- send path: birth FIRST, then send ---------------------------------
    var AWS = require('aws-sdk');
    AWS.config.loadFromPath('d:/secrets/config.json');
    var ses = new AWS.SES({ apiVersion: '2010-12-01' });
    var jrec = require('./libertyville/jrec');
    var Redis = require('redis');
    var redisClient = Redis.createClient({
        host: 'my-redis-cluster.3jytjd.0001.use1.cache.amazonaws.com',
        port: 6379
    });
    redisClient.on('error', function (err) { console.error('Redis error (non-fatal):', err.message); });
    redisClient.on('connect', function () {
        redisClient.select(8, function (selErr) {
            if (selErr) { console.error('Redis SELECT 8 failed:', selErr.message); process.exit(1); }

            var nowIso = new Date().toISOString();
            jrec.upsert(redisClient, 'invite', [inviteHash], 'senath', {
                set: {
                    senath_kind:            'member',   // EXPLICIT. Gates an authority grant.
                    senath_inviterProstan8: inviterProstan8,
                    senath_inviterCorp:     sharerCorp,
                    senath_inviteeEmail:    inviteeEmail,
                    senath_inviteeName:     inviteeName || '',
                    senath_sentAt:          nowIso,
                    senath_channel:         channel
                },
                initialCoherence: { step: 'sent' }
            }, function (jrecErr) {
                if (jrecErr) {
                    // Birth failure ABORTS the send: an untracked invitation is the
                    // one failure mode this whole design exists to prevent.
                    console.error('jrec:invite birth FAILED — send aborted:', jrecErr.message);
                    try { redisClient.quit(); } catch (e) {}
                    process.exit(1);
                }
                console.log('jrec birth OK: jrec:invite:' + inviteHash + ' (step=sent, kind=member)');

                function sesTag(v) { return String(v == null ? '' : v).replace(/[^A-Za-z0-9_-]/g, '_').substring(0, 256); }
                var tagPairs = [
                    'dataset=' + sesTag(dataset),
                    'company=' + sesTag(companyId),
                    'doctype=invite',                       // -> appears on the Sent page
                    'invite=' + sesTag(inviteHash)          // -> mechanical bounce/delivery join
                ];
                var rawEmail = [
                    'From: ' + sharerCorp + ' via ProduceStandards.org <invitations@producestandards.org>',
                    'To: ' + (inviteeName ? inviteeName + ' <' + inviteeEmail + '>' : inviteeEmail),
                    'Subject: ' + subject,
                    'MIME-Version: 1.0',
                    'X-SES-MESSAGE-TAGS: ' + tagPairs.join(', '),
                    'Content-Type: text/html; charset=UTF-8',
                    '',
                    html
                ].join('\r\n');

                ses.sendRawEmail({
                    Source: 'invitations@producestandards.org',
                    Destinations: [inviteeEmail],
                    RawMessage: { Data: rawEmail }
                }, function (sesErr, data) {
                    if (sesErr) {
                        console.error('SES send FAILED:', sesErr.code, '-', sesErr.message);
                        console.error('NOTE: jrec:invite:' + inviteHash + ' was already born (step=sent).');
                        console.error('The 30d TTL will expire it; or advance/inspect via libertyville tooling.');
                        try { redisClient.quit(); } catch (e) {}
                        process.exit(1);
                    }
                    console.log('[OK] Invitation sent. MessageId: ' + data.MessageId);
                    console.log('Delivery/bounce/open will appear on the Sent page (doctype=invite).');
                    try { redisClient.quit(); } catch (e) {}
                    process.exit(0);
                });
            });
        });
    });
});
