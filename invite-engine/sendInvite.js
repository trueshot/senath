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
// COPY: loads-line machinery REMOVED (George 2026-07-24). An invitation is
// about identity and company attachment — it has no business reading load
// data. The template's {loadsLine} slot gets one generic sentence until
// denver/emsworth's blessed copy replaces the template wholesale. The
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

// ------------------------------------------------- identity check (the FORK)
// Lifted verbatim in behaviour from sendEmail.js checkEmailRegisteredToPER.
// denver gen-2 caught the gap 2026-07-27: without this, inviting an EXISTING
// ProduceStandards partner tells them to create an account they already have.
// The document pipeline has forked on this since it was built; the invite path
// never inherited it. FAIL-OPEN to not-registered on every error path \u2014 an
// identity API hiccup must never block an invitation (same rule as the
// document path). Node 5.12-safe: no arrows, no template literals.
var http = require('http');
function checkEmailRegisteredToPER(email, callback) {
    var postData = JSON.stringify({ email: email });
    var options = {
        hostname: '172.31.28.199',   // Monkey (verifyApi.js) \u2014 NOT Hawk
        port: 3006,
        path: '/api/check-prostan-partner',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        timeout: 5000
    };
    var done = false;
    function finish(res) { if (!done) { done = true; callback(null, res); } }
    var req = http.request(options, function (res) {
        var data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
            try {
                var r = JSON.parse(data);
                if (r.success) {
                    return finish({ isRegistered: r.isPartner === true, prostan8: r.prostan8 || null, skipReason: null });
                }
                finish({ isRegistered: false, prostan8: null, skipReason: 'api_error' });
            } catch (e) {
                finish({ isRegistered: false, prostan8: null, skipReason: 'parse_error' });
            }
        });
    });
    req.on('error', function (e) { finish({ isRegistered: false, prostan8: null, skipReason: 'network_error:' + e.message }); });
    req.on('timeout', function () { req.abort(); finish({ isRegistered: false, prostan8: null, skipReason: 'timeout' }); });
    req.write(postData);
    req.end();
}

// ---------------------------------------------------------------- template
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderTemplate(path) {
    var html;
    try { html = fs.readFileSync(path, 'utf8'); }
    catch (e) { fail('cannot read template ' + path + ': ' + e.message); }
    // inviteeName substitutes to EMPTY when absent \u2014 emsworth's body is authored
    // 'Hi {inviteeName}' with NO comma precisely so it renders 'Hi Maria' or a
    // bare 'Hi'. Do not substitute a filler word here; it breaks their design.
    html = html.split('{inviteeName}').join(esc(inviteeName))
               .split('{sharerCorp}').join(esc(sharerCorp))
               .split('{ctaUrl}').join(ctaUrl);
    var leftovers = html.replace(/<!--[\s\S]*?-->/g, '').match(/\{[a-zA-Z]+\}/g);
    if (leftovers) fail('template has UNREPLACED tokens in rendered markup: ' + leftovers.join(', '));
    return html;
}

// ---------------------------------------------------------------- main
checkEmailRegisteredToPER(inviteeEmail, function (_, identity) {
    // THE FORK. A person who already holds a ProduceStandards identity must NOT
    // be told to create an account. Their body is a different one (partner
    // template). Until that body exists the engine REFUSES rather than sending
    // the wrong email — a wrong invitation is worse than a delayed one.
    var isPartner = identity.isRegistered === true;
    var partnerTemplate = opt('partner-template', 'invite-template-partner.html');
    var chosenTemplate = templatePath;
    if (isPartner) {
        if (!fs.existsSync(partnerTemplate)) {
            console.error('BLOCKED: ' + inviteeEmail + ' is ALREADY a ProduceStandards partner'
                + (identity.prostan8 ? ' (' + identity.prostan8 + ')' : '') + '.');
            console.error('The new-user body would tell them to create an account they already have.');
            console.error('Needs the partner body at ' + partnerTemplate + ' (emsworth owns the words).');
            process.exit(1);
        }
        chosenTemplate = partnerTemplate;
    }

    var html = renderTemplate(chosenTemplate);
    var subject = sharerCorp + ' set up a portal for you';

    console.log('dataset:   ' + dataset);
    console.log('company:   ' + companyId);
    console.log('to:        ' + (inviteeName ? inviteeName + ' <' + inviteeEmail + '>' : inviteeEmail));
    console.log('from:      ' + sharerCorp + ' via ProduceStandards.org <invitations@producestandards.org>');
    console.log('subject:   ' + subject);
    console.log('kind:      member (Stage A, hard-coded — gates authority, never a parameter)');
    console.log('invite:    ' + inviteHash);
    console.log('identity:  ' + (isPartner ? 'EXISTING PARTNER' : 'new user')
        + (identity.skipReason ? '  [check failed: ' + identity.skipReason + ' — defaulted to new user]' : '')
        + '  -> template ' + chosenTemplate);

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
