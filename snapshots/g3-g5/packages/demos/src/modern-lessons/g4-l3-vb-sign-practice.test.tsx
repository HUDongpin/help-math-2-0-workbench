import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnimationRendererProps} from '../contract';
import {COURSE_G04_L03_VB_007_SIGN_QUIZ as Q7,COURSE_G04_L03_VB_008_SIGN_QUIZ as Q8,reduceCourseG04L03VbSignQuiz as originalReduce} from '../timelines/course-g04-l03-vb-sign-quiz-interaction';
import {G4_L3_VB_SIGN_PRACTICE_CONFIGS as C} from './generated/g4-l3-vb-sign-practice-config';
import {createSignPracticeSession,chooseSignPracticeAnswer,observeSignPracticeFeedback,closeSignPracticeWrong,finishSignPracticeFeedback,synchronizeSignPracticeSession,getSignPracticeSnapshot} from './g4-l3-vb-sign-practice';
import {G4_L3_VB007_TEXT_PRESENTATION as P7} from './g4-l3-vb007';
import {G4_L3_VB008_TEXT_PRESENTATION as P8} from './g4-l3-vb008';
import {getCourseG04L03Vb007FrameState as F7} from '../modules/course-g04-l03-vb-007';
import {getCourseG04L03Vb008FrameState as F8} from '../modules/course-g04-l03-vb-008';
const pairs=[[Q7,C[Q7.animationId],P7,F7],[Q8,C[Q8.animationId],P8,F8]] as const;
for(const [quiz,config,presentation,getState]of pairs){
 const runtime=(extra:Partial<AnimationRendererProps>={}):AnimationRendererProps=>({frame:quiz.activityFrame,frameDomain:quiz.frameDomain,rootFrame:6,lang:'en',seed:13,replay:0,scenario:'source-static-frame',onLessonActivityRequest:()=>true,onLessonFrameRequest:()=>true,...extra});
 const seen=(session:ReturnType<typeof createSignPracticeSession>,frame?:number,revision=1,status:'playing'|'completed'='playing')=>{const branch=config.feedback.find(b=>b.id===session.feedback!.id)!;const id=branch.id+(session.feedback!.stage==='outro'?'-outro':'');const def=config.activities.find(a=>a.id===id)!;return{id,sourceInstanceId:branch.sourceInstanceId,frameDomain:branch.frameDomain,frame:frame??def.endFrame,revision,status};};
 test(quiz.animationId+' preserves exact choices, existing RNG draws and replay',()=>{
  assert.deepEqual(quiz.choices.map(c=>[c.sourceInstance,c.label,c.correct]),quiz===Q7?[['AnsBtn1','0',false],['AnsBtn2','7',true],['AnsBtn3','-7',false]]:[['AnsBtn2','9',false],['AnsBtn1','-9',true],['AnsBtn3','0',false]]);
  let session=createSignPracticeSession(quiz,13),prior=session.quiz;
  for(let i=0;i<12;i++){const id=quiz.choices.find(c=>!c.correct)!.id;prior=originalReduce(quiz,prior,{type:'choose',choiceId:id});session=chooseSignPracticeAnswer(config,quiz,session,id,runtime());assert.deepEqual(session.quiz,prior);
   const close=seen(session,22);session=closeSignPracticeWrong(config,session,runtime({lessonActivities:[close]}));session=finishSignPracticeFeedback(config,quiz,session,runtime({lessonActivities:[seen(session,undefined,2,'completed')]}));prior=originalReduce(quiz,prior,{type:'close-wrong'});assert.deepEqual(session.quiz,prior);
  }
  assert.equal(session.quiz.drawCount,12);assert.deepEqual(synchronizeSignPracticeSession(session,quiz,runtime({replay:1})),createSignPracticeSession(quiz,13,1));
 });
 test(quiz.animationId+' host refusal and paused/stale identity cannot consume a draw',()=>{
  const session=createSignPracticeSession(quiz,13),id=quiz.choices[0].id;
  for(const extra of [{onLessonActivityRequest:()=>false},{paused:true},{seed:14},{replay:1},{entryStateSha256:'capture'},{frameDomain:'root'},{lang:'es' as const},{rootFrame:1},{onLessonFrameRequest:undefined}])assert.equal(chooseSignPracticeAnswer(config,quiz,session,id,runtime(extra)),session);
 });
 test(quiz.animationId+' wrong22 Close23 waits exact fresh outro terminal',()=>{
  const session=chooseSignPracticeAnswer(config,quiz,createSignPracticeSession(quiz,13),quiz.choices.find(c=>!c.correct)!.id,runtime());
  assert.equal(closeSignPracticeWrong(config,session,runtime({lessonActivities:[seen(session,config.feedback.find(b=>b.id===session.feedback!.id)!.popupFrames[0]![0]-1)]})),session);
  assert.equal(finishSignPracticeFeedback(config,quiz,session,runtime({lessonActivities:[seen(session,22,1,'completed')]})),session);
  let request:unknown;const outro=closeSignPracticeWrong(config,session,runtime({lessonActivities:[seen(session,22)],onLessonActivityRequest:r=>{request=r;return true;}}));
  assert.deepEqual(request,{id:session.feedback!.id+'-outro',parentFrame:quiz.activityFrame,fromActivity:{id:session.feedback!.id,revision:1}});assert.equal(outro.quiz.mode,'wrong-feedback');
  const branch=config.feedback.find(b=>b.id===session.feedback!.id)!;assert.notEqual(closeSignPracticeWrong(config,session,runtime({lessonActivities:[seen(session,branch.popupFrames[0]![0])]})),session);
  assert.equal(finishSignPracticeFeedback(config,quiz,outro,runtime({lessonActivities:[seen(outro,undefined,1,'completed')]})),outro);
  const end=seen(outro,undefined,2,'completed');assert.equal(finishSignPracticeFeedback(config,quiz,outro,runtime({paused:true,lessonActivities:[end]})),outro);
  assert.equal(finishSignPracticeFeedback(config,quiz,outro,runtime({lessonActivities:[{...end,sourceInstanceId:'sibling'}]})),outro);
  const ready=finishSignPracticeFeedback(config,quiz,outro,runtime({lessonActivities:[end]}));assert.equal(ready.quiz.mode,'ready');assert.equal(ready.quiz.drawCount,1);assert.equal(ready.feedback,null);assert.equal(ready.focusTarget,quiz.choices.find(c=>!c.correct)!.id);
  const detached=synchronizeSignPracticeSession(session,quiz,runtime({frame:quiz.activityFrame-1}));assert.equal(detached.feedback,null);assert.equal(detached.quiz.mode,'ready');assert.equal(detached.quiz.drawCount,session.quiz.drawCount);
  assert.equal(closeSignPracticeWrong(config,session,runtime({replay:1,lessonActivities:[seen(session,22)]})),session);
 });
 test(quiz.animationId+' correct terminal requests exact main edge once',()=>{
  const id=quiz.choices.find(c=>c.correct)!.id,initial=createSignPracticeSession(quiz,13),session=chooseSignPracticeAnswer(config,quiz,initial,id,runtime());
  assert.equal(observeSignPracticeFeedback(config,session,[seen(session,2)]).complete,false);
  assert.equal(finishSignPracticeFeedback(config,quiz,session,runtime({lessonActivities:[seen(session)]})),session);
  const end=seen(session,undefined,1,'completed');assert.equal(finishSignPracticeFeedback(config,quiz,session,runtime({lessonActivities:[end],onLessonFrameRequest:()=>false})),session);
  let calls=0,edge:unknown;const next=finishSignPracticeFeedback(config,quiz,session,runtime({lessonActivities:[end],onLessonFrameRequest:r=>{calls++;edge=r;return true;}}));assert.equal(calls,1);assert.deepEqual(edge,{fromFrame:quiz.activityFrame,toFrame:quiz.postCorrectStartFrame,stopFrame:quiz.postCorrectEndFrame});assert.equal(next.feedback,null);assert.equal(next.pendingFrame,quiz.activityFrame);
  assert.equal(finishSignPracticeFeedback(config,quiz,next,runtime({lessonActivities:[end],onLessonFrameRequest:()=>{calls++;return true;}})),next);assert.equal(calls,1);assert.equal(synchronizeSignPracticeSession(next,quiz,runtime({frame:quiz.postCorrectStartFrame})).pendingFrame,null);
 });
 test(quiz.animationId+' claimed revision replacement/out-of-range cannot finish',()=>{
  let session=chooseSignPracticeAnswer(config,quiz,createSignPracticeSession(quiz,13),quiz.choices.find(c=>c.correct)!.id,runtime());session={...session,feedback:{...session.feedback!,revision:2}};
  for(const a of [seen(session,undefined,1,'completed'),seen(session,undefined,3,'completed'),seen(session,0,2,'completed'),seen(session,999,2,'completed')])assert.equal(observeSignPracticeFeedback(config,session,[a]).complete,false);
 });
 test(quiz.animationId+' paused ready glossary retains focus eligibility while answers stay locked',()=>{
  const render=(extra:Partial<AnimationRendererProps>)=>renderToStaticMarkup(React.createElement(presentation.Renderer!,runtime(extra)));
  const buttons=(html:string,kind:'term'|'answer')=>(html.match(/<button\b[^>]*>/g)??[]).filter(tag=>tag.includes('class="vb-sign-native__'+kind+'"'));
  const paused=render({paused:true,onLessonHostRequest:()=>{}}),terms=buttons(paused,'term'),answers=buttons(paused,'answer');
  assert.equal(terms.length,1);assert.equal(answers.length,3);
  // Render the actual component: an enabled native button is eligible for the
  // retained host's savedTrigger.focus(), without advancing the paused quiz.
  for(const tag of terms){assert.doesNotMatch(tag,/\bdisabled(?:=|\s|>)/);assert.doesNotMatch(tag,/tabindex="-1"/);assert.match(tag,/type="button"/);}
  for(const tag of answers)assert.match(tag,/\bdisabled(?:=|\s|>)/);
  const running=render({paused:false,onLessonHostRequest:()=>{}});for(const tag of buttons(running,'answer'))assert.doesNotMatch(tag,/\bdisabled(?:=|\s|>)/);
  const missingHost=buttons(render({paused:true,onLessonHostRequest:undefined}),'term');assert.equal(missingHost.length,1);for(const tag of missingHost)assert.match(tag,/\bdisabled(?:=|\s|>)/);
  // The existing ready guard rejects the whole unsupported source identity;
  // it exposes no glossary or answer target that could receive focus.
  for(const extra of [{rootFrame:1},{lang:'es' as const},{entryStateSha256:'capture'}])assert.equal(render({...extra,paused:true,onLessonHostRequest:()=>{}}),'');
 });
 test(quiz.animationId+' native source snapshot/fallback and atomic signed values',()=>{
  const props=runtime(),state=getState(props.frame,props);assert.equal(getSignPracticeSnapshot(config,quiz,state,props).status,'ready');
  for(const extra of [{lang:'es' as const},{rootFrame:1},{entryStateSha256:'capture'},{seed:14}])assert.equal(getSignPracticeSnapshot(config,quiz,state,{...props,...extra}).status,'blocked');
  const html=renderToStaticMarkup(React.createElement(presentation.Renderer!,props));assert.match(html,/Negative Numbers: Important Words/);assert.match(html,/data-lesson-text-block="instruction"/);assert.match(html,quiz===Q7?/<span class="vb-sign-native__signed">-7<\/span>/:/<span class="vb-sign-native__signed">-9<\/span>/);assert.doesNotMatch(html,/<canvas|<svg|<foreignObject/);assert.match(html,/data-keyterm-entry-id="en-/);
  assert.equal(presentation.reducedMotionFrameByDomain![quiz.frameDomain],quiz.activityFrame);assert.equal(presentation.sourceTimelineAudioCues![0].frame,quiz===Q7?8:7);assert.equal(presentation.sourceTimelineAudioCues![0].endFrame,quiz.postCorrectEndFrame+1);
 });
}

test('VB007 independent ROCKET glyph word retains exact source child alpha, heading overlap and Replay isolation',()=>{
 const quiz=Q7,config=C['course-g04-l03-vb-007'],branch=config.feedback.find(b=>b.id==='correct-1')!;assert.equal(config.text['feedback-correct-1-rocket'],'ROCKET');
 assert.deepEqual(config.binding.blocks.find(b=>b.id==='feedback-correct-1-rocket')!.sourceTextIds,['character-122/run-0','character-121/run-0','character-120/run-0','character-119/run-0','character-118/run-0','character-117/run-0']);
 assert.deepEqual(branch.visibleFrames,[[10,25]]);assert(config.binding.blocks.find(b=>b.id==='feedback-correct-1-rocket')!.readingOrder<config.binding.blocks.find(b=>b.id==='feedback-correct-1')!.readingOrder);
 const session={...createSignPracticeSession(quiz,13),feedback:{id:'correct-1',stage:'intro' as const,revisionFloor:-1,revision:1}},expectedAlpha=[.01171875,.2578125,.5078125,.75390625,1,1,1,1,.66796875,.33203125,0];
 const context={frame:quiz.activityFrame,frameDomain:quiz.frameDomain,rootFrame:6,lang:'en' as const,seed:13,replay:0,scenario:'source-static-frame'};
 for(let frame=2;frame<=26;frame++){const alpha=expectedAlpha[frame-2]??0,activity={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:branch.frameDomain,frame,revision:1,status:'playing' as const};const seen=observeSignPracticeFeedback(config,session,[activity]);assert.equal(seen.wordAlpha,alpha);const snap=getSignPracticeSnapshot(config,quiz,F7(context.frame,context),context,session,[activity]);assert.equal(snap.blocks.find(b=>b.id==='feedback-correct-1-rocket')!.visible,frame<=11);assert.equal(snap.blocks.find(b=>b.id==='feedback-correct-1')!.visible,frame>=10&&frame<=25);if(frame===10||frame===11)assert.deepEqual(snap.blocks.filter(b=>b.visible&&b.id.startsWith('feedback-correct-1')).map(b=>b.id),['feedback-correct-1-rocket','feedback-correct-1']);}
 const visible={id:branch.id,sourceInstanceId:branch.sourceInstanceId,frameDomain:branch.frameDomain,frame:6,revision:1,status:'playing' as const};
 for(const activity of [{...visible,sourceInstanceId:'sibling'},{...visible,revision:2}])assert.equal(observeSignPracticeFeedback(config,session,[activity]).wordAlpha,0);
 for(const change of [{replay:1},{seed:14}]){const replay={...context,...change},snap=getSignPracticeSnapshot(config,quiz,F7(replay.frame,replay),replay,session,[visible]);assert.equal(snap.blocks.find(b=>b.id==='feedback-correct-1-rocket')!.visible,false);}
});
