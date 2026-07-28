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
var NEW_USER_PATH_READY = true;   // FLIPPED 2026-07-28: nashville CONFIRMED DIRECT (not relayed) — ?invite= handler live+QA-walked: open stamp, fail-closed registration, binding birth, invite close, negatives verified.
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

    // Every refusal carries a machine-readable err.code so a mounting route can
    // map to a status without string-matching my prose (detroit gen-18).
    // Codes: body_invalid | bad_email | config_error | no_session_identity |
    //        template_missing | new_user_path_not_live | binding_failed |
    //        birth_failed | ses_failed | redis_error | timeout
    function coded(code, msg) { var e = new Error(msg); e.code = code; return e; }
    function bail(code, msg) {
        var e = new Error(msg);
        e.code = code;
        return callback(e);
    }

    if (!companyId) return bail('body_invalid', 'companyId required');
    if (!inviteeEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(inviteeEmail))) {
        return bail('bad_email', 'inviteeEmail required and must be a valid address');
    }

    var ctx = readContext(datasetDir);
    if (doSend && !ctx.dataset) return bail('config_error', 'no dataset resolved — refusing to send. ' + (ctx.configError || 'portal-config.json has no "dataset" and TRUESHOT_DATASET is unset.'));
    if (doSend && !ctx.corpProstan8) return bail('config_error', 'missing corpProstan8 — refusing to guess an inviting corp. ' + (ctx.configError || 'portal-config.json has no "corpProstan8".'));
    // George's ruling 2026-07-27: "they press the invite, so obviously they are
    // inviting — yes it is me if I am logged in." The person is the caller's to
    // supply from the session. No session identity, no send.
    if (doSend && !opts.inviterProstan8) return bail('no_session_identity', 'inviterProstan8 required on send — resolve it from the session, never from the request body');
    if (doSend && !opts.inviterDisplay) return bail('no_session_identity', 'inviterDisplay required on send');

    var inviteHash = crypto.randomBytes(16).toString('hex');

    checkEmailRegisteredToPER(inviteeEmail, function (_, identity) {
        var isPartner = identity.isRegistered === true;
        var file = path.join(templateDir, isPartner ? 'invite-template-partner.html' : 'invite-template.html');

        // FAIL-CLOSED: no body for this audience => send nothing. Telling an
        // existing member to "create your account" is a WRONG email, not a late one.
        if (!fs.existsSync(file)) {
            return bail('template_missing', (isPartner ? 'partner' : 'new-user') + ' body missing at ' + file + ' — refusing to send the wrong body');
        }
        // FAIL-CLOSED: the new-user CTA points at a param register.html does not
        // parse yet. A dead link that binds nothing is worse than no invitation.
        if (doSend && !isPartner && !NEW_USER_PATH_READY) {
            return bail('new_user_path_not_live', 'new-user path not live: register.html does not parse ?invite= yet (nashville). '
                      + 'Flip NEW_USER_PATH_READY once their handler ships.');
        }

        var ctaUrl = ctaFor(isPartner, inviteHash);
        var html, subject = ctx.sharerCorp + ' set up a portal for you';
        try {
            html = renderTemplate(file, { inviteeName: inviteeName, sharerCorp: ctx.sharerCorp, ctaUrl: ctaUrl });
        } catch (e) { return bail('template_missing', e.message); }

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
        catch (e) { return bail('config_error', 'cannot read d:/secrets/config.json: ' + e.message); }
        // Explicit credentials — NEVER AWS.config.loadFromPath in a mounted module.
        var ses = new AWS.SES({
            apiVersion: '2010-12-01',
            region: secrets.region || 'us-east-1',
            accessKeyId: secrets.accessKeyId,
            secretAccessKey: secrets.secretAccessKey
        });

        var jrec = require('./libertyville/jrec');
        var Redis = require('redis');
        // ★ THE opts.redisClient DOOR WAS REMOVED 2026-07-27 (detroit gen-18 +
        // pilotbird). It had a silent-corruption failure mode: a supplied client
        // was never SELECTed (the old guard skipped it), so a caller handing over
        // a client bound to any other db made this module read and write THE
        // WRONG DATABASE — silently, returning success, with the real binding
        // untouched. Green result, permanent write in the wrong place.
        // I had also described the hazard BACKWARDS to detroit, claiming the
        // module would SELECT on a supplied client and contaminate the caller's
        // connection. My own guard prevented that; the real risk pointed the
        // other way and was worse. This module now ALWAYS creates and owns its
        // own connection, so a wrong-db client cannot be handed in at all.
        // Non-participation is structural: the safest door is the one that
        // does not exist. Do not re-add it without an explicit db assertion.
        var redisClient = Redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
        var finished = false;
        // WATCHDOG. detroit gen-18: their socket timeout kills THEIR socket and
        // cannot interrupt work already in flight in here, so the bound has to
        // live on this side too. Default 20s; caller may set opts.timeoutMs.
        // HONEST LIMIT: this bounds when the CALLER hears back, not when the work
        // stops. If it fires after the jrec birth, the invite record exists
        // (step=sent) and a send may still land — so the error says so, and the
        // hash is returned for reconciliation rather than swallowed.
        var timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 20000;
        var watchdog = setTimeout(function () {
            var e = new Error('invite timed out after ' + timeoutMs + 'ms. '
                + 'Work may still be in flight; jrec:invite:' + inviteHash
                + ' may exist (30d TTL) and an email may still be delivered. Do not blind-retry — check the Sent page (doctype=invite) first.');
            e.code = 'timeout';
            e.inviteHash = inviteHash;
            done(e);
        }, timeoutMs);
        if (watchdog.unref) watchdog.unref();   // never hold the host process open

        function done(err, res) {
            if (finished) return;
            finished = true;
            clearTimeout(watchdog);
            try { redisClient.quit(); } catch (e) {}
            callback(err, res);
        }
        redisClient.on('error', function (e) {
            var re = new Error('redis: ' + e.message);
            re.code = 'redis_error';
            done(re);
        });

        function withDb(next) {
            redisClient.on('connect', function () {
                redisClient.select(REDIS_DB, function (selErr) {
                    if (selErr) return done(coded('redis_error', 'redis SELECT ' + REDIS_DB + ' failed: ' + selErr.message));
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
                // senath_lastSendAt, NOT senath_lastInviteAt: the schema owns
                // exactly [senath_lastSendAt, scope_*] for me, and jrec ownership
                // validation rejects the whole write on any unowned field — which
                // aborted George's FIRST REAL SEND (2026-07-28, caught loud and
                // atomic by the fail-closed rule; nashville diagnosed it in
                // minutes because the error named the field). An invite email IS
                // a send, and the invite-specific fact is already recorded where
                // it belongs: scope_*.source = 'invite' + boundAt. A dedicated
                // lastInviteAt field needs a libertyville schema amendment first.
                var ops = { set: { senath_lastSendAt: nowIso }, initOnly: {}, initialCoherence: { tier: 'registered' } };
                ops.initOnly[scopeField] = JSON.stringify({
                    companyId: companyId, pulpId: null, role: 'partner', boundAt: nowIso,
                    relationshipKey: 'jrec:portal:' + ctx.dataset + ':' + companyId,
                    source: 'invite'
                });
                jrec.upsert(redisClient, 'perportal', [ctx.dataset, p8], 'senath', ops, function (ppErr) {
                    if (ppErr) return done(coded('binding_failed', 'perportal binding failed — send aborted (the email would promise access never granted): ' + ppErr.message));
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
                        // dataset + companyId: what nashville's registration
                        // handler binds a COLD invitee to. Without them a new
                        // user registers and cannot be scoped — the empty-portal
                        // outcome one layer deeper (nashville gen-4, 2026-07-28).
                        // inviterCorp is a DISPLAY name and cannot serve.
                        senath_dataset:          ctx.dataset,
                        senath_companyId:        companyId,
                        senath_sentAt:           nowIso,
                        senath_channel:          channel
                    },
                    initialCoherence: { step: 'sent' }
                }, function (jrecErr) {
                    // Birth failure ABORTS: an untracked invitation is the one
                    // failure this design exists to prevent.
                    if (jrecErr) return done(coded('birth_failed', 'jrec:invite birth failed — send aborted: ' + jrecErr.message));

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
                            return done(coded('ses_failed', 'SES send failed: ' + sesErr.code + ' - ' + sesErr.message
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

// ---------------------------------------------------------------- exports
// capabilities() is a FUNCTION, not an exported value (detroit gen-18 caught
// the value form: a consumer reading invite.NEW_USER_PATH_READY gets a snapshot
// taken at require time, so a host could report a stale capability).
//
// ★ FLIP PROCEDURE for NEW_USER_PATH_READY — READ BEFORE FLIPPING:
//   1. nashville confirms register.html parses ?invite= and binds on completion.
//      Do NOT flip on a relayed confirmation — confirm with nashville directly.
//   2. Set NEW_USER_PATH_READY = true at the top of this file.
//   3. Deploy to every prey that mounts it (push.js willdev chain).
//   4. ★ RESTART TrueAPI (detroit) and any other mounting host. A REDEPLOY IS
//      NOT ENOUGH — Node's require cache holds the loaded module until the
//      process restarts, so sends will keep refusing on a host that has not
//      been restarted, and it will look like the flip did not work.
//   5. Verify with a real dry run on the prey, then ONE real send to yourself.
function capabilities() {
    return {
        newUserPathReady: NEW_USER_PATH_READY,
        partnerPathReady: true,
        // Tell the caller what to say when a new-user invite is refused, so
        // portland renders the true reason instead of "invite failed".
        newUserBlockedReason: NEW_USER_PATH_READY ? null
            : 'New-account invitations are not live yet: the registration page does not '
            + 'handle invitation links, so an invited new user would land on a generic '
            + 'form and end up connected to nothing.'
    };
}

module.exports = { sendInvite: sendInvite, capabilities: capabilities };
