/** Actual native-audio and real My Lesson case validator for P025. No browser or registration writes. */
import assert from 'node:assert/strict';
const audio={main:{sha:'e6122c6402e0000f810b82a6f91b76b50a918a44b75709194b2cec3834a201c4',pcm:'251b3141cd0879bf22ab82ab81df9c071d313e438098a049df02212cf848a93a',bytes:123500,rate:22050,samples:547200},sa:{sha:'295dcabe0549764ffe03ecc4e6a332a5cb85d05329095be079ad32bdac6a044e',pcm:'3dd78ab1d3e31085d8f7cc93403f1ff84ef70f42c93d26f2b8c43b48bad6789c',bytes:173040,rate:48000,samples:593280}};
export function validateP025NativeTrace(trace){
 const buffers=new Map(),nodes=new Map(),contexts=new Map(),intervals=[];
 for(const e of trace.events){
  const ckey=`${e.documentId}:${e.contextId}`,nkey=`${ckey}:${e.nodeId}`;
  if(e.kind==='context-created')contexts.set(ckey,{closed:false});
  if(e.kind==='context-close-resolved')contexts.get(ckey).closed=true;
  if(e.kind==='decode-resolved'){
   const spec=Object.values(audio).find(x=>x.sha===e.sourceSha256);assert(spec,'exact source recording');
   assert.deepEqual([e.inputBytes,e.pcmSha256,e.sampleRate,e.samples,e.channels],[spec.bytes,spec.pcm,spec.rate,spec.samples,1]);
   buffers.set(`${ckey}:${e.decodeId}`,spec);
  }
  if(e.kind==='source-start'){
   assert.equal(e.accepted,true);const spec=buffers.get(`${ckey}:${e.decodeId}`);assert(spec,'decoded node identity');
   // The transport samples currentTime before scheduling start(); the observer
   // captures currentTime inside the start() wrapper, possibly quanta later.
   const startSlack=4*128/spec.rate;
   assert(Number.isFinite(e.contextTime)&&Number.isFinite(e.args[0])&&
    e.args[0]>=0&&e.args[0]>=e.contextTime-startSlack-1e-9&&
    e.args[1]>=0&&e.args[1]<spec.samples/spec.rate,
    'bounded native start scheduling');
   if(spec===audio.sa)assert.equal(e.args[1],0);
   else{const frame=Number(e.player.p025PlayerFrame),sample=e.args[1]*spec.rate;
    const lower=1673+Math.max(0,frame-2)*22050/12,upper=1673+Math.max(0,frame+1-2)*22050/12;
    assert(sample>=lower-1e-6&&sample<=upper+1e-6,'held source frame and sample offset agree');
    if(frame===1){
     assert(Math.abs(sample-1673)<1e-6);
     const observedPreroll=e.args[0]-e.contextTime;
     assert(observedPreroll>=1/12-4*128/spec.rate-1e-8&&
      observedPreroll<=1/12+1e-8,'bounded first-frame preroll');
    }
   }
   const row={node:nkey,role:spec===audio.sa?'sa':'main',documentId:e.documentId,start:e.performanceMs+(e.args[0]-e.contextTime)*1000,end:null,startEvent:e,nativeEnded:false,manuallyRetired:false};nodes.set(nkey,row);intervals.push(row);
  }
  if(['source-stop','source-disconnect','source-ended'].includes(e.kind)&&nodes.has(nkey)){
   const row=nodes.get(nkey);if(e.kind==='source-stop')assert(e.args.length===0||e.args[0]<=e.contextTime,'future stop is not immediate retirement');
   if(row.end===null)row.end=e.performanceMs;
   if(e.kind==='source-stop'||e.kind==='source-disconnect')row.manuallyRetired=true;
   if(e.kind==='source-ended'&&e.hasHandler){
    assert(!row.manuallyRetired,'premature manual retirement cannot prove natural EOF');
    row.nativeEnded=true;const spec=buffers.get(`${ckey}:${row.startEvent.decodeId}`);
    const actual=e.contextTime-row.startEvent.args[0],expected=spec.samples/spec.rate-row.startEvent.args[1];
    assert(actual>=expected-1/spec.rate&&actual<=expected+4*128/spec.rate+0.01,'bounded natural EOF callback timing');
   }
  }
 }
 for(const row of intervals)assert(row.end!==null,'node retired before terminal snapshot');
 for(let i=0;i<intervals.length;i++)for(let j=i+1;j<intervals.length;j++){
  const a=intervals[i],b=intervals[j];if(a.documentId!==b.documentId)continue;
  assert(Math.max(a.start,b.start)>=Math.min(a.end,b.end)-0.1,'main/SA native node nonoverlap');
 }
 return {decoded:buffers.size,starts:intervals.length,naturalMainEof:intervals.filter(x=>x.role==='main'&&x.nativeEnded).length,naturalSaEof:intervals.filter(x=>x.role==='sa'&&x.nativeEnded).length,contexts:[...contexts.values()]};
}

export function validateP025EngineeringCases(cases){
const traces={};
for(const [locale,flows] of Object.entries({en:cases.en,es:cases.es})){
 for(const [name,flow] of Object.entries(flows)){
  assert.deepEqual(flow.errors,[]);assert.deepEqual(flow.consoleErrors,[]);traces[`${locale}.${name}`]=validateP025NativeTrace(flow.observer);
 }
 const r=flows.ready;assert.equal(r.status,200);assert(r.robots.includes('noindex'));
 assert.deepEqual([r.player.p025PlayerPhase,r.player.p025PlayerFrame,r.player.p025SaPhase],['ready','1','idle']);
 assert(!r.observer.events.some(e=>e.kind==='source-start'));assert.equal(traces[`${locale}.ready`].decoded,1);
 const n=flows.natural,final=n.stages.find(s=>s.label==='natural299');
 assert.deepEqual([final.player.p025PlayerPhase,final.player.p025PlayerFrame,final.suppressed],['timeline-ended','299','5,15']);
 assert(final.native[0].includes('The independent variable is the variable for the domain.'));
 const terms=n.stages.filter(s=>s.label.startsWith('glossary-'));assert.equal(terms.length,4);
 for(const t of terms){assert.equal(t.before.p025PlayerFrame,t.after.p025PlayerFrame);assert.equal(t.after.p025PlayerPhase,'timeline-ended');assert(t.text.length>40);assert.equal(t.focused,t.label.slice(9));}
 const replay=n.stages.find(s=>s.label==='replay-ready');assert.deepEqual([replay.player.p025PlayerFrame,replay.player.p025PlayerPhase],['1','ready']);
 assert(traces[`${locale}.natural`].naturalMainEof>=1);
}
const paused=cases.en.paused.stages;assert.equal(paused.filter(s=>s.focusReturned).length,3);
for(const t of paused.filter(s=>s.focusReturned))assert.equal(t.frame,t.held);
const sa=cases.en.sa.stages,at=label=>sa.find(s=>s.label===label).player;
assert.equal(at('sa-eof-hold').p025SaPhase,'ended');assert.equal(at('sa-eof-hold').p025AudioOwner,'spanish');
assert.equal(at('sa-started').p025PlayerFrame,at('sa-eof-hold').p025PlayerFrame);assert.equal(at('sa-eof-hold').p025PlayerFrame,at('sa-eof-still-held').p025PlayerFrame);
assert.equal(at('explicit-return-main').p025AudioOwner,'main');assert.equal(at('natural-main299').p025PlayerFrame,'299');
assert.equal(traces['en.sa'].naturalSaEof,1);assert(traces['en.sa'].naturalMainEof>=1);
assert.notEqual(cases.lifecycle.failed,true,'complete fresh lifecycle');assert.deepEqual(cases.lifecycle.errors,[]);assert.deepEqual(cases.lifecycle.consoleErrors,[]);
assert(cases.lifecycle.cancelled.intercepted);assert.deepEqual([cases.lifecycle.cancelled.player.p025PlayerFrame,cases.lifecycle.cancelled.player.p025SaPhase,cases.lifecycle.cancelled.player.p025PlayerPhase],['1','idle','ready']);
assert.equal(cases.lifecycle.reflow.viewport,390);assert(cases.lifecycle.reflow.scrollWidth<=390);assert.equal(cases.lifecycle.reflow.rootFont,'32px');assert.equal(cases.lifecycle.reflow.reducedMotion,true);
assert(cases.lifecycle.previous.ready&&cases.lifecycle.previous.p025Absent&&cases.lifecycle.returned.ready);
const lifecycle=validateP025NativeTrace(cases.lifecycle.observer);assert.equal(lifecycle.naturalSaEof,0);assert(!cases.lifecycle.observer.events.some(e=>e.kind==='decode-resolved'&&e.sourceSha256===audio.sa.sha));
assert.equal(lifecycle.contexts.filter(c=>!c.closed).length,1);traces.lifecycle=lifecycle;
assert(cases.http.rows.length===15&&cases.http.rows.every(r=>r.expected===r.status));

return traces;
}
