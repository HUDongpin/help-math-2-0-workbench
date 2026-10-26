/** Maintained validator for P024's observed browser AudioContext events.
 * This consumes raw observer snapshots, not player dataset flags. It does not
 * certify audible content, source Flash parity, or a trusted user gesture. */
import assert from 'node:assert/strict';

const key=(contextId,nodeId)=>`${contextId}:${nodeId}`;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const approx=(a,b,tolerance=0.025)=>Math.abs(a-b)<=tolerance;

export function validateNativeAudioTrace(observer,plan,{ready=false}={}){
 assert(observer&&typeof observer.documentId==='string'&&Array.isArray(observer.events),
  'raw observer snapshot required');
 const expected=new Map(plan.domains.map(row=>[row.extractedMp3.sha256,{
  id:row.id,bytes:row.extractedMp3.bytes,rate:row.ffmpegDecode.sampleRate,
  samples:row.declaredSamples,channels:row.ffmpegDecode.channels}]));
 const sa=plan.optionalSpanishAudio;
 expected.set(sa.asset.sha256,{id:'separate-sa',bytes:sa.asset.bytes,
  rate:sa.ffmpegDecode.sampleRate,samples:sa.ffmpegDecode.samples,
  channels:sa.ffmpegDecode.channels});
 const contexts=new Map(),calls=new Map(),resolved=new Map(),nodes=new Map(),active=new Map();
 const events=observer.events;
 let lastMs=-Infinity;
 for(const [index,e] of events.entries()){
  assert.equal(e.documentId,observer.documentId,`event ${index} document`);
  assert(finite(e.performanceMs)&&e.performanceMs>=lastMs,`event ${index} order`);
  lastMs=e.performanceMs;
  if(e.kind==='context-created'){
   assert(!contexts.has(e.contextId),`context ${e.contextId} unique`);
   assert([22050,48000].includes(e.sampleRate),`context ${e.contextId} rate`);
   contexts.set(e.contextId,{rate:e.sampleRate,closed:false});
  }else if(e.kind==='decode-call'){
   const dk=key(e.contextId,e.decodeId);
   assert(contexts.has(e.contextId)&&!calls.has(dk),`decode ${dk} call`);
   calls.set(dk,{index,bytes:e.inputBytes});
  }else if(e.kind==='decode-resolved'){
   const dk=key(e.contextId,e.decodeId),call=calls.get(dk),spec=expected.get(e.sourceSha256);
   assert(call&&!resolved.has(dk)&&spec,`decode ${dk} source identity`);
   assert.deepEqual([e.inputBytes,call.bytes,e.sampleRate,e.samples,e.channels],
    [spec.bytes,spec.bytes,spec.rate,spec.samples,spec.channels],`decode ${dk} browser metadata`);
   assert.equal(contexts.get(e.contextId).rate,spec.rate,`decode ${dk} context rate`);
   assert(typeof e.pcmSha256==='string'&&/^[0-9a-f]{64}$/.test(e.pcmSha256),
    `decode ${dk} observed browser PCM hash`);
   resolved.set(dk,{...spec,index,sourceSha256:e.sourceSha256,pcmSha256:e.pcmSha256});
  }else if(e.kind==='decode-failed'||e.kind.endsWith('-failed')){
   assert.fail(`native audio failure ${e.kind} at ${index}`);
  }
 }
 const starts=[],ends=[];
 for(const [index,e] of events.entries()){
  const context=contexts.get(e.contextId);
  if(e.contextId!==undefined)assert(context,`event ${index} context exists`);
  if(e.kind==='source-created'){
   const nk=key(e.contextId,e.nodeId);
   assert(!nodes.has(nk)&&!context.closed,`node ${nk} unique/open`);
   nodes.set(nk,{contextId:e.contextId,nodeId:e.nodeId,started:false,retired:false});
  }else if(e.kind==='source-start'){
   const nk=key(e.contextId,e.nodeId),node=nodes.get(nk),
    decode=resolved.get(key(e.contextId,e.decodeId));
   assert(node&&!node.started&&decode&&e.accepted===true,`start ${nk} decoded and accepted`);
   assert(calls.get(key(e.contextId,e.decodeId)).index<index,`start ${nk} after decode call`);
   assert(Array.isArray(e.args)&&e.args.length>=2&&finite(e.args[0])&&finite(e.args[1])&&
    finite(e.contextTime)&&e.args[0]>=e.contextTime-0.05&&
    e.args[1]>=0&&e.args[1]<decode.samples/decode.rate,
    `start ${nk} time/offset`);
   for(const [otherKey,other] of active){
    // A stop scheduled in the future does not end ownership when stop() is called.
    if(other.contextId===e.contextId&&finite(other.scheduledStop)&&
     other.scheduledStop<=e.contextTime+0.0001)active.delete(otherKey);
   }
   assert.equal(active.size,0,`overlapping live audio source at ${nk}`);
   assert(decode.id==='separate-sa'
    ? e.player?.p024SaPhase==='loading'||e.player?.p024SaPhase==='playing'
    : e.player?.p024SaPhase==='idle',`start ${nk} SA ownership`);
   if(decode.id!=='sprite-208'&&decode.id!=='separate-sa')
    assert(e.player?.p024Phase==='feedback'&&e.player?.p024MainFrame==='154',
     `feedback ${nk} quiz state`);
   node.started=true;node.decode=decode;node.start=e;
   active.set(nk,node);starts.push({index,event:e,id:decode.id});
  }else if(e.kind==='source-stop'){
   const nk=key(e.contextId,e.nodeId),node=nodes.get(nk);
   assert(node&&node.started&&e.accepted===true,`stop ${nk} accepted`);
   if(active.has(nk)){
    const when=e.args?.length?e.args[0]:e.contextTime;
    assert(finite(when)&&finite(e.contextTime),`stop ${nk} time`);
    if(when<=e.contextTime+0.0001){node.retired=true;node.retiredAt=e;active.delete(nk);}
    else node.scheduledStop=when;
   }
  }else if(e.kind==='source-disconnect'||e.kind==='source-ended'){
   const nk=key(e.contextId,e.nodeId),node=nodes.get(nk);
   assert(node&&node.started,`${e.kind} ${nk} known`);
   if(e.kind==='source-disconnect')assert.equal(e.accepted,true,`disconnect ${nk} accepted`);
   node.retired=true;node.retiredAt=e;active.delete(nk);
   if(e.kind==='source-ended')ends.push({index,event:e,id:node.decode.id});
  }else if(e.kind==='context-close-resolved'){
   assert(!context.closed,`context ${e.contextId} one close`);
   for(const node of active.values())assert.notEqual(node.contextId,e.contextId,
    `context ${e.contextId} closed with active source`);
   context.closed=true;
  }
 }
 assert.equal(calls.size,resolved.size,'all native decodes resolved');
 if(ready){
  assert.equal(contexts.size,1,'ready one main context');
  assert.equal(resolved.size,8,'ready eight independent domain decodes');
  assert.equal(starts.length,0,'ready never autoplays');
  assert.deepEqual([...resolved.values()].map(x=>x.id).sort(),plan.domains.map(x=>x.id).sort(),
   'ready exact eight source domains');
 }
 return {documentId:observer.documentId,eventCount:events.length,
  decodes:[...resolved.values()].map(x=>({id:x.id,sha256:x.sourceSha256,
   browserPcmSha256:x.pcmSha256})),starts,ends,contexts};
}

export function validateP024NativeAudioEvidence({ready,sa,correct},plan){
 const readyTrace=validateNativeAudioTrace(ready.observer,plan,{ready:true});
 const saTrace=validateNativeAudioTrace(sa.observer,plan);
 const correctTrace=validateNativeAudioTrace(correct.observer,plan);
 for(const later of [saTrace,correctTrace])if(later.documentId===readyTrace.documentId){
  assert.deepEqual((later===saTrace?sa:correct).observer.events.slice(0,readyTrace.eventCount),
   ready.observer.events,'same-document ready event prefix');
 }
 const saStarts=saTrace.starts.filter(x=>x.id==='separate-sa');
 assert.equal(saStarts.length,1,'one explicit SA stream in SA scenario');
 assert(saTrace.ends.some(x=>x.id==='separate-sa'&&x.index>saStarts[0].index),
  'SA reaches native ended event');
 const saNode=saStarts[0].event;
 assert(!sa.observer.events.some((e,i)=>i>saStarts[0].index&&
  e.kind==='source-stop'&&e.contextId===saNode.contextId&&e.nodeId===saNode.nodeId&&
  i<saTrace.ends.find(x=>x.id==='separate-sa').index),
  'SA EOF was not a manual stop');
 const close=sa.observer.events.findIndex((e,i)=>i>saStarts[0].index&&
  e.kind==='context-close-resolved'&&e.contextId===saNode.contextId);
 assert(close>saTrace.ends.find(x=>x.id==='separate-sa').index,
  'SA context closes after natural EOF');
 const priorMain=saTrace.starts.filter(x=>x.id==='sprite-208'&&x.index<saStarts[0].index).at(-1);
 const returnMain=saTrace.starts.find(x=>x.id==='sprite-208'&&x.index>close);
 assert(priorMain&&returnMain,'main source before and after SA');
 const stop=sa.observer.events.find((e,i)=>i>priorMain.index&&i<saStarts[0].index&&
  e.kind==='source-stop'&&e.contextId===priorMain.event.contextId&&
  e.nodeId===priorMain.event.nodeId&&e.args.length===0);
 assert(stop,'main source stopped before SA');
 const held=priorMain.event.args[1]+Math.max(0,stop.contextTime-priorMain.event.args[0]);
 assert(approx(returnMain.event.args[1],held),`main resumes held offset ${held}`);
 assert.equal(sa.observer.events[returnMain.index].player?.p024SaPhase,'idle',
  'main only returns after SA close');
 const feedback=correctTrace.starts.filter(x=>x.id.startsWith('sprite-')&&
  x.id!=='sprite-208');
 assert.equal(feedback.length,1,'correct scenario has one native feedback start');
 assert(['sprite-123','sprite-155','sprite-188','sprite-196'].includes(feedback[0].id),
  'correct answer selects a right-feedback source');
 assert(correctTrace.starts.some(x=>x.id==='sprite-208'&&x.index>feedback[0].index&&
  x.event.args[1]>12),'correct feedback resumes held main after quiz');
 return {ready:readyTrace.eventCount,sa:saTrace.eventCount,
  correct:correctTrace.eventCount,heldMainSeconds:held,
  returnMainSeconds:returnMain.event.args[1],correctFeedback:feedback[0].id,
  limitation:'Observer proves AudioContext calls/decoded bytes only; it does not prove an actual user gesture, audibility or original Flash behavior.'};
}
