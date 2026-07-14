#!/usr/bin/env node
// email-log-ui.js — Browser UI for the SES per-message email log.
//
//   node c:/clients/senath/tools/email-log-ui.js        -> http://localhost:3777
//
// Serves a single search page; /api/events shells the aws CLI (same query
// path as email-lookup.js) against CW Logs /aws/events/ses-produceflow.
// Log began 2026-07-14; retention 400 days. Runs wherever AWS creds live
// (georg). No framework, no deps.
//
// Author: senath gen-10

var http = require('http');
var spawnSync = require('child_process').spawnSync;

var PORT = 3777;
var LOG_GROUP = '/aws/events/ses-produceflow';
var REGION = 'us-east-1';

function fetchEvents(days) {
  var startMs = Date.now() - days * 86400000;
  var events = [], nextToken = null;
  do {
    var cliArgs = ['logs', 'filter-log-events', '--log-group-name', LOG_GROUP,
      '--region', REGION, '--start-time', String(startMs), '--output', 'json'];
    if (nextToken) cliArgs.push('--next-token', nextToken);
    // shell:true — aws is aws.cmd on Windows; cmd.exe does not mangle /aws/... args
    var r = spawnSync('aws', cliArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true });
    if (r.status !== 0) throw new Error('aws cli: ' + (r.stderr || 'failed').slice(0, 300));
    var page = JSON.parse(r.stdout);
    events = events.concat(page.events || []);
    nextToken = page.nextToken || null;
  } while (nextToken);
  return events;
}

function parseAndGroup(rawEvents, q) {
  q = (q || '').toLowerCase();
  var byMsg = {};
  rawEvents.forEach(function (e) {
    var d; try { d = JSON.parse(e.message); } catch (err) { return; }
    var det = d.detail || {}; var mail = det.mail || {};
    var hay = JSON.stringify([mail.destination, (mail.commonHeaders || {}).subject, mail.messageId, mail.source]).toLowerCase();
    if (q && hay.indexOf(q) === -1) return;
    var id = mail.messageId || ('?' + e.timestamp);
    var g = byMsg[id] = byMsg[id] || {
      messageId: id,
      time: mail.timestamp || new Date(e.timestamp).toISOString(),
      to: (mail.destination || []).join(', '),
      from: mail.source || '',
      subject: (mail.commonHeaders || {}).subject || '(no subject)',
      events: []
    };
    var b = det.bounce || {};
    g.events.push({
      type: det.eventType,
      time: (det.delivery || {}).timestamp || (det.bounce || {}).timestamp || (det.open || {}).timestamp || mail.timestamp,
      detail: det.eventType === 'Bounce'
        ? (b.bounceType + '/' + b.bounceSubType + ' — ' + (((b.bouncedRecipients || [])[0] || {}).diagnosticCode || 'no diagnostic'))
        : det.eventType === 'Delivery' ? ((det.delivery || {}).smtpResponse || 'accepted')
        : det.eventType === 'Open' ? ('opened · ip ' + ((det.open || {}).ipAddress || '?'))
        : det.eventType === 'DeliveryDelay' ? ((det.deliveryDelay || {}).delayType || 'delayed')
        : ''
    });
  });
  var out = Object.keys(byMsg).map(function (k) { return byMsg[k]; });
  out.sort(function (a, b) { return a.time < b.time ? 1 : -1; }); // newest first
  out.forEach(function (m) {
    var types = m.events.map(function (ev) { return ev.type; });
    m.status = types.indexOf('Bounce') !== -1 ? 'bounced'
      : types.indexOf('Open') !== -1 ? 'opened'
      : types.indexOf('Delivery') !== -1 ? 'delivered'
      : types.indexOf('Complaint') !== -1 ? 'complaint' : 'sent';
  });
  return out;
}

var PAGE = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
+ '<meta name="viewport" content="width=device-width, initial-scale=1">'
+ '<title>ProduceFlow Email Log</title><style>'
+ ':root{--paper:#FBFBF9;--card:#FFF;--ink:#1D2420;--muted:#5B6660;--line:#E3E6E1;--accent:#33587A;'
+ '--good:#2E7D4F;--good-soft:#EAF4EE;--warn:#A66E14;--warn-soft:#F8F1E2;--crit:#B23A31;--crit-soft:#F9ECEA;'
+ '--open:#33587A;--open-soft:#EAF0F5;--mono:ui-monospace,Consolas,monospace}'
+ 'body{background:var(--paper);color:var(--ink);font:15px/1.5 system-ui,"Segoe UI",sans-serif;margin:0;padding:28px 16px 60px}'
+ '.wrap{max-width:960px;margin:0 auto}'
+ 'h1{font-family:Palatino,Georgia,serif;font-size:24px;margin:0 0 4px}'
+ '.sub{color:var(--muted);font-size:13px;margin:0 0 20px}'
+ '.bar{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 8px}'
+ 'input,select,button{font:inherit;padding:8px 12px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)}'
+ 'input{flex:1;min-width:220px}'
+ 'button{background:var(--accent);color:#fff;border-color:var(--accent);cursor:pointer;font-weight:600}'
+ '.stats{display:flex;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin:14px 0 18px}'
+ '.stats b{font-size:19px;color:var(--ink);font-variant-numeric:tabular-nums;display:block}'
+ '.msg{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:13px 16px;margin:0 0 10px}'
+ '.top{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}'
+ '.pill{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 9px;border-radius:99px;white-space:nowrap}'
+ '.p-delivered{background:var(--good-soft);color:var(--good)}.p-opened{background:var(--open-soft);color:var(--open)}'
+ '.p-bounced,.p-complaint{background:var(--crit-soft);color:var(--crit)}.p-sent{background:var(--warn-soft);color:var(--warn)}'
+ '.subj{font-weight:650}.to{font-family:var(--mono);font-size:12.5px;color:var(--muted)}'
+ '.when{margin-left:auto;font-family:var(--mono);font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}'
+ '.evs{margin:8px 0 0;padding:0;list-style:none;font-size:13px}'
+ '.evs li{padding:2px 0;color:var(--muted)}'
+ '.evs .t{font-weight:650;color:var(--ink);display:inline-block;min-width:78px}'
+ '.evs li.bad,.evs li.bad .t{color:var(--crit)}'
+ '.empty{color:var(--muted);padding:30px 0;text-align:center}'
+ '.err{background:var(--crit-soft);color:var(--crit);padding:12px 16px;border-radius:6px}'
+ '@media (prefers-color-scheme:dark){:root{--paper:#151A17;--card:#1D2420;--ink:#E8EBE7;--muted:#98A29B;--line:#313A34;'
+ '--accent:#7FA5C7;--good:#6FBF8F;--good-soft:#1E2F26;--warn:#D2A251;--warn-soft:#33291A;--crit:#E08078;--crit-soft:#38211F;'
+ '--open:#7FA5C7;--open-soft:#22303C}}'
+ '</style></head><body><div class="wrap">'
+ '<h1>ProduceFlow Email Log</h1>'
+ '<p class="sub">Every email sent from produceflow.com / producestandards.org / prodicon.com / jungledevices.com since July 14, 2026. Source: AWS SES event log.</p>'
+ '<div class="bar"><input id="q" placeholder="Search recipient, subject, load number, message id&hellip;" autofocus>'
+ '<select id="days"><option value="1">Last day</option><option value="7" selected>Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select>'
+ '<button id="go">Search</button></div>'
+ '<div class="stats" id="stats"></div><div id="out" class="empty">Loading&hellip;</div></div>'
+ '<script>'
+ 'var q=document.getElementById("q"),days=document.getElementById("days"),out=document.getElementById("out"),stats=document.getElementById("stats");'
+ 'function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}'
+ 'function load(){out.innerHTML="<div class=empty>Querying AWS&hellip;</div>";stats.innerHTML="";'
+ 'fetch("/api/events?days="+days.value+"&q="+encodeURIComponent(q.value)).then(function(r){return r.json()}).then(function(d){'
+ 'if(d.error){out.innerHTML="<div class=err>"+esc(d.error)+"</div>";return}'
+ 'var ms=d.messages;var n={delivered:0,opened:0,bounced:0,sent:0,complaint:0};ms.forEach(function(m){n[m.status]=(n[m.status]||0)+1});'
+ 'stats.innerHTML="<span><b>"+ms.length+"</b>emails</span><span><b>"+(n.delivered+n.opened)+"</b>delivered</span><span><b>"+n.opened+"</b>opened</span><span><b>"+n.bounced+"</b>bounced</span><span><b>"+n.sent+"</b>sent, no receipt yet</span>";'
+ 'if(!ms.length){out.innerHTML="<div class=empty>No emails match. The log began 2026-07-14 — older sends are not in it.</div>";return}'
+ 'out.innerHTML=ms.map(function(m){'
+ 'return "<div class=msg><div class=top><span class=\'pill p-"+m.status+"\'>"+m.status+"</span>"'
+ '+"<span class=subj>"+esc(m.subject)+"</span><span class=to>&rarr; "+esc(m.to)+"</span>"'
+ '+"<span class=when>"+esc((m.time||"").replace("T"," ").slice(0,19))+" UTC</span></div>"'
+ '+"<ul class=evs>"+m.events.map(function(ev){return "<li"+(ev.type==="Bounce"||ev.type==="Complaint"?" class=bad":"")+"><span class=t>"+esc(ev.type.toUpperCase())+"</span> "+esc(ev.detail||"")+"</li>"}).join("")+"</ul></div>"'
+ '}).join("")}).catch(function(e){out.innerHTML="<div class=err>"+esc(e.message)+"</div>"})}'
+ 'document.getElementById("go").onclick=load;q.addEventListener("keydown",function(e){if(e.key==="Enter")load()});days.onchange=load;load();'
+ '</script></body></html>';

http.createServer(function (req, res) {
  if (req.url.indexOf('/api/events') === 0) {
    var u = new URL(req.url, 'http://x');
    var days = Math.min(400, parseInt(u.searchParams.get('days'), 10) || 7);
    try {
      var msgs = parseAndGroup(fetchEvents(days), u.searchParams.get('q'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ messages: msgs }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(PORT, function () {
  console.log('Email log UI: http://localhost:' + PORT + '   (senath gen-10)');
});
