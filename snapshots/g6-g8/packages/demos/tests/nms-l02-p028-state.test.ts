import assert from 'node:assert/strict';
import test from 'node:test';
import {getNmsL2P028FrameState as state,p028CanOpenTerm,p028SourceFrameAtMilliseconds,p028FrameAtMilliseconds,P028_ID} from '../src/nms-l02-p028-timeline-v1';
import {p028TextSnapshot} from '../src/nms-l02-p028-text-v1';
import {createP028TermHost,P028_TERM_ENTRIES} from '../src/nms-l02-p028-term-host-v1';
const context={seed:0,lang:'en' as const};
test('P028 preserves root10 and child199, with strict local query identity',()=>{
  assert.equal(state(5,{...context,frameDomain:'root'}).mainFrame,null);
  assert.equal(state(6,{...context,frameDomain:'root'}).mainFrame,1);
  assert.equal(state(10,{...context,frameDomain:'root'}).mainFrame,5);
  assert.equal(state(199,context).rootFrame,6);
  for(const frame of[0,-1,1.5,200,NaN,Infinity])assert.throws(()=>state(frame,context));
  for(const frameDomain of['sprite-207','29','__proto__','sprite-029'])assert.throws(()=>state(1,{...context,frameDomain}));
  assert.throws(()=>state(11,{...context,frameDomain:'root'}));
  assert.throws(()=>state(1,{...context,rootFrame:1}));
  for(const seed of[-1,1.5,2**32,NaN])assert.throws(()=>state(1,{...context,seed}));
  assert.throws(()=>state(1,{...context,replay:-1}));
  assert.equal(p028SourceFrameAtMilliseconds(199/12*1000),1);
  assert.equal(p028FrameAtMilliseconds(199/12*1000),199);
  assert.equal(p028FrameAtMilliseconds(198/12*1000),199);
  assert.equal(p028FrameAtMilliseconds(0),1);
});
test('P028 source masks reveal exact text, and no complete line appears early',()=>{
  const expected=['A decimal is a special fraction that has either 10 or a power of 10','equal parts in the whole.','Decimals are written with a decimal point and include place values less than ','one to the right of the decimal point.  '];
  const completion=[84,102,168,197];
  for(let i=0;i<4;i++){
    const before=state(completion[i]-1,context).lines[i].runs.map(r=>r.visiblePrefix).join('');
    const after=state(completion[i],context).lines[i].runs.map(r=>r.visiblePrefix).join('');
    assert.notEqual(before.trimEnd(),expected[i].trimEnd());assert.equal(after.trimEnd(),expected[i].trimEnd());
  }
  assert(state(9,context).lines.every(l=>l.runs.every(r=>r.fractions.every(v=>v===0))));
  assert(state(10,context).lines[0].runs[0].fractions[0]>0);
  for(let frame=1;frame<=199;frame++)for(const lang of['en','es']as const){
    const s=state(frame,{seed:4294967295,lang,replay:2});
    assert.equal(p028TextSnapshot(s).status,'ready');
    assert(Object.isFrozen(s)&&Object.isFrozen(s.lines));
    s.lines.forEach((l,i)=>{
      assert.equal(l.runs.map(r=>r.text).join(''),expected[i]);
      for(const r of l.runs)assert(r.fractions.every(v=>Number.isFinite(v)&&v>=0&&v<=1));
    });
    assert.equal(s.gridAlpha,frame<=64?0:frame>=70?1:s.gridAlpha);
    if(frame>=65&&frame<70)assert(s.gridAlpha>0&&s.gridAlpha<1);
  }
});
test('all six source glossary links reject premature, forged and unrelated requests',()=>{
  for(const id of Object.values(P028_TERM_ENTRIES)){
    const first=Array.from({length:199},(_,i)=>i+1).find(frame=>p028CanOpenTerm(state(frame,context),id))!;
    assert(first>1&&first<=199);
    const host=createP028TermHost();
    const request={type:'open-keyterm' as const,entryId:id,sourceAnimationId:P028_ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume' as const};
    assert.equal(host.dispatch(request,state(first-1,context)).status,'blocked');
    assert.equal(host.dispatch(request,state(first,context)).status,'allowed');
    assert.equal(host.dispatch({type:'close-keyterm'},state(first,context)).status,'allowed');
    assert.equal(host.dispatch({...request,sourceAnimationId:'shared-nms002-l02-p027'},state(199,context)).status,'blocked');
    assert.equal(host.dispatch({...request,entryId:'__proto__'},state(199,context)).status,'blocked');
    assert.equal(host.dispatch({...request,playbackDisposition:'reversible-support-pause'},state(199,context)).status,'blocked');
    assert.equal(host.dispatch(request,state(10,{...context,frameDomain:'root'})).status,'blocked');
    assert.equal(host.dispatch(request,state(1,{...context,replay:1})).status,'blocked');
  }
  const equal=state(199,context).lines[1].runs[0];
  assert.equal(equal.text,'equal');assert.equal(equal.termId,'equivalent');
});
