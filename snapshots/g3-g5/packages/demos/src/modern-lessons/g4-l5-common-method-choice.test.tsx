import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {G4_L5_COMMON_METHOD_CHOICE_CONFIGS} from './generated/g4-l5-common-method-choice-config';
import {VocabularyChoiceScene,getVocabularyChoiceTeaching as teaching,getVocabularyChoiceSnapshot as snapshot,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {createArithmeticChoiceSession as create,chooseArithmeticChoiceAnswer as choose,observeArithmeticChoiceFeedback as observe,closeArithmeticChoiceWrong as close,finishArithmeticChoiceFeedback as finish,synchronizeArithmeticChoiceSession as sync,type ArithmeticChoiceSession} from './g4-l4-arithmetic-choice';
import {G4_L5_IN019_TEXT_PRESENTATION as presentation} from './g4-l5-in019';
import module from '../modules/course-g04-l05-in-019';
const c:VocabularyChoiceConfig=G4_L5_COMMON_METHOD_CHOICE_CONFIGS[0];
const runtime=(seed=0,replay=0):AnimationRendererProps=>({frame:62,frameDomain:'sprite-206',rootFrame:6,lang:'en',scenario:'source-static-frame',seed,replay,onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,onLessonHostRequest:()=>{}});
const activity=(s:ArithmeticChoiceSession,frame?:number,revision=1):LessonTextActivitySnapshot=>{const id=s.feedback!.id+(s.feedback!.stage==='outro'?'-outro':''),d=c.activities.find(a=>a.id===id)!;return{id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,revision,frame:frame??d.endFrame,status:(frame??d.endFrame)===d.endFrame?'completed':'playing'};};
const asset=JSON.parse(gunzipSync(fs.readFileSync('catalog/typography-v1/source-catalog/assets/'+c.sourceSha256+'.json.gz')).toString());
const timelines=new Map<string,any>(asset.timelines.map((t:any)=>[t.timelineId,t])),texts=new Map<number,any>(asset.textDefinitions.map((t:any)=>[t.characterId,t])),buttons=new Map<number,any>(asset.buttonDefinitions.map((t:any)=>[t.characterId,t]));
const alpha=(e:any)=>{const ct=e?.colorTransform;return !e?0:!ct?1:Math.max(0,Math.min(1,ct.multiply[3]/(ct.divisor??256)+ct.add[3]/255));};
function frames(t:any){const s=new Map<number,any>(),out:any[]=[];for(let f=1;f<=t.declaredFrameCount;f++){for(const e of t.events.filter((e:any)=>e.frame===f)){if(e.kind==='remove')s.delete(e.depth);else if(e.kind==='place')s.set(e.depth,{...(e.move?s.get(e.depth):{}),...e});}out.push([...s.values()].map(e=>({...e})));}return out;}
const displayLists=new Map([...timelines].map(([id,t])=>[id,frames(t)]));
function walk(cid:number,frame=1,opacity=1,anc:number[]=[]):any[]{assert(!anc.includes(cid));const td=texts.get(cid);if(td)return[{cid,text:(td.runs??[]).map((r:any)=>r.text).join(''),kind:td.kind,alpha:opacity}];const b=buttons.get(cid);if(b)return b.statePlacements.filter((e:any)=>e.states.up).flatMap((e:any)=>walk(e.characterId,1,opacity,[...anc,cid]));const tl=timelines.get('sprite-'+cid);if(!tl)return[];const f=(frame-1)%tl.declaredFrameCount+1;return displayLists.get(tl.timelineId)![f-1].flatMap((e:any)=>{const i=tl.instances.find((i:any)=>i.instanceId===e.instanceId);return walk(e.characterId,f-i.firstFrame+1,opacity*alpha(e),[...anc,cid]);});}

test('IN019 binds the source vertical operation, authored answer order, three prompt links and no invented popup links',()=>{
 assert.equal(c.sourceSha256,'d21486e329ff032883a0dea070f46d2dfcfdbddbc66ae59dd173c65ffebf4403');assert.equal(c.nativeLayout.kind,'vertical-choices');
 assert.deepEqual(c.questions[0].answers.map(a=>[a.id,a.text,a.sourceButton,a.correct]),[['left','2,017',204,false],['middle','2,107',204,false],['right','2,117',205,true]]);
 assert.equal(Number(c.text['factor-top'])*Number(c.text['factor-bottom']),Number(c.text['answer-right'].replace(',','')));assert.equal(c.text['factor-operator'],'×');
 assert.deepEqual(c.binding.blocks.slice(2,8).map(b=>b.id),['factor-top','factor-operator','factor-bottom','answer-left','answer-middle','answer-right']);
 assert.equal(c.promptSegments?.map(t=>t.text).join(''),'Multiply using the common method. Then click the product.');
 assert.deepEqual(c.promptSegments?.flatMap(t=>t.term?[[t.term.key,t.term.button]]:[]),[['Multiply',9],['Common method',8],['Product',10]]);
 assert.deepEqual(c.wrongExplanationTokens,[{text:'Multiply 3 × 29, then 70 × 29. Then add to get the product. Try again.'}]);assert.equal(c.activities.length,13);assert.equal(c.feedback.length,7);
 const used=new Set(c.binding.blocks.flatMap(b=>b.sourceTextIds));const excluded=asset.textDefinitions.filter((t:any)=>!(t.runs?.length?t.runs.map((r:any)=>r.sourceTextId):[t.sourceTextId]).some((id:string)=>used.has(id))).map((t:any)=>t.characterId);assert.deepEqual(excluded,[40,146,147]);
});

test('all 91 main frames independently match actual source values, aliases, button activation and both travel axes',()=>{
 const main=displayLists.get(c.frameDomain)!;
 for(let frame=1;frame<=91;frame++){
  const st=main[frame-1],t=teaching(c,frame);for(const v of [...t.answers,...t.operands!]){const e=st.find((e:any)=>e.instanceId===v.sourceInstance);assert.equal(v.alpha,alpha(e));assert.equal(v.x,e?.matrix[4]??null);assert.equal(v.y,e?.matrix[5]??null);}
  const aliases=st.filter((e:any)=>19<=e.characterId&&e.characterId<=34).sort((a:any,b:any)=>a.matrix[4]-b.matrix[4]),native=t.promptSegments!.flatMap(s=>s.emphasis.instances);assert.deepEqual(native,aliases.map((e:any)=>e.instanceId));assert.deepEqual(t.promptSegments!.flatMap(s=>s.emphasis.characters),aliases.map((e:any)=>e.characterId));
  assert.equal(t.ruleAlpha,alpha(st.find((e:any)=>e.characterId===11)));assert.equal(t.promptAlpha,alpha(st.find((e:any)=>e.characterId===6)));
  for(const segment of t.promptSegments!){if(segment.emphasis.instances.length)assert.deepEqual(segment.emphasis.color!.slice(5,-1).split(',').map(Number),[255,0,255,1]);if(segment.term)assert.equal(segment.term.activeFrames.some(([a,b])=>a<=frame&&frame<b),st.some((e:any)=>e.characterId===segment.term!.button&&alpha(e)>0));}
  const a=t.answers[2],source=st.find((e:any)=>e.characterId===18);assert.equal(a.travel,Math.max(0,(source.matrix[4]-1897)/(-1323-1897)));assert.equal(a.verticalTravel,Math.max(0,(source.matrix[5]-1674)/(-726-1674)));
  for(const replay of[0,2]){const r={...runtime(0,replay),frame},html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={create(0,replay)} onChoose={()=>{}}/>);assert.doesNotMatch(html,/<canvas|<img|<svg|<foreignObject/);assert(html.includes('Vertical multiplication'));const snap=snapshot(c,module.getFrameState(frame,r),r);assert.equal(snap.status,'ready');for(const v of t.operands!)assert.equal(snap.blocks.find(b=>b.id===v.blockId)!.visible,v.alpha>0);}
 }
 assert.equal(teaching(c,74).answers[2].travel,0);assert(teaching(c,75).answers[2].travel>0);assert.equal(teaching(c,81).answers[2].verticalTravel,0);assert(teaching(c,82).answers[2].verticalTravel!>0);assert.equal(teaching(c,85).answers[2].travel,1);assert.equal(teaching(c,85).answers[2].verticalTravel,1);
 const html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={{...runtime(),frame:91}} session={create()}/>);assert(html.includes('left:12rem;top:-3rem'));assert(html.includes('>Replay</button>'));
});

test('every selected child frame matches recursive original text alpha and popup state',()=>{
 let count=0;
 for(const b of c.feedback){const r=runtime(b.variant-1),s=choose(c,create(r.seed),b.kind==='correct'?'right':'left',r);assert.equal(s.feedback?.id,b.id);
  for(const d of c.activities.filter(a=>a.id===b.id||a.id===b.id+'-outro')){const state=d.id.endsWith('-outro')?{...s,feedback:{...s.feedback!,stage:'outro' as const}}:s;
   for(let frame=d.startFrame;frame<=d.endFrame;frame++){const raw=walk(Number(b.frameDomain.slice(7)),frame),a=activity(state,frame,d.id.endsWith('-outro')?2:1),o=observe(c,state,[a]);assert(o.bound);for(const label of o.labels){const definition=b.labels.find(l=>l.id===label.id)!;assert.equal(label.alpha,Math.max(0,...raw.filter(x=>definition.sourceCharacters.includes(x.cid)).map(x=>x.alpha)));}
    assert.equal(o.popupAlpha,Math.max(0,...raw.filter(x=>x.kind==='dynamic-field').map(x=>x.alpha)));const html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={state} activities={[a]} onClose={()=>{}}/>);assert.doesNotMatch(html,/<canvas|<img|<svg|<foreignObject/);count++;}
  }
 }
 assert.equal(count,188);
});

test('all feedback variants retain identity, Close/outro retry and correct parent resume 62 to63 through91',()=>{
 for(const b of c.feedback){const r=runtime(b.variant-1);let s=choose(c,create(r.seed),b.kind==='correct'?'right':'left',r);const a=activity(s);assert.equal(observe(c,s,[{...a,sourceInstanceId:'foreign'}]).bound,false);assert.equal(observe(c,s,[a,a]).bound,false);assert.equal(finish(c,s,{...r,lessonActivities:[{...a,status:'playing'}]}),s);assert.deepEqual(sync(s,{...r,replay:1}),create(r.seed,1));
  if(b.kind==='wrong'){assert(observe(c,s,[a]).popup);assert.equal(close(c,s,{...r,paused:true,lessonActivities:[a]}),s);assert.equal(close(c,s,{...r,onLessonActivityRequest:()=>false,lessonActivities:[a]}),s);s=close(c,s,{...r,lessonActivities:[a]});assert.equal(s.feedback?.stage,'outro');assert.equal(observe(c,s,[a]).bound,false);s=finish(c,s,{...r,lessonActivities:[activity(s,undefined,2)]});assert.equal(s.feedback,null);assert.equal(s.focusTarget,'left');}
  else{assert.equal(finish(c,s,{...r,onLessonFrameRequest:()=>false,lessonActivities:[a]}),s);let q:unknown;s=finish(c,s,{...r,onLessonFrameRequest:x=>{q=x;return true;},lessonActivities:[a]});assert.deepEqual(q,{fromFrame:62,toFrame:63,stopFrame:91});assert.equal(s.pendingFromFrame,62);assert.equal(choose(c,s,'left',r),s);assert.equal(sync(s,{...r,frame:63}).pendingFromFrame,null);}
 }
});

test('invalid identity, Pause and host refusal keep attempts unchanged; wrong target focus returns separately',()=>{
 const r=runtime(),s=create();for(const change of[{lang:'es'},{rootFrame:5},{frame:61},{frameDomain:'root'},{seed:2},{replay:1},{paused:true},{entryStateSha256:'foreign'},{onLessonActivityRequest:()=>false},{onLessonFrameRequest:undefined}])assert.equal(choose(c,s,'right',{...r,...change}as AnimationRendererProps),s);
 for(const id of['left','middle']){let q=choose(c,s,id,r);q=close(c,q,{...r,lessonActivities:[activity(q)]});q=finish(c,q,{...r,lessonActivities:[activity(q,undefined,2)]});assert.equal(q.focusTarget,id);assert.deepEqual(q.attempts,[1]);}
});

test('own presentation and original Spanish track bind62/91, source PCM and ADPCM fourth-correct sound',()=>{
 const r=runtime(),state=module.getFrameState(r.frame,r);assert.equal(presentation.getSnapshot(state,r).status,'ready');assert.equal(presentation.playbackEndFrameByDomain?.[c.frameDomain],62);assert.equal(presentation.frameControl?.completionFrame,91);assert.deepEqual(presentation.activityTimelines,c.activities);assert.deepEqual(presentation.sourceTimelineAudioCues,c.sourceAudio);assert.deepEqual(presentation.keyTerms,c.keyTerms);
 assert.equal(c.sourceAudio[0].frame,6);assert.equal(c.sourceAudio[0].endFrame,92);assert.equal(c.sourceAudio[0].sha256,'31834f5afd45488419b0c7a0e7f0f550a5cecf116e38e44ac7226caf8b6ac546');
 const d=c.activities.find(a=>a.id==='correct-4')!;assert.equal(d.frameDomain,'sprite-203');assert.equal(d.audio?.sha256,'f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8');assert.equal(d.audio?.firstFrame,1);assert.equal(d.audio?.lastFrame,13);
 const sa=module.audioTracks?.find(a=>a.language==='es');assert.equal(sa?.sha256,'b54bbe3e18a60f5b2c6d3f47ad439c452b5260f61ca605eaaef363376f9fa328');assert.equal(sa?.activation,'user');assert.equal(sa?.timelineBehavior,'pause-while-playing');
 for(const change of[{lang:'es'},{frame:0},{rootFrame:5},{frameDomain:'root'},{entryStateSha256:'foreign'}])assert.equal(snapshot(c,state,{...r,...change}as AnimationRendererProps).status,'blocked');assert.equal(snapshot(c,{...state,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');
});
