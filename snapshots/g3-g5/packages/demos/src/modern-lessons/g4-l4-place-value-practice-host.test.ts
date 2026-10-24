import assert from'node:assert/strict';import test from'node:test';
import{createPracticeSession,synchronizePracticeSession,dispatchPractice,practiceFrameControl}from'./g4-l4-place-value-practice-host';
import{createPlaceValuePractice,advancePlaceValuePractice}from'./g4-l4-place-value-practice-state';
import{lessonTextFrameRequestAllowed,validateLessonTextFrameControl}from'../lesson-text-frame-control';
const specs=[{poolSize:6 as const,initialQuestionFrame:120,frameCount:125,frameDomain:'sprite-64'},{poolSize:7 as const,initialQuestionFrame:135,frameCount:142,frameDomain:'sprite-72'},{poolSize:6 as const,initialQuestionFrame:149,frameCount:154,frameDomain:'sprite-69'}];
for(const c of specs){
 test(c.frameDomain+' commits only accepted exact edges; pool survives observed source frames',()=>{
  const control=practiceFrameControl(c);validateLessonTextFrameControl(control,c.frameCount);let frame=c.initialQuestionFrame,s=createPracticeSession(17),pending:number|null=null,accepted=0;
  const r=()=>({frame,frameDomain:c.frameDomain,rootFrame:6,seed:17,replay:0,lang:'en' as const,scenario:'source-static-frame',onLessonFrameRequest:(edge:any)=>{if(!lessonTextFrameRequestAllowed(control,edge,{frame,frameDomain:c.frameDomain,capture:false}))return false;pending=edge.toFrame;accepted++;return true;}});
  let expected=createPlaceValuePractice(c,17);s=dispatchPractice(c,s,'enter',r());assert.deepEqual(s.practice,expected);assert.equal(accepted,1);assert.equal(dispatchPractice(c,s,'enter',r()),s);
  for(let n=0;n<200;n++){
   assert(pending!==null);frame=pending!;s=synchronizePracticeSession(c,s,r());assert.equal(s.pendingFrame,null);assert.deepEqual(s.practice,expected);
   const denied=dispatchPractice(c,s,'new-problem',{...r(),onLessonFrameRequest:()=>false});assert.equal(denied,s);assert.equal(dispatchPractice(c,s,'new-problem',{...r(),paused:true}),s);
   expected=advancePlaceValuePractice(c,expected);const next=dispatchPractice(c,s,'new-problem',r());assert.deepEqual(next.practice,expected);if(next.pendingFrame)assert.equal(dispatchPractice(c,next,'new-problem',r()),next);s=next;
  }
  assert.equal(accepted,201);assert(!control.transitions.some(e=>e.toFrame>c.initialQuestionFrame+c.poolSize-1));
 });
 test(c.frameDomain+' rejects unsupported contexts, seeks and stale Replay state',()=>{
  const base={frame:c.initialQuestionFrame,frameDomain:c.frameDomain,rootFrame:6,seed:17,replay:0,lang:'en' as const,scenario:'source-static-frame',onLessonFrameRequest:()=>true},s=createPracticeSession(17);
  for(const extra of [{frame:c.initialQuestionFrame-1},{frame:c.initialQuestionFrame+1},{paused:true},{rootFrame:1},{frameDomain:'root'},{seed:18},{replay:1},{lang:'es'},{scenario:'wrong'},{entryStateSha256:'capture'},{onLessonFrameRequest:undefined},{onLessonFrameRequest:()=>false}])assert.equal(dispatchPractice(c,s,'enter',{...base,...extra}as any),s);
  const ready=dispatchPractice(c,s,'enter',base),seen=synchronizePracticeSession(c,ready,{...base,frame:ready.practice!.frame});assert(seen.practice);assert.equal(synchronizePracticeSession(c,seen,{...base,frame:1}).practice,null);const replay=synchronizePracticeSession(c,seen,{...base,replay:1,frame:1});assert.equal(replay.practice,null);assert.equal(replay.replay,1);
 });
}
