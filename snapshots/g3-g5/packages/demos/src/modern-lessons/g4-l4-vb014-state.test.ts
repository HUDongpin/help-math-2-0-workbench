import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {VB014_CARDS,VB014_FEEDBACK_TIMELINES as definitions,VB014_FRAME_CONTROL,
  createVb014Session,bindVb014Children,synchronizeVb014Session,dispatchVb014,reduceVb014} from './g4-l4-vb014-state';

const root=process.env.VB014_SOURCE_ROOT!;
assert(root,'VB014_SOURCE_ROOT must name the source worktree');
const load=(name:string)=>import(pathToFileURL(path.join(root,'packages/demos/src',name+'.ts')).href);
const context=(extra={})=>({frame:139,frameDomain:'sprite-67',rootFrame:6,lang:'en' as const,
  scenario:'source-static-frame',seed:13,replay:0,...extra});
async function harness(){
  const clockTools=await load('lesson-source-clock'),contracts=await load('lesson-text-frame-control');
  let clock:any[]=[],revision=0;
  let s=createVb014Session(13);
  const requests:string[][]=[],frames:any[]=[];
  const request=(rs:readonly any[])=>{
    const defs=rs.map(r=>contracts.lessonTextActivityRequestAllowed(definitions,r,{frame:139,capture:false,activities:clock}));
    if(defs.some(d=>!d))return false;
    const next=clockTools.beginSourceClockActivities(clock,defs,revision+1);if(!next)return false;
    revision+=rs.length;clock=next.map((a:any)=>({...a,cancellationToken:a.cancellationToken??'clock-'+a.revision}));
    requests.push(rs.map(r=>r.id));return true;
  };
  const runtime=()=>({...context(),lessonActivities:clock,onLessonActivityRequest:(r:any)=>request([r]),
    onLessonActivitiesRequest:request,onLessonFrameRequest:(r:any)=>{frames.push(r);return contracts.lessonTextFrameRequestAllowed(VB014_FRAME_CONTROL,r,{frame:139,frameDomain:'sprite-67',capture:false});}});
  return {get state(){return s;},get clock(){return clock;},requests,frames,clockTools,runtime,
    step(action:any,extra={}){s=synchronizeVb014Session(s,context(),clock);s=bindVb014Children(s,clock);s=dispatchVb014(s,action,{...runtime(),...extra});return s;},
    tick(ms:number){clock=clockTools.advanceSourceActivities(clock,ms);},
    seek(){clock=[];s=synchronizeVb014Session(s,context(),clock);},
  };
}
test('own source identities, holds and sibling lifetimes match extracted bytes',async()=>{
  const base=path.join(root,'migrations/course-g04-l04-vb-014/audit/machine');
  const packed=readFileSync(path.join(base,'ffdec-scripts.txt.gz'));
  assert.equal(createHash('sha256').update(packed).digest('hex'),'eedcd4d5bb75c5f775ac735502975e978f03db3b3a0ce63f55bbc13deb9afccf');
  const scripts=gunzipSync(packed).toString();
  const section=(label:string)=>scripts.split('===== '+label+' =====\n')[1]?.split('\n===== ')[0]??'';
  assert.match(section('DefineSprite_67/frame_139/DoAction.as'),/stop\(\);[\s\S]*quizDragCount = 0;[\s\S]*big = 0;/);
  const plus4=section('DefineSprite_67/frame_139/PlaceObject2_34_3/CLIPACTIONRECORD on(releaseOutside,release).as');
  const plus6=section('DefineSprite_67/frame_139/PlaceObject2_38_12/CLIPACTIONRECORD on(releaseOutside,release).as');
  assert.match(plus4,/_droptarget\) == _parent.Mc_NumLine1 and _parent.big == 1/);
  assert.match(plus6,/_droptarget\) == _parent.Mc_NumLine\)[\s\S]*this._parent.big = 1/);
  for(const code of [plus4,plus6]){
    assert.match(code,/Coach_audio_2.gotoAndPlay\(2\)/);assert.match(code,/quizDragCount >= 2[\s\S]*Correct_FB.gotoAndPlay\(2\)/);
    assert.match(code,/this.enabled = false/);
  }
  assert.match(section('DefineSprite_66/frame_25/DoAction.as'),/quizSection = false;\n_parent.play\(\)/);
  assert.doesNotMatch(section('DefineSprite_60/frame_20/DoAction.as'),/_parent.play/);
  const asset=JSON.parse(gunzipSync(readFileSync(path.join(root,'catalog/typography-v1/source-catalog/assets/0d528b8128853665ab131e9c6c3d860a7ed45c6d4a3f54df34a349a9ed9c2153.json.gz'))).toString());
  const main=asset.timelines.find((t:any)=>t.timelineId==='sprite-67');
  for(const d of definitions){
    const i=main.instances.find((i:any)=>i.instanceId===d.sourceInstanceId);assert(i);
    assert.equal('sprite-'+i.characterId,d.frameDomain);assert.equal(i.firstFrame,139);assert.equal(i.lastFrameExclusive,140);
  }
  const contracts=await load('lesson-text-frame-control');
  contracts.validateLessonTextActivities(definitions,171,12);contracts.validateLessonTextFrameControl(VB014_FRAME_CONTROL,171);
});
test('all six arrows and both targets enforce the authored 6 then 4 sequence',()=>{
  for(const card of VB014_CARDS)for(const target of ['Mc_NumLine','Mc_NumLine1',null] as const){
    const first=reduceVb014(createVb014Session(13),{type:'drop',card,target});
    const accepted=card==='plus6'&&target==='Mc_NumLine';
    assert.equal(first.state.placed.length,accepted?1:0,`${card}/${target}`);
    assert.equal(first.state.wrongOpen,!accepted);
    const s=reduceVb014(createVb014Session(13),{type:'drop',card:'plus6',target:'Mc_NumLine'}).state;
    const second=reduceVb014(s,{type:'drop',card,target});
    assert.equal(second.state.placed.length,card==='plus4'&&target==='Mc_NumLine1'?2:1);
    if(card==='plus6')assert.equal(second.state,s,'accepted card is disabled');
  }
});
test('second correct drop concurrently restarts coach and final; coach20 cannot continue main',async()=>{
  const h=await harness();h.step({type:'drop',card:'plus6',target:'Mc_NumLine'});
  h.tick(500);h.step({type:'drop',card:'plus4',target:'Mc_NumLine1'});
  assert.deepEqual(h.requests,[['vb014-coach'],['vb014-coach','vb014-final']]);
  assert.deepEqual(h.clock.map(a=>[a.id,a.frame]),[['vb014-coach',2],['vb014-final',2]]);
  h.tick(1500);h.step({type:'finish'});
  assert.equal(h.clock.find(a=>a.id==='vb014-coach').status,'completed');
  assert.equal(h.clock.find(a=>a.id==='vb014-final').frame,20);assert.equal(h.state.continued,false);
  h.tick(5*1000/12);h.step({type:'finish'});
  assert.equal(h.state.continued,true);assert.deepEqual(h.frames,[{fromFrame:139,toFrame:140,stopFrame:171}]);
  h.step({type:'finish'});assert.equal(h.frames.length,1);
  assert.equal(h.clockTools.sourceActivitiesAtParentFrame(h.clock,140).length,0);
});
test('distractors remain usable during final feedback and cannot erase its completion gate',async()=>{
  const h=await harness();h.step({type:'drop',card:'plus6',target:'Mc_NumLine'});h.step({type:'drop',card:'plus4',target:'Mc_NumLine1'});
  h.tick(500);h.step({type:'press',card:'minus10'});h.step({type:'drop',target:'Mc_NumLine'});
  assert.equal(h.state.wrongOpen,true);assert.equal(h.state.placed.length,2);
  assert.equal(h.clock.length,3);assert.equal(h.clock.find(a=>a.id==='vb014-final').frame,8);
  const wrong=h.clock.find(a=>a.id.startsWith('vb014-wrong'));
  h.step({type:'close-wrong'});assert.equal(h.state.wrongOpen,false);
  assert.equal(h.clock.find(a=>a.id===wrong.id).revision,wrong.revision,'Close does not cancel sibling audio');
  h.tick(2000);h.step({type:'finish'});assert.equal(h.state.continued,true);
});
test('a new press hides wrong feedback; no modal lock, retries replace only wrong coach',async()=>{
  const h=await harness();h.step({type:'drop',card:'minus4',target:null});const first=h.clock[0];
  h.step({type:'press',card:'plus6'});assert.equal(h.state.wrongOpen,false);assert.equal(h.state.selected,'plus6');
  assert.equal(h.clock[0].revision,first.revision);
  h.step({type:'drop',target:'Mc_NumLine'});assert.equal(h.state.placed.length,1);assert.equal(h.clock.length,2);
  h.step({type:'drop',card:'minus6',target:null});assert.equal(h.clock.length,2);
  assert(h.clock.find(a=>a.id.startsWith('vb014-wrong')).revision>first.revision);
});
test('refused host effects roll back count, selection, PRNG and final continuation',async()=>{
  const h=await harness();h.step({type:'press',card:'plus6'});let before=h.state;
  assert.equal(h.step({type:'drop',target:'Mc_NumLine'},{onLessonActivityRequest:()=>false}),before);
  assert.equal(h.step({type:'drop',card:'minus4',target:null},{onLessonActivityRequest:()=>false}),before);
  h.step({type:'drop',target:'Mc_NumLine'});h.step({type:'press',card:'plus4'});before=h.state;
  for(const onLessonActivitiesRequest of [undefined,()=>false]){
    assert.equal(h.step({type:'drop',target:'Mc_NumLine1'},{onLessonActivitiesRequest}),before);
    assert.equal(h.requests.length,1,'no sequential fallback');
  }
  h.step({type:'drop',target:'Mc_NumLine1'});h.tick(2000);h.step({type:'press',card:'minus4'});before=h.state;
  assert.equal(h.step({type:'finish'},{onLessonFrameRequest:()=>false}),before);assert.equal(h.state.continued,false);
});
test('foreign, stale, duplicate and token-replaced final snapshots cannot finish',async()=>{
  const h=await harness();h.step({type:'drop',card:'plus6',target:'Mc_NumLine'});h.step({type:'drop',card:'plus4',target:'Mc_NumLine1'});
  h.tick(2000);h.step({type:'press',card:'minus4'});const s=h.state,a=h.clock.find(a=>a.id==='vb014-final');
  for(const replacement of [{...a,id:'vb014-coach'},{...a,sourceInstanceId:'sprite-67/depth-55/generation-1'},
    {...a,frameDomain:'sprite-60'},{...a,revision:0},{...a,revision:a.revision+1},{...a,cancellationToken:'replacement'},
    {...a,cancellationToken:undefined},{...a,frame:24},{...a,status:'playing'}]){
    const all=h.clock.filter(v=>v!==a).concat(replacement);
    assert.equal(reduceVb014(s,{type:'finish'},all).state,s);
  }
  assert.equal(reduceVb014(s,{type:'finish'},[...h.clock,a]).state,s);
});
test('Replay, backward seek, foreign context and same-frame seek reset ownership',async()=>{
  const h=await harness();h.step({type:'drop',card:'plus6',target:'Mc_NumLine'});h.tick(2000);h.step({type:'press',card:'plus4'});
  const s=h.state;assert.equal(synchronizeVb014Session(s,context(),h.clock),s);
  for(const extra of [{replay:1},{seed:14},{frame:1},{frame:140},{frameDomain:'sprite-60'}]){
    assert.equal(synchronizeVb014Session(s,context(extra),h.clock).placed.length,0);
  }
  assert.equal(synchronizeVb014Session(s,context(),[]).placed.length,0);
  assert.equal(synchronizeVb014Session(s,context(),h.clock.map(a=>({...a,cancellationToken:'replaced'}))).placed.length,0);
  h.seek();assert.equal(h.state.placed.length,0);assert.equal(h.state.random,13);
});
test('paused, capture and mismatched runtime identities cannot dispatch',()=>{
  const s=createVb014Session(13);
  for(const extra of [{paused:true},{frame:138},{frame:140},{replay:1},{seed:14},{lang:'es'},
    {rootFrame:1},{frameDomain:'root'},{scenario:'capture'},{entryStateSha256:'captured'}]){
    assert.equal(dispatchVb014(s,{type:'press',card:'plus6'},context(extra)),s);
  }
});
test('wrong-branch choices are repeatable across Replay and reach all four source branches',()=>{
  const run=(seed:number)=>{let s=createVb014Session(seed);const ids=[];for(let i=0;i<24;i++){
    const r=reduceVb014(s,{type:'drop',card:'minus4',target:null});s=r.state;ids.push(r.activities[0]);
  }return ids;};
  assert.deepEqual(run(13),run(13));assert.equal(new Set(run(13)).size,4);assert.notDeepEqual(run(13),run(14));
});
