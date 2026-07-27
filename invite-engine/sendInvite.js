// sendInvite.js — CLI wrapper over invite.js (the real engine).
//
// OWNER: senath (billet: senathSendEmail | repo: c:/clients/senath)
//
// THIS FILE HOLDS NO LOGIC. It parses argv and calls invite.sendInvite().
// detroit's operator-gated route requires invite.js directly, in-process.
// Two entry points, ONE sender — that is how the single-funnel ratification
// stays true instead of being a promise.
//
// USAGE (runs on the prey, in the dataset working dir, like sendEmail.js):
//   node nodejs/sendInvite.js --company PROMIS --email person@grower.com \
//        [--name "John Field"] [--inviter-p8 <prostan8>] [--inviter "Name"] \
//        [--channel operator-cli] [--send]
//
// DRY RUN IS THE DEFAULT. No --send = nothing born, nothing sent.
//
// NOTE on --inviter: the OLD --inviter flag was DEAD — parsed and never used,
// so it silently recorded nothing while looking like attribution. The record
// now carries the inviting PERSON (senath_inviterPersonP8/Name) separately from
// the inviting CORP, per George's ruling 2026-07-27. On --send both are
// required; from the HTTP route detroit resolves them FROM THE SESSION.
//
// Node 5.12 compatible. Author: senath gen-12 — 2026-07-27

var path = require('path');
var invite = require('./invite');

var argv = process.argv;
function opt(name, def) {
    var i = argv.indexOf('--' + name);
    return (i !== -1 && argv[i + 1] && argv[i + 1].indexOf('--') !== 0) ? argv[i + 1] : def;
}

var opts = {
    companyId:       opt('company', null),
    inviteeEmail:    opt('email', null),
    inviteeName:     opt('name', ''),
    inviterProstan8: opt('inviter-p8', null),
    inviterDisplay:  opt('inviter', null),
    channel:         opt('channel', 'operator-cli'),
    send:            argv.indexOf('--send') !== -1,
    datasetDir:      process.cwd(),
    templateDir:     __dirname
};

invite.sendInvite(opts, function (err, r) {
    if (err) {
        console.error('BLOCKED: ' + err.message);
        process.exit(1);
    }
    console.log('company:   ' + opts.companyId);
    console.log('to:        ' + (opts.inviteeName ? opts.inviteeName + ' <' + opts.inviteeEmail + '>' : opts.inviteeEmail));
    console.log('subject:   ' + r.subject);
    console.log('kind:      member (hard-coded — gates an authority grant, never a parameter)');
    console.log('invite:    ' + r.inviteHash);
    console.log('identity:  ' + (r.identity === 'partner' ? 'EXISTING PARTNER' : 'new user')
        + (r.skipReason ? '  [check failed: ' + r.skipReason + ' — defaulted to new user]' : ''));
    console.log('cta:       ' + r.ctaUrl);

    try {
        require('fs').writeFileSync(path.join(process.cwd(), 'latest_invite_preview.html'), r.html);
        console.log('preview:   latest_invite_preview.html');
    } catch (e) {}

    if (!r.sent) {
        console.log('');
        console.log('DRY RUN — nothing sent, nothing birthed. Re-run with --send.');
        process.exit(0);
    }
    if (r.bound) console.log('perportal binding written (partner was bound before the email left)');
    console.log('[OK] Invitation sent. MessageId: ' + r.messageId);
    console.log('Delivery/bounce/open will appear on the Sent page (doctype=invite).');
    process.exit(0);
});
