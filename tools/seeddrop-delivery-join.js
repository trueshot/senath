#!/usr/bin/env node
// seeddrop-delivery-join.js — per-send delivery status for the SeedDrop funnel.
// Joins jrec:regjourney pending records (db 8 via georg tunnel 127.0.0.1:16379)
// to the SES event log (aws CLI). Writes tools/out/seeddrop-delivery.json keyed
// by regjourney hash, boston field names, matchConfidence per row.
//
// CONSUMER: boston funnel console (localhost:3500) — reads the output file.
// CADENCE IS THE CONSUMER'S: boston invokes this on their schedule (runtime
// ~1-2 min; needs the db8 tunnel up + aws CLI creds on georg). Ruled 7/24:
// durable home is THIS extract (400-day upstream retention), NOT fields on
// jrec:regjourney — those would inherit the 7-day TTL and evaporate.
// Output contains recipient emails — tools/out/ is gitignored, keep it so.
//
// Author: senath gen-11 — 2026-07-24

// Per-send delivery join: jrec:regjourney pending records vs SES event log.
// Join: recipient email + send-time proximity (regjourney birth and the SES
// send happen in the same sendEmail.js run, seconds apart). Tags post-7/22
// (load/doctype) used as confirmation where present.
var Redis = require('c:/clients/libertyville/node_modules/ioredis');
var sp = require('child_process').spawnSync;
var fs = require('fs');

function scanPending(cb){
  var client = new Redis({host:'127.0.0.1',port:16379,db:8,lazyConnect:true});
  var recs=[];
  client.connect().then(function(){
    (function loop(cursor){
      client.scan(cursor,'MATCH','jrec:regjourney:*','COUNT','300',function(err,reply){
        if(err){try{client.quit();}catch(e){} return cb(err);}
        var next=reply[0], keys=reply[1]||[]; var pending=keys.length;
        function step(){ if(pending>0)return; if(next==='0'){try{client.quit();}catch(e){} cb(null,recs);} else loop(next); }
        if(!pending) return step();
        keys.forEach(function(k){
          client.hgetall(k,function(e2,h){
            if(!e2&&h&&h.step==='pending'){
              recs.push({hash:k.split(':').pop(),
                email:(h.senath_recipientEmail||'').toLowerCase().trim(),
                load:String(h.senath_load||''),doctype:h.senath_doctype||'',
                createdAt:h.senath_createdAt||''});
            }
            pending--; step();
          });
        });
      });
    })('0');
  }).catch(cb);
}

// SES messages grouped per messageId
function sesMessages(days){
  var r=sp('aws',['logs','filter-log-events','--log-group-name','/aws/events/ses-produceflow',
    '--region','us-east-1','--start-time',String(Date.now()-days*86400000),'--output','json'],
    {encoding:'utf8',maxBuffer:128*1024*1024,shell:true});
  if(r.status!==0) throw new Error('aws: '+(r.stderr||'').slice(0,150));
  var evs=JSON.parse(r.stdout).events||[]; var byId={};
  evs.forEach(function(e){var d;try{d=JSON.parse(e.message);}catch(x){return;}
    var det=d.detail||{},mail=det.mail||{},t=mail.tags||{};
    var id=mail.messageId; if(!id)return;
    var m=byId[id]=byId[id]||{time:mail.timestamp||'',to:(mail.destination||[]).map(function(a){return String(a).toLowerCase().trim();}),
      load:(t.load||[])[0]||null,doctype:(t.doctype||[])[0]||null,
      delivered:null,bounceType:null,bounceDiag:null,complaint:false,opened:false};
    if(det.eventType==='Delivery'){m.delivered=(det.delivery||{}).timestamp||m.time;}
    if(det.eventType==='Bounce'){var b=det.bounce||{};m.bounceType=b.bounceType;
      m.bounceDiag=(((b.bouncedRecipients||[])[0]||{}).diagnosticCode||'').slice(0,120);}
    if(det.eventType==='Complaint'){m.complaint=true;}
    if(det.eventType==='Open'){m.opened=true;}
  });
  return Object.keys(byId).map(function(k){var m=byId[k];m.messageId=k;return m;});
}

scanPending(function(err,recs){
  if(err){console.log('err',err.message);process.exit(1);}
  var msgs=sesMessages(40);
  var out=[];
  recs.forEach(function(rec){
    // candidates: same recipient
    var cands=msgs.filter(function(m){return m.to.indexOf(rec.email)!==-1;});
    // time proximity: |sesTime - createdAt| minimal, within 15 min
    var best=null,bestDt=1e15;
    cands.forEach(function(m){
      var dt=Math.abs(new Date(m.time)-new Date(rec.createdAt));
      if(dt<bestDt){bestDt=dt;best=m;}
    });
    var matched = best && bestDt<=15*60*1000 ? best : null;
    var conf = !matched?'none':(bestDt<=2*60*1000?'high':'time-window');
    // tag confirmation when tags exist
    if(matched && matched.load && String(matched.load)!==String(rec.load)) conf='email-time-only(tag-mismatch)';
    var status='unknown';
    if(matched){
      if(matched.complaint) status='complaint';
      else if(matched.bounceType==='Permanent') status='bounced-permanent';
      else if(matched.bounceType==='Transient') status='bounced-transient';
      else if(matched.delivered) status='delivered';
      else status='sent-no-outcome';
    }
    out.push({hash:rec.hash,email:rec.email,load:rec.load,doctype:rec.doctype,
      createdAt:rec.createdAt,
      senath_deliveryStatus:status,
      senath_deliveredAt:matched&&matched.delivered||null,
      senath_bounceReason:matched&&matched.bounceDiag||null,
      openSeen:matched?!!matched.opened:null,
      matchConfidence:conf});
  });
  fs.writeFileSync(require('path').join(__dirname,'out','seeddrop-delivery.json'),JSON.stringify({generatedAt:new Date().toISOString(),
    cohort:'jrec:regjourney step=pending',n:out.length,rows:out},null,1));
  // aggregates
  var agg={}; out.forEach(function(r){agg[r.senath_deliveryStatus]=(agg[r.senath_deliveryStatus]||0)+1;});
  var opens=out.filter(function(r){return r.openSeen===true;}).length;
  var unmatched=out.filter(function(r){return r.matchConfidence==='none';}).length;
  var people={}; out.forEach(function(r){var p=people[r.email]=people[r.email]||{del:false,open:false,bounce:false};
    if(/^delivered/.test(r.senath_deliveryStatus))p.del=true;
    if(/^bounced/.test(r.senath_deliveryStatus))p.bounce=true;
    if(r.openSeen)p.open=true;});
  var pk=Object.keys(people);
  console.log('=== PER SEND (n='+out.length+') ===');
  Object.keys(agg).sort().forEach(function(k){console.log('  '+k+': '+agg[k]);});
  console.log('  sends with OPEN on the matched message: '+opens);
  console.log('  unmatched to any SES message: '+unmatched);
  console.log('=== PER PERSON (n='+pk.length+') ===');
  console.log('  people with >=1 delivered: '+pk.filter(function(e){return people[e].del;}).length);
  console.log('  people with >=1 bounce:    '+pk.filter(function(e){return people[e].bounce;}).length);
  console.log('  people with >=1 open (matched msgs): '+pk.filter(function(e){return people[e].open;}).length);
  console.log('rows -> ' + require('path').join(__dirname,'out','seeddrop-delivery.json'));
});
