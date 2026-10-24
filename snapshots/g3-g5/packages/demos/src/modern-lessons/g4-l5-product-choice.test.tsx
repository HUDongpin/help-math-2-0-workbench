import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {G4_L5_PRODUCT_CHOICE_CONFIGS} from './generated/g4-l5-product-choice-config';
import {VocabularyChoiceScene,getVocabularyChoiceTeaching as teaching,getVocabularyChoiceSnapshot as snapshot,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {createArithmeticChoiceSession as create,chooseArithmeticChoiceAnswer as choose,observeArithmeticChoiceFeedback as observe,closeArithmeticChoiceWrong as close,finishArithmeticChoiceFeedback as finish,synchronizeArithmeticChoiceSession as sync,type ArithmeticChoiceSession} from './g4-l4-arithmetic-choice';
import {G4_L5_VB005_TEXT_PRESENTATION as presentation} from './g4-l5-vb005';
import module from '../modules/course-g04-l05-vb-005';

const c:VocabularyChoiceConfig=G4_L5_PRODUCT_CHOICE_CONFIGS[0];
const runtime=(seed=0,replay=0):AnimationRendererProps=>({frame:30,frameDomain:'sprite-278',rootFrame:6,lang:'en',scenario:'source-static-frame',seed,replay,onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,onLessonHostRequest:()=>{}});
const activity=(state:ArithmeticChoiceSession,frame?:number,revision=1):LessonTextActivitySnapshot=>{
 const id=state.feedback!.id+(state.feedback!.stage==='outro'?'-outro':'');const definition=c.activities.find(a=>a.id===id)!;
 return{id,sourceInstanceId:definition.sourceInstanceId,frameDomain:definition.frameDomain,revision,frame:frame??definition.endFrame,status:(frame??definition.endFrame)===definition.endFrame?'completed':'playing'};
};
const asset=JSON.parse(gunzipSync(fs.readFileSync('catalog/typography-v1/source-catalog/assets/'+c.sourceSha256+'.json.gz')).toString());

test('VB005 uses the spatially authored 25 times 8 equation, all source links and seven reachable feedback branches',()=>{
 assert.equal(c.sourceSha256,'2474b4a7289397ab14ecf2c9ab80bed8328d337a9f8f1468ecf82b6390e283bf');
 assert.deepEqual(c.questions[0].answers.map(a=>[a.id,a.text,a.sourceButton,a.correct]),[['left','25',24,false],['middle','8',25,false],['right','200',26,true]]);
 assert.equal(Number(c.text['answer-left'])*Number(c.text['answer-middle']),Number(c.text['answer-right']));
 assert.equal(c.text['equation-operator'],'×');assert.equal(c.text['equation-equals'],'=');
 assert.equal(c.prompt.tokens.map(t=>t.text).join(''),'Click the product.');assert.equal(c.term?.button,9);assert.equal(c.term?.key,'Product');
 assert.deepEqual(c.binding.blocks.slice(2,7).map(b=>b.id),['answer-left','equation-operator','answer-middle','equation-equals','answer-right']);
 assert.deepEqual(c.feedback.map(b=>b.id).sort(),['correct-1','correct-2','correct-3','correct-4','wrong-1','wrong-2','wrong-3']);
 assert.equal(c.activities.length,13);assert.deepEqual(new Set(c.wrongExplanationTokens.filter(t=>t.key).map(t=>t.key)),new Set(['Product','Multiplication','Problem']));
 assert.equal(c.wrongExplanationTokens.map(t=>t.text).join(''),c.text['wrong-explanation']);
});

test('every main frame matches raw source display-list alpha, position, alias visibility and answer identity',()=>{
 const timeline=asset.timelines.find((t:any)=>t.timelineId===c.frameDomain);const state=new Map<number,any>();
 for(let frame=1;frame<=74;frame++){
  for(const event of timeline.events.filter((e:any)=>e.frame===frame)){if(event.kind==='remove')state.delete(event.depth);else if(event.kind==='place')state.set(event.depth,{...(event.move?state.get(event.depth):{}),...event});}
  const native=teaching(c,frame);const values=[...native.answers,...native.tokens.filter(t=>t.kind==='text')];
  for(const value of values){const e=[...state.values()].find(e=>e.instanceId===value.sourceInstance),ct=e?.colorTransform;const a=!e?0:!ct?1:Math.max(0,Math.min(1,ct.multiply[3]/(ct.divisor??256)+ct.add[3]/255));assert.equal(value.alpha,a,`frame ${frame}`);assert.equal(value.x,e?.matrix[4]??null);assert.equal(value.y,e?.matrix[5]??null);}
  const highlighted=[...state.values()].some(e=>e.characterId===272),color=native.answers.find(a=>a.id==='right')!.highlightColor;
  if(highlighted){assert(color);assert.deepEqual(color.slice(5,-1).split(',').map(Number),[255,0,255,1]);}else assert.equal(color,undefined);
  for(const replay of [0,2]){const html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={{...runtime(0,replay),frame}} session={create(0,replay)}/>);assert.doesNotMatch(html,/<canvas|<img|<svg|<foreignObject/);assert(html.includes(`data-lesson-replay="${replay}"`));}
 }
 const alias=c.binding.blocks.find(b=>b.id==='answer-right')!.sourceTextIds;assert(alias.some(id=>id.startsWith('character-18/')));assert(alias.some(id=>id.startsWith('character-272/')));
 assert.equal(teaching(c,48).answers[2].travel,0);assert(teaching(c,49).answers[2].travel>0);assert.equal(teaching(c,65).answers[2].travel,1);
 assert.equal(teaching(c,74).answers[2].travel,1);assert(teaching(c,74).answers.filter(a=>!a.correct).every(a=>a.alpha===0));
 const end=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={{...runtime(),frame:74}} session={create()}/>);assert(end.includes('translateX(-8.75rem)'));assert(end.includes('>Replay</button>'));
});

test('all reachable feedback variants bind one child revision; wrong Close retries and correct completion resumes frame 31',()=>{
 for(const branch of c.feedback){
  const r=runtime(branch.variant-1),answer=branch.kind==='correct'?'right':'left';let state=choose(c,create(r.seed),answer,r);assert.equal(state.feedback?.id,branch.id);
  const observed=activity(state);assert.equal(observe(c,state,[{...observed,sourceInstanceId:'foreign'}]).bound,false);assert.equal(observe(c,state,[observed,observed]).bound,false);
  assert.equal(finish(c,state,{...r,lessonActivities:[{...observed,status:'playing'}]}),state);assert.deepEqual(sync(state,{...r,replay:1}),create(r.seed,1));
  if(branch.kind==='wrong'){
   assert(observe(c,state,[observed]).popup);assert.equal(finish(c,state,{...r,lessonActivities:[observed]}),state);
   assert.equal(close(c,state,{...r,onLessonActivityRequest:()=>false,lessonActivities:[observed]}),state);
   state=close(c,state,{...r,lessonActivities:[observed]});assert.equal(state.feedback?.stage,'outro');assert.equal(observe(c,state,[observed]).bound,false);
   state=finish(c,state,{...r,lessonActivities:[activity(state,undefined,2)]});assert.equal(state.feedback,null);assert.equal(state.focusTarget,'left');assert.equal(state.pendingFromFrame,null);
  }else{
   assert.equal(finish(c,state,{...r,onLessonFrameRequest:()=>false,lessonActivities:[observed]}),state);
   let request:unknown;state=finish(c,state,{...r,onLessonFrameRequest:q=>{request=q;return true;},lessonActivities:[observed]});assert.deepEqual(request,{fromFrame:30,toFrame:31,stopFrame:74});assert.equal(state.pendingFromFrame,30);assert.equal(choose(c,state,'left',r),state);assert.equal(sync(state,{...r,frame:31}).pendingFromFrame,null);
  }
 }
});

test('foreign identity, paused state and host refusal do not consume attempts; two wrong source targets return focus separately',()=>{
 const r=runtime(),state=create();
 for(const change of [{lang:'es'},{rootFrame:5},{frame:29},{frameDomain:'root'},{seed:2},{replay:1},{paused:true},{entryStateSha256:'unsupported'},{onLessonActivityRequest:()=>false},{onLessonFrameRequest:undefined}])assert.equal(choose(c,state,'right',{...r,...change} as AnimationRendererProps),state);
 for(const target of ['left','middle']){let s=choose(c,state,target,r);const a=activity(s);s=close(c,s,{...r,lessonActivities:[a]});s=finish(c,s,{...r,lessonActivities:[activity(s,undefined,2)]});assert.equal(s.focusTarget,target);assert.deepEqual(s.attempts,[1]);}
});

test('dialog includes all own source glossary links, Close, and separately timed ROCKET letters',()=>{
 let r=runtime(),s=choose(c,create(),'left',r),a=activity(s);const popup=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={s} activities={[a]} onClose={()=>{}}/>);assert(popup.includes('role="dialog"'));assert(popup.includes('data-lesson-text-block="close"'));for(const token of c.wrongExplanationTokens)if(token.entryId)assert(popup.includes('data-keyterm-entry-id="'+token.entryId+'"'));
 const group=c.feedbackLetterGroups[0];assert(group);const branch=c.feedback.find(b=>b.id===group.branchId)!;r=runtime(branch.variant-1);s=choose(c,create(r.seed),'right',r);assert.equal(group.ids.map(id=>c.text[id]).join(''),'ROCKET');
 const html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={s} activities={[activity(s,6)]}/>);for(let i=1;i<group.ids.length;i++)assert(html.indexOf('data-lesson-text-block="'+group.ids[i-1]+'"')<html.indexOf('data-lesson-text-block="'+group.ids[i]+'"'));
});

test('actual prepared module and presentation bind source hold, completion, main audio and original Spanish host track',()=>{
 const r=runtime(),state=module.getFrameState(r.frame,r);assert.equal(presentation.getSnapshot(state,r).status,'ready');assert.equal(presentation.playbackEndFrameByDomain?.[c.frameDomain],30);assert.equal(presentation.frameControl?.completionFrame,74);
 assert.deepEqual(presentation.activityTimelines,c.activities);assert.deepEqual(presentation.sourceTimelineAudioCues,c.sourceAudio);assert.deepEqual(presentation.keyTerms,c.keyTerms);
 assert.equal(c.sourceAudio[0].frame,10);assert.equal(c.sourceAudio[0].endFrame,75);assert.equal(c.sourceAudio[0].sha256,'e782cd530c83eab7eb3ca466aef032426f6cff94d1b129a068c67bca0416b05c');
 const sa=module.audioTracks?.find(a=>a.language==='es');assert(sa);assert.equal(sa.sha256,'329f69b0fffe6a70bed4f7528cda586730541fd4f5ad1a132f3c3bb066230442');assert.equal(sa.activation,'user');assert.equal(sa.timelineBehavior,'pause-while-playing');
 for(const change of [{lang:'es'},{frame:0},{rootFrame:5},{frameDomain:'root'},{entryStateSha256:'foreign'}])assert.equal(snapshot(c,state,{...r,...change} as AnimationRendererProps).status,'blocked');
 assert.equal(snapshot(c,{...state,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');
});
