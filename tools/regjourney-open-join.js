var Redis = require('c:/clients/libertyville/node_modules/ioredis');
var sp = require('child_process').spawnSync;

function scanAll(cb){
  var client = new Redis({host:'127.0.0.1',port:16379,db:8,lazyConnect:true});
  var recs=[]; 
  client.connect().then(function(){
    (function loop(cursor){
      client.scan(cursor,'MATCH','jrec:regjourney:*','COUNT','300',function(err,reply){
        if(err){try{client.quit();}catch(e){} return cb(err);}
        var next=reply[0], keys=reply[1]||[]; var pending=keys.length;
        function step(){ if(pending>0) return; if(next==='0'){try{client.quit();}catch(e){} cb(null,recs);} else loop(next); }
        if(!pending) return step();
        keys.forEach(function(k){
          client.hgetall(k,function(e2,h){
            if(!e2&&h){recs.push({email:(h.senath_recipientEmail||'').toLowerCase().trim(),step:h.step||'?',created:(h.senath_createdAt||'').slice(0,10)});}
            pending--; step();
          });
        });
      });
    })('0');
  }).catch(cb);
}
function opensFromSES(days){
  var r=sp('aws',['logs','filter-log-events','--log-group-name','/aws/events/ses-produceflow',
    '--region','us-east-1','--start-time',String(Date.now()-days*86400000),'--output','json'],
    {encoding:'utf8',maxBuffer:128*1024*1024,shell:true});
  var evs=JSON.parse(r.stdout).events||[]; var o={};
  evs.forEach(function(e){var d;try{d=JSON.parse(e.message);}catch(x){return;}
    var det=d.detail||{}; if(det.eventType!=='Open')return;
    ((det.mail||{}).destination||[]).forEach(function(a){o[String(a).toLowerCase().trim()]=true;});});
  return o;
}
scanAll(function(err,recs){
  if(err){console.log('err',err.message);process.exit(1);}
  var openers=opensFromSES(40);
  // per-person: does this email have any 'complete', any 'pending'
  var byEmail={};
  recs.forEach(function(r){ if(!r.email) return;
    var e=byEmail[r.email]=byEmail[r.email]||{complete:false,pending:false,steps:{}};
    e.steps[r.step]=(e.steps[r.step]||0)+1;
    if(r.step==='complete') e.complete=true;
    if(r.step==='pending') e.pending=true;
  });
  var emails=Object.keys(byEmail);
  var pendingPeople=emails.filter(function(e){return byEmail[e].pending && !byEmail[e].complete;});
  var falsePending=emails.filter(function(e){return byEmail[e].pending && byEmail[e].complete;}); // has pending records but DID register
  var openedPending=pendingPeople.filter(function(e){return openers[e];});
  console.log('total regjourney records:            '+recs.length);
  console.log('distinct recipient people:           '+emails.length);
  console.log('');
  console.log('TRULY pending people (pending, never completed): '+pendingPeople.length);
  console.log('  of those, show an OPEN signal:                 '+openedPending.length);
  console.log('  no open signal:                                '+(pendingPeople.length-openedPending.length));
  console.log('');
  console.log('FALSE-pending (have pending records but DID register elsewhere): '+falsePending.length);
  console.log('  -> these inflate a per-record cliff count; regjourney is per-send,');
  console.log('     not closed when the person registers on a different send.');
  console.log('');
  console.log('people who registered (any complete): '+emails.filter(function(e){return byEmail[e].complete;}).length);
});
