import assert from 'node:assert/strict';
import test from 'node:test';
import type {AnimationRendererProps, HostAudioTrackEvent, LessonPlayCommand} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {VB010_CONFIG as c} from './generated/g3-l1-vb010-source';
import {
 createVb010Session as create, synchronizeVb010Session as sync,
 chooseVb010Answer as choose, closeVb010Wrong as close, finishVb010Feedback as finish,
 consumeVb010HostSignals as consume, commitVb010PublicPlay as play,
 type Vb010Session,
} from './g3-l1-vb010-state';
const runtime=(seed=0,frame=75):AnimationRendererProps=>({
 frame,frameDomain:'sprite-255',rootFrame:6,lang:'en',uiLanguage:'es',scenario:'source-static-frame',seed,replay:0,
 lessonPlaybackIdentity:{playbackIdentity:'vb010-page-'+seed,replay:0,seekRevision:0},
 onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,
});
const fresh=(r:AnimationRendererProps)=>create(r.seed,r.replay??0,r.lessonPlaybackIdentity);
const start=(r:AnimationRendererProps,sequence=1):HostAudioTrackEvent=>({
 kind:'accepted-start',sequence,identity:r.lessonPlaybackIdentity!,trackId:c.spanishTrack.id,
 trackSha256:c.spanishTrack.sha256,frameDomain:'sprite-255',sourceFrame:r.frame,
});
const command=(r:AnimationRendererProps,sequence=1):LessonPlayCommand=>({kind:'play',sequence,identity:r.lessonPlaybackIdentity!,frameDomain:'sprite-255',sourceFrame:r.frame});
const snapshot=(s:Vb010Session,frame?:number,revision=1):LessonTextActivitySnapshot=>{
 const id=s.feedback!.id+(s.feedback!.stage==='outro'?'-outro':''),d=c.activities.find(x=>x.id===id)!;
 return {id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,frame:frame??d.endFrame,revision,status:(frame??d.endFrame)===d.endFrame?'completed':'playing',cancellationToken:'clock-owner-'+revision};
};
const selected=(branch:typeof c.branches[number],wrongBefore=0)=>{
 const len=branch.kind==='wrong'?3:4,seed=(c.branches.filter(x=>x.kind===branch.kind).findIndex(x=>x.id===branch.id)-wrongBefore+len)%len,r=runtime(seed);
 const s=choose({...fresh(r),wrongCount:wrongBefore},branch.kind==='wrong'?'top':'middle',r);
 assert.equal(s.feedback!.id,branch.id);return {r,s};
};

test('each source-selected feedback phase resets invisibly, preserving counter and answer lock',()=>{
 let cases=0;
 for(const branch of c.branches)for(const wrongBefore of [0,1]){
  const {r,s}=selected(branch,wrongBefore),d=c.activities.find(x=>x.id===branch.id)!;
  const phases:[Vb010Session,LessonTextActivitySnapshot[]][]=[[s,[snapshot(s,2)]],[{...s,feedbackRevision:7},[snapshot(s,d.endFrame,7)]]];
  if(branch.kind==='wrong'){
   const out=close(s,{...r,lessonActivities:[snapshot(s)]});
   phases.push([out,[snapshot(out,23,2)]],[out,[snapshot(out,undefined,2)]]);
  }
  for(const [state,activities]of phases){
   let requests=0;const context={...r,paused:true,lessonActivities:activities,hostAudioTrackStart:start(r,5),onLessonFrameRequest:()=>{requests++;return true;}};
   const reset=consume(state,context);assert.equal(reset.feedback,null);assert.equal(reset.feedbackRevision,null);assert.equal(reset.focusTarget,null);
   assert.equal(reset.wrongCount,state.wrongCount);assert.equal(reset.answerLocked,true);assert.equal(reset.seed,state.seed);assert.equal(reset.replay,state.replay);assert.equal(context.frame,75);
   assert.equal(reset.pendingResume,null);assert.equal(reset.pendingPlay,null);assert.equal(reset.lastControlSequence,5);assert.equal(requests,0);
   assert.equal(finish(reset,{...context,paused:false}),reset);assert.equal(choose(reset,'middle',{...context,paused:false}),reset);cases++;
  }
 }
 assert.equal(cases,40);
});

test('literal ready/retry/continuing/terminal cases retain their established state on start and terminal events',()=>{
 const cases=[
  {frame:20,count:0,locked:false},{frame:75,count:0,locked:false},{frame:75,count:1,locked:false},
  {frame:75,count:1,locked:true},{frame:75,count:2,locked:true},
  {frame:76,count:0,locked:true},{frame:76,count:1,locked:true},{frame:96,count:2,locked:false},
  {frame:136,count:0,locked:true},{frame:136,count:1,locked:true},{frame:136,count:2,locked:true},{frame:136,count:2,locked:false},
 ];
 for(const item of cases){
  const r=runtime(1,item.frame),s={...fresh(r),wrongCount:item.count,answerLocked:item.locked,focusTarget:'detached-feedback'};
  const accepted=start(r,3),reset=consume(s,{...r,paused:true,hostAudioTrackStart:accepted});
  assert.equal(reset.wrongCount,item.count);assert.equal(reset.answerLocked,item.locked);assert.equal(reset.focusTarget,null);assert.equal(reset.pendingResume,null);
  for(const kind of ['ended','stop','error','cancelled']as const){
   let jumps=0;const ended={...r,paused:false,hostAudioTrackStart:accepted,hostAudioTrackEvent:{...accepted,kind},onLessonFrameRequest:()=>{jumps++;return true;}};
   assert.equal(consume(reset,ended),reset);assert.equal(play(reset,ended),reset);assert.equal(jumps,0);assert.equal(ended.frame,item.frame);
  }
 }
});

test('only exact accepted-start for current page/replay/seek/frame/track and increasing sequence may reset',()=>{
 const r=runtime(),s=choose(fresh(r),'top',r),good=start(r,7);
 const invalid:HostAudioTrackEvent[]=[
  {...good,kind:'ended'},{...good,kind:'error'},{...good,trackId:'another-track'},
  {...good,trackSha256:'0'.repeat(64)},{...good,frameDomain:'root'},{...good,sourceFrame:74},
  {...good,identity:{...good.identity,playbackIdentity:'successor-page'}},
  {...good,identity:{...good.identity,replay:1}},{...good,identity:{...good.identity,seekRevision:1}},
  {...good,sequence:0},{...good,sequence:-1},{...good,sequence:1.5},{...good,sequence:NaN},
 ];
 for(const event of invalid)assert.equal(consume(s,{...r,hostAudioTrackStart:event}),s);
 for(const delta of [{lang:'es'},{scenario:'capture'},{entryStateSha256:'capture'},{rootFrame:5},{frameDomain:'root'},{seed:1},{replay:1},{frame:0},{frame:136.5},{lessonPlaybackIdentity:undefined}])assert.equal(consume(s,{...r,...delta,hostAudioTrackStart:good}as AnimationRendererProps),s);
 const reset=consume(s,{...r,hostAudioTrackStart:good});
 assert.equal(consume(reset,{...r,hostAudioTrackStart:good}),reset);
 assert.equal(consume(reset,{...r,hostAudioTrackStart:{...good,sequence:6}}),reset);
 // An invalid high sequence cannot suppress a later valid lower sequence.
 assert.equal(consume(s,{...r,hostAudioTrackStart:{...good,sequence:999,trackId:'wrong'}}),s);
 assert.equal(consume(s,{...r,hostAudioTrackStart:good}).lastControlSequence,7);
});

test('ordinary pause and terminal-only signals do not reset, complete, or unlock feedback',()=>{
 const r=runtime(),s=choose(fresh(r),'top',r),event=start(r);
 for(const paused of [true,false]){
  assert.equal(consume(s,{...r,paused}),s);
  for(const kind of ['ended','stop','error','cancelled']as const)assert.equal(consume(s,{...r,paused,hostAudioTrackEvent:{...event,kind}}),s);
 }
 const reset=consume(s,{...r,paused:true,hostAudioTrackStart:event,hostAudioTrackEvent:{...event,kind:'error'}});
 assert.equal(reset.feedback,null);assert.equal(reset.answerLocked,true);assert.equal(reset.wrongCount,1);
 assert.equal(consume(reset,{...r,paused:false,hostAudioTrackStart:event,hostAudioTrackEvent:{...event,kind:'error'}}),reset);
});

test('shared sequence orders same-batch public Play and Spanish start without racing a stale continuation',()=>{
 const r=runtime(),s=choose(fresh(r),'top',r);let requests:unknown[]=[];
 const requested={...r,onLessonFrameRequest:(x:unknown)=>{requests.push(x);return true;}};
 // Play happened first but has not reached the source clock: newer start retires it.
 const newerStart=consume(s,{...requested,lessonPlayCommand:command(r,3),hostAudioTrackStart:start(r,4)});
 assert.equal(newerStart.pendingPlay,null);assert.equal(newerStart.lastControlSequence,4);assert.equal(play(newerStart,requested),newerStart);assert.equal(requests.length,0);
 // Later explicit Play is a separate source-supported escape.
 const newerPlay=consume(s,{...requested,hostAudioTrackStart:start(r,3),lessonPlayCommand:command(r,4)});
 assert.equal(newerPlay.pendingPlay!.sequence,4);assert.equal(newerPlay.answerLocked,true);
 const committed=play(newerPlay,requested);assert.equal(committed.pendingResume,76);assert.equal(committed.pendingPlay,null);
 assert.deepEqual(requests,[{fromFrame:75,toFrame:76,stopFrame:136}]);
 // Duplicate retained props neither reset that commit nor request a second jump.
 assert.equal(consume(committed,{...requested,hostAudioTrackStart:start(r,3),lessonPlayCommand:command(r,4)}),committed);
 assert.equal(play(committed,requested),committed);assert.equal(requests.length,1);
 // Terminal events cannot allocate a command or change the control order.
 assert.equal(consume(committed,{...requested,hostAudioTrackEvent:{...start(r,4),kind:'ended'}}),committed);
});

test('Spanish resets uncommitted Play but preserves already accepted correct76 and wrong96',()=>{
 for(const target of [76,96]){
  const r=runtime(),base=choose(fresh(r),target===76?'middle':'top',r);
  let s=target===96?close({...base,wrongCount:2},{...r,lessonActivities:[snapshot(base)]}):base;
  s=finish(s,{...r,lessonActivities:[snapshot(s,undefined,2)]});assert.equal(s.pendingResume,target);
  // The host accepted the frame request; the DOM can still be on75 this turn.
  const reset=consume(s,{...r,hostAudioTrackStart:start(r,4)});assert.equal(reset.pendingResume,target);assert.equal(reset.answerLocked,target===76);assert.equal(reset.wrongCount,s.wrongCount);
  assert.equal(consume(reset,{...r,lessonPlayCommand:command(r,5)}).pendingResume,target);
  const advanced=sync(reset,{...r,frame:target});assert.equal(advanced.pendingResume,null);assert.equal(advanced.wrongCount,s.wrongCount);assert.equal(advanced.answerLocked,target===76);
  assert.equal(consume(advanced,{...r,frame:target,hostAudioTrackStart:start(r,4)}),advanced);
  const currentStart=start({...r,frame:target},6);assert.equal(consume(advanced,{...r,frame:target,hostAudioTrackStart:currentStart}).pendingResume,null);
 }
 const r=runtime(),pending=consume(fresh(r),{...r,lessonPlayCommand:command(r,1)});
 assert(pending.pendingPlay);assert.equal(consume(pending,{...r,hostAudioTrackStart:start(r,2)}).pendingPlay,null);
});

test('public Play uses only declared75-to76, preserves lock/count, and consumes a refused request',()=>{
 for(const count of [0,1,2])for(const answerLocked of [false,true]){
  const r=runtime(),s={...fresh(r),wrongCount:count,answerLocked};let requests=0;
  const pending=consume(s,{...r,lessonPlayCommand:command(r,9)});
  assert.equal(play(pending,{...r,paused:true,onLessonFrameRequest:()=>{requests++;return true;}}),pending);assert.equal(requests,0);
  const accepted=play(pending,{...r,onLessonFrameRequest:x=>{requests++;assert.deepEqual(x,{fromFrame:75,toFrame:76,stopFrame:136});return true;}});
  assert.equal(accepted.pendingResume,76);assert.equal(accepted.wrongCount,count);assert.equal(accepted.answerLocked,answerLocked);assert.equal(requests,1);
  const refused=play(pending,{...r,onLessonFrameRequest:()=>false});assert.equal(refused.pendingPlay,null);assert.equal(refused.pendingResume,null);assert.equal(refused.wrongCount,count);assert.equal(refused.answerLocked,answerLocked);
  assert.equal(play(consume(refused,{...r,lessonPlayCommand:command(r,9)}),r),refused);
 }
 for(const frame of [1,74,76,96,136]){const r=runtime(0,frame);const next=consume(fresh(r),{...r,lessonPlayCommand:command(r)});assert.equal(next.pendingPlay,null);assert.equal(play(next,r),next);}
});

test('Replay, next-page and seek identities clear owned state; retained old events remain stale',()=>{
 const r=runtime(),s=consume(choose(fresh(r),'top',r),{...r,hostAudioTrackStart:start(r,5)});
 const contexts=[
  {...r,replay:1,lessonPlaybackIdentity:{...r.lessonPlaybackIdentity!,replay:1}},
  {...r,lessonPlaybackIdentity:{...r.lessonPlaybackIdentity!,playbackIdentity:'vb010-next-page'}},
  {...r,lessonPlaybackIdentity:{...r.lessonPlaybackIdentity!,seekRevision:1}},
 ];
 for(const next of contexts){
  const reset=sync(s,next);assert.equal(reset.wrongCount,0);assert.equal(reset.answerLocked,false);assert.equal(reset.lastControlSequence,0);
  assert.equal(consume(reset,{...next,hostAudioTrackStart:start(r,6),lessonPlayCommand:command(r,7)}),reset);
 }
 const before=sync(s,{...r,frame:20});assert.equal(before.wrongCount,0);assert.equal(before.answerLocked,false);assert.equal(before.lastControlSequence,5);
 assert.equal(consume(before,{...r,hostAudioTrackStart:start(r,5)}),before);
});
