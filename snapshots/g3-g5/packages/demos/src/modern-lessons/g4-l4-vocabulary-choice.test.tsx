import assert from 'node:assert/strict';
import test from 'node:test';
import {loadAnimationModuleForPresentation} from '../animation-registry';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivitySnapshot} from '../lesson-text-contract';
import {G4_L4_VOCABULARY_CHOICE_CONFIGS as raw} from './generated/g4-l4-vocabulary-choice-config';
import {VocabularyChoiceScene,getVocabularyChoiceTeaching as teaching,getVocabularyChoiceSnapshot as snapshot,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {createArithmeticChoiceSession as create,chooseArithmeticChoiceAnswer as choose,observeArithmeticChoiceFeedback as observe,closeArithmeticChoiceWrong as close,finishArithmeticChoiceFeedback as finish,synchronizeArithmeticChoiceSession as sync,type ArithmeticChoiceSession} from './g4-l4-arithmetic-choice';
import {G4_L4_VB005_TEXT_PRESENTATION as P5} from './g4-l4-vb005';
import {G4_L4_VB008_TEXT_PRESENTATION as P8} from './g4-l4-vb008';
import {G4_L4_VB010_TEXT_PRESENTATION as P10} from './g4-l4-vb010';
import M5 from '../modules/course-g04-l04-vb-005';
import M8 from '../modules/course-g04-l04-vb-008';
import M10 from '../modules/course-g04-l04-vb-010';
const C=raw as readonly VocabularyChoiceConfig[],P=[P5,P8,P10],M=[M5,M8,M10];
const runtime=(c:VocabularyChoiceConfig,seed=0):AnimationRendererProps=>({frame:c.activityFrame,frameDomain:c.frameDomain,rootFrame:6,lang:'en',scenario:'source-static-frame',seed,replay:0,onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,onLessonHostRequest:()=>{}});
const activity=(c:VocabularyChoiceConfig,s:ArithmeticChoiceSession,frame?:number,revision=1):LessonTextActivitySnapshot=>{const id=s.feedback!.id+(s.feedback!.stage==='outro'?'-outro':''),d=c.activities.find(a=>a.id===id)!;return{id,sourceInstanceId:d.sourceInstanceId,frameDomain:d.frameDomain,revision,frame:frame??d.endFrame,status:(frame??d.endFrame)===d.endFrame?'completed':'playing'};};
const correct=(c:VocabularyChoiceConfig)=>c.questions[0].answers.find(a=>a.correct)!.id,wrong=(c:VocabularyChoiceConfig)=>c.questions[0].answers.find(a=>!a.correct)!.id;
test('own sum, difference and estimate prompts bind visible title, answer order and correct result',()=>{
 const expected=[['Click the sum.',['14','6','20'],'20',26,74],['Click the difference.',['20','6','14'],'14',30,53],['Click the estimated sum.',['300','700','800'],'800',102,140]];
 for(const[i,c]of C.entries()){assert.deepEqual([c.text.prompt,c.questions[0].answers.map(a=>a.text),c.questions[0].answers.find(a=>a.correct)!.text,c.activityFrame,c.frameCount],expected[i]);assert.deepEqual(c.binding.blocks.find(b=>b.id==='root-title')!.sourceTextIds,['character-4/run-0']);assert.equal(c.feedback.length,7);assert.equal(c.activities.length,13);assert.equal(c.sourceAudio[0].endFrame,c.frameCount+1);}
});
test('each native main instance matches the source display list at every frame, including replaced depths',()=>{
 for(const c of C){const a=JSON.parse(gunzipSync(fs.readFileSync('catalog/typography-v1/source-catalog/assets/'+c.sourceSha256+'.json.gz')).toString()),timeline=a.timelines.find((t:any)=>t.timelineId===c.frameDomain),state=new Map<number,any>();
  for(let frame=1;frame<=c.frameCount;frame++){
   for(const event of timeline.events.filter((e:any)=>e.frame===frame)){if(event.kind==='remove')state.delete(event.depth);if(event.kind==='place')state.set(event.depth,{...(event.move?state.get(event.depth):{}),...event});}
   const t=teaching(c,frame),values=[...t.answers,...t.tokens.filter(x=>x.kind==='text'),...t.glyphs];
   for(const value of values){const e=[...state.values()].find(e=>e.instanceId===value.sourceInstance);const ct=e?.colorTransform,alpha=!e?0:!ct?1:Math.max(0,Math.min(1,ct.multiply[3]/(ct.divisor??256)+ct.add[3]/255));assert.equal(value.alpha,alpha,`${c.animationId}:${frame}:${value.sourceInstance}`);assert.equal(value.x,e?.matrix[4]??null);assert.equal(value.y,e?.matrix[5]??null);}
  }
 }
 const initial=teaching(C[0],26),replacement=teaching(C[0],35);assert.notEqual(initial.answers[0].sourceInstance,replacement.answers[0].sourceInstance);assert.equal(replacement.answers[0].alpha,1);
});
test('math reading order is interleaved and all seven estimate glyph instances remain distinct',()=>{
 for(const c of C.slice(0,2))assert.deepEqual(c.binding.blocks.slice(2,7).map(b=>b.id),['answer-left','equation-operator','answer-middle','equation-equals','answer-right']);
 const glyphs=teaching(C[2],C[2].activityFrame).glyphs;assert.equal(glyphs.map(g=>g.text).join(''),'581+212');assert.equal(new Set(glyphs.map(g=>g.sourceInstance)).size,7);assert.equal(glyphs.filter(g=>g.text==='2').length,2);assert.equal(glyphs.filter(g=>g.text==='1').length,2);
 for(const c of C.slice(0,2)){const end=teaching(c,c.frameCount);assert(end.answers.every(a=>a.travel===0));assert.equal(end.answers.find(a=>a.correct)!.alpha,1);}
 const end=teaching(C[2],C[2].frameCount);assert.equal(end.answers.find(a=>a.correct)!.travel,1);assert(end.answers.filter(a=>!a.correct).every(a=>a.alpha===0));
});
test('all 21 source feedback branches require the exact child; wrong Close retries, correct completion advances',()=>{
 for(const c of C)for(const branch of c.feedback){const seed=branch.variant-1,r=runtime(c,seed);let s=choose(c,create(seed),branch.kind==='correct'?correct(c):wrong(c),r);assert.equal(s.feedback?.id,branch.id);const a=activity(c,s);assert.equal(observe(c,s,[{...a,sourceInstanceId:'foreign'}]).bound,false);assert.equal(finish(c,s,{...r,lessonActivities:[{...a,status:'playing'}]}),s);
  if(branch.kind==='wrong'){assert(observe(c,s,[a]).popup);assert.equal(finish(c,s,{...r,lessonActivities:[a]}),s);s=close(c,s,{...r,lessonActivities:[a]});assert.equal(s.feedback?.stage,'outro');s=finish(c,s,{...r,lessonActivities:[activity(c,s,undefined,2)]});assert.equal(s.feedback,null);assert.equal(s.focusTarget,wrong(c));assert.equal(s.pendingFromFrame,null);}
  else{s=finish(c,s,{...r,lessonActivities:[a]});assert.equal(s.feedback,null);assert.equal(s.pendingFromFrame,c.activityFrame);}
 }
});
test('host refusal, paused state, foreign identity and Replay cannot consume an attempt',()=>{
 for(const c of C){const s=create(),r=runtime(c);for(const delta of[{onLessonActivityRequest:()=>false},{onLessonFrameRequest:undefined},{paused:true},{lang:'es'},{rootFrame:5},{frame:1},{seed:2},{replay:1}])assert.equal(choose(c,s,correct(c),{...r,...delta}as AnimationRendererProps),s);const pending=choose(c,s,wrong(c),r);assert.deepEqual(sync(pending,{...r,replay:1}),create(0,1));assert.equal(observe(c,pending,[activity(c,pending),activity(c,pending)]).bound,false);}
});
test('native scene keeps arithmetic DOM order, source links, independent ROCKET letters and authored Close dialog',()=>{
 for(const c of C){const r=runtime(c),html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={create()} onChoose={()=>{}}/>);assert.doesNotMatch(html,/<canvas|<img|<svg|<foreignObject|Need More Help/);const order=c.binding.blocks.slice(0,c.nativeLayout.kind==='equation-choices'?7:6).map(b=>html.indexOf('data-lesson-text-block="'+b.id+'"'));assert(order.every((v,i)=>v>=0&&(!i||v>order[i-1])));
  const s=choose(c,create(),wrong(c),r),a=activity(c,s),popup=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={s} activities={[a]} onClose={()=>{}}/>);assert(popup.includes('role="dialog"'));assert(popup.includes('data-lesson-text-block="close"'));for(const token of c.wrongExplanationTokens)if(token.entryId)assert(popup.includes('data-keyterm-entry-id="'+token.entryId+'"'));assert.equal(c.wrongExplanationTokens.map(t=>t.text).join(''),c.text['wrong-explanation']);
 }
 const c=C[0],r=runtime(c),s=choose(c,create(),correct(c),r),html=renderToStaticMarkup(<VocabularyChoiceScene config={c} runtime={r} session={s} activities={[activity(c,s,6)]}/>),ids=c.feedbackLetterGroups[0].ids;assert.equal(ids.map(id=>c.text[id]).join(''),'ROCKET');for(let i=1;i<ids.length;i++)assert(html.indexOf('data-lesson-text-block="'+ids[i-1]+'"')<html.indexOf('data-lesson-text-block="'+ids[i]+'"'));
});
test('actual adapters preserve source identity and hold, reject unsupported Spanish and bind original audio',()=>{
 for(const[i,c]of C.entries()){const r=runtime(c),state=M[i].getFrameState(r.frame,r),p=P[i];assert.equal(p.getSnapshot(state,r).status,'ready');assert.equal(p.playbackEndFrameByDomain![c.frameDomain],c.activityFrame);assert.equal(p.reducedMotionFrameByDomain![c.frameDomain],c.activityFrame);assert.equal(p.frameControl!.completionFrame,c.frameCount);assert.deepEqual(p.activityTimelines,c.activities);assert.deepEqual(p.sourceTimelineAudioCues,c.sourceAudio);assert.deepEqual(p.keyTerms,c.keyTerms.entryIds.length?c.keyTerms:undefined);for(const delta of[{lang:'es'},{frame:0},{rootFrame:5},{frameDomain:'root'},{entryStateSha256:'unknown'}])assert.equal(snapshot(c,state,{...r,...delta}as any).status,'blocked');assert.equal(snapshot(c,{...state,sourceSwfSha256:'0'.repeat(64)},r).status,'blocked');assert.equal(M[i].audioTracks?.filter(a=>a.language==='es').length??0,0);}
});

test('actual modern registry loader accepts all own source activities and omits an absent keyterm capability',async()=>{
 for(const c of C){const m=await loadAnimationModuleForPresentation(c.animationId,{modernText:true});assert(m?.textPresentation);assert.equal(m.textPresentation.binding.version,c.binding.version);assert.deepEqual(m.textPresentation.sourceTimelineAudioCues,c.sourceAudio);assert.deepEqual(m.textPresentation.activityTimelines,c.activities);if(c.animationId==='course-g04-l04-vb-010')assert.equal(m.textPresentation.keyTerms,undefined);else assert.deepEqual(m.textPresentation.keyTerms,c.keyTerms);}
});
