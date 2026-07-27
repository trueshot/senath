// invite.js — MOUNTABLE portal-invitation sender.
//
// OWNER: senath (billet: senathSendEmail | repo: c:/clients/senath)
//
// This is the module detroit requires INSIDE their operator-gated route.
// It is the same engine as the sendInvite.js CLI; the CLI is now a thin
// wrapper over this file. There is exactly ONE sender — that is the
// ratification, and two entry points calling one function is how it stays true.
//
//   var invite = require('./invite');
//   invite.sendInvite(opts, function (err, result) { ... });
//
// WHY A MODULE AND NOT A SHELLED CLI: spawning a process from a request
// handler on a shared gateway is the lesson of the willis outage (boston,
// gen-11). Also no argv means no shell-quoting an email address into a
// command line. Precedent: prosser mounts senath's reggi-emaillog.js the
// same way.
//
// ★ IT NEVER TOUCHES GLOBAL AWS CONFIG. AWS.config.loadFromPath() mutates
// process-wide state — in Reggi that silently rerouted 28 DynamoDB endpoints
// (prosser, gen-11). This module reads the secrets file itself and passes
// credentials into the SES constructor. A mounted module must not reconfigure
// its host.
//
// Node 5.12 compatible: no arrows, no template literals, no let/const.
// Author: senath gen-12 — 2026-07-27

var fs = require('fs');
var path = require('path');
var http = require('http');
var crypto = require('crypto');

var SES_SENDER = 'invitations@producestandards.org';   // verified domain
var IDENTITY_HOST = '172.31.28.199';                   // Monkey (verifyApi.js), NOT Hawk
var IDENTITY_PORT = 3006;
var REDIS_HOST = 'my-redis-cluster.3jytjd.0001.use1.cache.amazonaws.com';
var REDIS_PORT = 6379;
var REDIS_DB = 8;

// The CTA forks with the identity (nashville gen-4, 2026-07-27):
//   no identity  -> the registration form
//   has identity -> straight to sign-in; oauth returns them to /home.html
//                   authenticated. No phone, no SMS, no form.
// ★ register.html does NOT parse '?invite=' today — verified by nashville
// 2026-07-27. A new-user link lands on the generic form and a completion binds
// nothing. NEW_USER_PATH_READY stays false until their handler ships; with it
// false, sendInvite refuses new-user sends rather than sending a dead link.
var NEW_USER_PATH_READY = false;
function ctaFor(isPartner, inviteHash) {
    return isPartner
        ? 'https://producestandards.org/signin.html'
        : 'https://producestandards.org/register?invite=' + inviteHash;
}

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------- identity
// FAIL-OPEN on every error path: an identity hiccup must never block an
// invitation. (Contrast with the fail-CLOSED paths below — degraded-but-
// plausible output may ship; known-wrong output may not.)
function checkEmailRegisteredToPER(email, callback) {
    var postData = JSON.stringify({ email: email });
    var options = {
        hostname: IDENTITY_HOST, port: IDENTITY_PORT,
        path: '/api/check-prostan-partner', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
        timeout: 5000
    };
    var done = false;
    function finish(r) { if (!done) { done = true; callback(null, r); } }
    var req = http.request(options, function (res) {
        var data = '';
        res.on('data', function (c) { data += c; });
        res.on('end', function () {
            try {
                var r = JSON.parse(data);
                if (r.success) return finish({ isRegistered: r.isPartner === true, prostan8: r.prostan8 || null, skipReason: null });
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

// ---------------------------------------------------------------- context
// Read per call from datasetDir, NOT cached at module load: a mounted host may
// outlive a config edit, and caching would serve a stale dataset silently.
function readContext(datasetDir) {
    var ctx = { dataset: null, corpProstan8: null, sharerCorp: 'your trading partner', configError: null };
    try {
        var pc = JSON.parse(fs.readFileSync(path.join(datasetDir, 'portal-config.json'), 'utf8'));
        ctx.dataset = pc.dataset || null;
        ctx.corpProstan8 = pc.corpProstan8 || null;
    } catch (e) {
        // Absent is normal on some datasets. MALFORMED is not, and must not be
        // reported as "no dataset" — a swallowed parse error sends the next
        // person hunting the wrong thing on a prey. Say which it is.
        ctx.configError = (e.code === 'ENOENT')
            ? 'portal-config.json not found in ' + datasetDir
            : 'portal-config.json is unreadable/malformed: ' + e.message;
    }
    if (!ctx.dataset) ctx.dataset = process.env.TRUESHOT_DATASET || null;
    if (ctx.dataset) ctx.dataset = String(ctx.dataset).toUpperCase();
    try {
        var tr = JSON.parse(fs.readFileSync(path.join(datasetDir, 'data/i_track.js'), 'utf8'));
        if (tr.track && tr.track[0] && tr.track[0].compname) {
            // Already a human display name ("Willis Produce Sales LLC") — do NOT
            // case-convert; title-casing turns LLC into Llc (emsworth, 07-27).
            ctx.sharerCorp = String(tr.track[0].compname).trim();
        }
    } catch (e) { /* fallback stands */ }
    return ctx;
}

function renderTemplate(file, vals) {
    var html = fs.readFileSync(file, 'utf8');
    // inviteeName substitutes to EMPTY when absent — the body is authored
    // 'Hi {inviteeName}' with NO comma so it renders 'Hi Maria' or a bare 'Hi'.
    // Do not substitute a filler word; it breaks emsworth's design.
    html = html.split('{inviteeName}').join(esc(vals.inviteeName))
               .split('{sharerCorp}').join(esc(vals.sharerCorp))
               .split('{ctaUrl}').join(vals.ctaUrl);
    var leftovers = html.replace(/<!--[\s\S]*?-->/g, '').match(/\{[a-zA-Z]+\}/g);
    if (leftovers) throw new Error('template has UNREPLACED tokens in rendered markup: ' + leftovers.join(', '));
    return html;
}

/**
 * sendInvite(opts, callback)
 *
 * opts:
 *   companyId        REQUIRED  invitee's company id, e.g. 'PROMIS'
 *   inviteeEmail     REQUIRED  validated
 *   inviteeName      optional  may be '' — copy renders correctly without it
 *   inviterProstan8  REQUIRED ON SEND  the PERSON pressing the button, resolved
 *                    by the CALLER from the session. Never accepted from a
 *                    request body: if a browser can name the inviter, an
 *                    operator can invite as someone else and the record is
 *                    permanently wrong.
 *   inviterDisplay   REQUIRED ON SEND  that person's display name
 *   channel          optional  origin tag, e.g. 'portal-manager' (default 'api')
 *   send             optional  DEFAULT FALSE — false renders and returns, writes
 *                    nothing, sends nothing
 *   datasetDir       optional  defaults to process.cwd()
 *   templateDir      optional  defaults to this module's directory
 *
 * callback(err, result) where result =
 *   { inviteHash, identity:'partner'|'new-user', skipReason, subject, html,
 *     ctaUrl, bound:bool, messageId:string|null, sent:bool }
 */
function sendInvite(opts, callback) {
    opts = opts || {};
    var companyId = opts.companyId;
    var inviteeEmail = opts.inviteeEmail;
    var inviteeName = opts.inviteeName || '';
    var channel = opts.channel || 'api';
    var doSend = opts.send === true;
    var datasetDir = opts.datasetDir || process.cwd();
    var templateDir = opts.templateDir || __dirname;

    function bail(msg) { return callback(new Error(msg)); }

    if (!companyId) return bail('companyId required');
    if (!inviteeEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(inviteeEmail))) {
        return bail('inviteeEmail required and must be a valid address');
    }

    var ctx = readContext(datasetDir);
    if (doSend && !ctx.dataset) return bail('no dataset resolved — refusing to send. ' + (ctx.configError || 'portal-config.json has no "dataset" and TRUESHOT_DATASET is unset.'));
    if (doSend && !ctx.corpProstan8) return bail('missing corpProstan8 — refusing to guess an inviting corp. ' + (ctx.configError || 'portal-config.json has no "corpProstan8".'));
    // George's ruling 2026-07-27: "they press the invite, so obviously they are
    // inviting — yes it is me if I am logged in." The person is the caller's to
    // supply from the session. No session identity, no send.
    if (doSend && !opts.inviterProstan8) return bail('inviterProstan8 required on send — resolve it from the session, never from the request body');
    if (doSend && !opts.inviterDisplay) return bail('inviterDisplay required on send');

    var inviteHash = crypto.randomBytes(16).toString('hex');

    checkEmailRegisteredToPER(inviteeEmail, function (_, identity) {
        var isPartner = identity.isRegistered === true;
        var file = path.join(templateDir, isPartner ? 'invite-template-partner.html' : 'invite-template.html');

        // FAIL-CLOSED: no body for this audience => send nothing. Telling an
        // existing member to "create your account" is a WRONG email, not a late one.
        if (!fs.existsSync(file)) {
            return bail((isPartner ? 'partner' : 'new-user') + ' body missing at ' + file + ' — refusing to send the wrong body');
        }
        // FAIL-CLOSED: the new-user CTA points at a param register.html does not
        // parse yet. A dead link that binds nothing is worse than no invitation.
        if (doSend && !isPartner && !NEW_USER_PATH_READY) {
            return bail('new-user path not live: register.html does not parse ?invite= yet (nashville). '
                      + 'Flip NEW_USER_PATH_READY once their handler ships.');
        }

        var ctaUrl = ctaFor(isPartner, inviteHash);
        var html, subject = ctx.sharerCorp + ' set up a portal for you';
        try {
            html = renderTemplate(file, { inviteeName: inviteeName, sharerCorp: ctx.sharerCorp, ctaUrl: ctaUrl });
        } catch (e) { return bail(e.message); }

        var result = {
            inviteHash: inviteHash,
            identity: isPartner ? 'partner' : 'new-user',
            skipReason: identity.skipReason,
            subject: subject, html: html, ctaUrl: ctaUrl,
            bound: false, messageId: null, sent: false
        };
        if (!doSend) return callback(null, result);

        // ------------------------------------------------------ send path
        var AWS = require('aws-sdk');
        var secrets;
        try { secrets = JSON.parse(fs.readFileSync('d:/secrets/config.json', 'utf8')); }
        catch (e) { return bail('cannot read d:/secrets/config.json: ' + e.message); }
        // Explicit credentials — NEVER AWS.config.loadFromPath in a mounted module.
        var ses = new AWS.SES({
            apiVersion: '2010-12-01',
            region: secrets.region || 'us-east-1',
            accessKeyId: secrets.accessKeyId,
            secretAccessKey: secrets.secretAccessKey
        });

        var jrec = require('./libertyville/jrec');
        var Redis = require('redis');
        var redisClient = opts.redisClient || Redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
        var ownsClient = !opts.redisClient;
        var finished = false;
        function done(err, res) {
            if (finished) return;
            finished = true;
            if (ownsClient) { try { redisClient.quit(); } catch (e) {} }
            callback(err, res);
        }
        redisClient.on('error', function (e) { done(new Error('redis: ' + e.message)); });

        function withDb(next) {
            if (!ownsClient) return next();
            redisClient.on('connect', function () {
                redisClient.select(REDIS_DB, function (selErr) {
                    if (selErr) return done(new Error('redis SELECT ' + REDIS_DB + ' failed: ' + selErr.message));
                    next();
                });
            });
        }

        withDb(function () {
            var nowIso = new Date().toISOString();

            // PARTNER PRE-BINDING. sendEmail.js writes this at DOCUMENT send
            // (perportal birth path 2); the invite path is a different entry and
            // must write it too, or a cold-invited partner signs in to an empty
            // portal while the email says access was granted.
            // FAIL-CLOSED: no binding, no send.
            function bindPartnerThen(next) {
                if (!isPartner || !identity.prostan8) return next();
                var p8 = String(identity.prostan8).replace(/^u_/, '');   // verify API returns u_<id>
                var scopeField = 'scope_' + String(companyId).replace(/[^A-Za-z0-9_]/g, '_');
                var ops = { set: { senath_lastInviteAt: nowIso }, initOnly: {}, initialCoherence: { tier: 'registered' } };
                ops.initOnly[scopeField] = JSON.stringify({
                    companyId: companyId, pulpId: null, role: 'partner', boundAt: nowIso,
                    relationshipKey: 'jrec:portal:' + ctx.dataset + ':' + companyId,
                    source: 'invite'
                });
                jrec.upsert(redisClient, 'perportal', [ctx.dataset, p8], 'senath', ops, function (ppErr) {
                    if (ppErr) return done(new Error('perportal binding failed — send aborted (the email would promise access never granted): ' + ppErr.message));
                    result.bound = true;
                    next();
                });
            }

            bindPartnerThen(function () {
                jrec.upsert(redisClient, 'invite', [inviteHash], 'senath', {
                    set: {
                        senath_kind:             'member',   // EXPLICIT. Gates an authority grant.
                        senath_inviterProstan8:  ctx.corpProstan8,      // the CORP
                        senath_inviterCorp:      ctx.sharerCorp,
                        senath_inviterPersonP8:  String(opts.inviterProstan8).replace(/^u_/, ''),  // the PERSON
                        senath_inviterPersonName: opts.inviterDisplay,
                        senath_inviteeEmail:     inviteeEmail,
                        senath_inviteeName:      inviteeName,
                        senath_sentAt:           nowIso,
                        senath_channel:          channel
                    },
                    initialCoherence: { step: 'sent' }
                }, function (jrecErr) {
                    // Birth failure ABORTS: an untracked invitation is the one
                    // failure this design exists to prevent.
                    if (jrecErr) return done(new Error('jrec:invite birth failed — send aborted: ' + jrecErr.message));

                    function sesTag(v) { return String(v == null ? '' : v).replace(/[^A-Za-z0-9_-]/g, '_').substring(0, 256); }
                    var tagPairs = [
                        'dataset=' + sesTag(ctx.dataset),
                        'company=' + sesTag(companyId),
                        'doctype=invite',                  // -> lands on the Sent page
                        'invite=' + sesTag(inviteHash)     // -> mechanical delivery/bounce join
                    ];
                    var rawEmail = [
                        'From: ' + ctx.sharerCorp + ' via ProduceStandards.org <' + SES_SENDER + '>',
                        'To: ' + (inviteeName ? inviteeName + ' <' + inviteeEmail + '>' : inviteeEmail),
                        'Subject: ' + subject,
                        'MIME-Version: 1.0',
                        'X-SES-MESSAGE-TAGS: ' + tagPairs.join(', '),
                        'Content-Type: text/html; charset=UTF-8',
                        '',
                        html
                    ].join('\r\n');

                    ses.sendRawEmail({
                        Source: SES_SENDER,
                        Destinations: [inviteeEmail],
                        RawMessage: { Data: rawEmail }
                    }, function (sesErr, data) {
                        if (sesErr) {
                            return done(new Error('SES send failed: ' + sesErr.code + ' - ' + sesErr.message
                                + ' (NOTE: jrec:invite:' + inviteHash + ' was already born, step=sent; 30d TTL will expire it)'));
                        }
                        result.messageId = data.MessageId;
                        result.sent = true;
                        done(null, result);
                    });
                });
            });
        });
    });
}

module.exports = { sendInvite: sendInvite, NEW_USER_PATH_READY: NEW_USER_PATH_READY };
