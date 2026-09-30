#!/usr/bin/env node
// seed-qa-invite.js — birth ONE QA jrec:invite record in PRODUCTION db 8 from
// georg, with NO email sent. For consumer walks (nashville register/accept)
// when the engine can't be driven from georg (SES + identity API are prey/VPC
// side). The 08-27 QA seed was a scratchpad one-off and got lost — this is it,
// kept. Author: senath gen-18, 2026-09-29.
//
// Writes through jrec.upsert as billet 'senath' — the SAME ownership
// validation the real engine (invite.js) hits, so a seed that passes here is a
// field set the engine may legally write. Field set mirrors invite.js runInvite.
//
// USAGE (dry run is the DEFAULT — prints the record, writes nothing):
//   node tools/seed-qa-invite.js --scope none    --email george+qa-x@produceflow.com
//   node tools/seed-qa-invite.js --scope partner --email ... --company PROMIS
//     [--dataset WILLIS] [--corp-p8 82vlsz7s] [--corp-name "Willis Produce Sales LLC"]
//     [--person-p8 qa_senath] [--person-name "QA seed (senath)"] [--name "Invitee"]
//     [--commit]
//
// scope=none REFUSES --company (the consumer ERRORs on none+companyId).
// scope=partner REQUIRES --company. senath_channel is always 'qa-seed' so the
// record self-identifies as QA. Records expire by the schema's 30d TTL.
//
// Connection: ElastiCache via the georg proxy bridge 127.0.0.1:16379 (the one
// redis-cmd.js --server elasticache and libertyville inspect.js use), db 8
// SELECTed explicitly, then read back on the same connection as proof.
// Redis module: node_redis 2.x (the prey's family; jrec.js is written against
// it). Override with SENATH_REDIS_MODULE.

var crypto = require('crypto');
var jrec = require('c:/clients/willdev/nodejs/libertyville/jrec.js');
var Redis = require(process.env.SENATH_REDIS_MODULE || 'c:/clients/BroccoliStable2/node_modules/redis');

var argv = process.argv;
function opt(name, def) {
    var i = argv.indexOf('--' + name);
    return (i !== -1 && argv[i + 1] && argv[i + 1].indexOf('--') !== 0) ? argv[i + 1] : def;
}
function die(msg) { console.error('REFUSED: ' + msg); process.exit(1); }

var scope = opt('scope', null);
var email = opt('email', null);
var company = opt('company', null);
var commit = argv.indexOf('--commit') !== -1;

if (scope !== 'none' && scope !== 'partner') die('--scope must be none or partner');
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) die('--email required and valid');
if (scope === 'none' && company) die('scope=none must NOT carry --company (none+companyId is contradictory)');
if (scope === 'partner' && !company) die('scope=partner requires --company');

var hash = crypto.randomBytes(16).toString('hex');
var fields = {
    senath_kind:              'member',
    senath_scope:             scope,
    senath_inviterProstan8:   opt('corp-p8', '82vlsz7s'),
    senath_inviterCorp:       opt('corp-name', 'Willis Produce Sales LLC'),
    senath_inviterPersonP8:   opt('person-p8', 'qa_senath'),
    senath_inviterPersonName: opt('person-name', 'QA seed (senath)'),
    senath_inviteeEmail:      email,
    senath_inviteeName:       opt('name', ''),
    senath_dataset:           String(opt('dataset', 'WILLIS')).toUpperCase(),
    senath_sentAt:            new Date().toISOString(),
    senath_channel:           'qa-seed'
};
if (scope === 'partner') fields.senath_companyId = company;

console.log('key: jrec:invite:' + hash);
console.log(JSON.stringify(fields, null, 2));
if (!commit) {
    console.log('\nDRY RUN — nothing written. Re-run with --commit.');
    process.exit(0);
}

var client = Redis.createClient({ host: '127.0.0.1', port: 16379 });
var t = setTimeout(function () { console.error('timeout (bridge cold leg can take ~10s; this waited 30s)'); process.exit(1); }, 30000);
client.on('error', function (e) { console.error('redis: ' + e.message); process.exit(1); });
client.select(8, function (selErr) {
    if (selErr) { console.error('SELECT 8 failed: ' + selErr.message); process.exit(1); }
    jrec.upsert(client, 'invite', [hash], 'senath', { set: fields, initialCoherence: { step: 'sent' } }, function (err) {
        if (err) { console.error('BIRTH FAILED: ' + err.message); process.exit(1); }
        // Proof from the ARTIFACT, not from the call returning.
        client.hgetall('jrec:invite:' + hash, function (gErr, rec) {
            client.ttl('jrec:invite:' + hash, function (tErr, ttl) {
                clearTimeout(t);
                if (gErr || !rec) { console.error('READ-BACK FAILED: ' + (gErr ? gErr.message : 'no record')); process.exit(1); }
                console.log('\nBORN + READ BACK (db 8): step=' + rec.step + ' scope=' + rec.senath_scope
                    + ' companyId=' + (rec.senath_companyId || '(absent)') + ' ttl=' + ttl + 's');
                console.log('HASH: ' + hash);
                client.quit();
            });
        });
    });
});
