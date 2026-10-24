'use client';

import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextActivityDefinition, LessonTextBinding, LessonTextBlockBinding} from '../lesson-text-contract';
import {getCourseG03L01Ti006FrameState} from '../modules/course-g03-l01-ti-006';
import {G3_L1_TI006_SOURCE_DATA as source} from './generated/g3-l1-ti006-source-v1';
import {createSourceSixQuestionChoice, SourceChoiceText, type SixQuestionChoiceConfig, type SixQuestionChoiceHelpProps, type SixQuestionChoiceQuestion} from './source-six-question-choice';

export const G3_L1_TI006_TERMS = Object.freeze({
  'Tens place': {entryId:'en-0688-95d11d39b1b1',buttons:[22]},
  Round: {entryId:'en-0590-a3b0d2491c13',buttons:[23]},
  'Ten thousands place': {entryId:'en-0687-cbc9f0f012bb',buttons:[24]},
  'Thousands Place': {entryId:'en-0697-2e58143f048e',buttons:[286]},
  'Hundreds place': {entryId:'en-0280-3d1c20dcc52b',buttons:[294]},
});
type TermName = keyof typeof G3_L1_TI006_TERMS;
const ids=(character:number)=>source.sourceText.find(t=>t.characterId===character)?.runs.map(r=>r.id)??[];
const helpRuns=(...runs:number[])=>runs.map(i=>`character-20/run-${i}`);
const HELP = Object.freeze([
  {id:'help-title-1',runs:[0],role:'heading',text:'Example 1:'},
  {id:'help-prompt-1',runs:[1,2,3,4],role:'body',text:'Round 46,789 to the ten thousand place.'},
  {id:'help-number-1',runs:[4,5,6,9,10,11,12,13],role:'body',text:'46,789'},
  {id:'help-low-1',runs:[7],role:'body',text:'If the digit to the right of the ten thousands place is 0, 1, 2, 3, 4, then do nothing.'},
  {id:'help-high-1',runs:[8,9],role:'body',text:'If the digit to the right of the ten thousands place is 5, 6, 7, 8, 9, then add 1 to the digit in the ten thousands place.'},
  {id:'help-conclusion-1',runs:[14,15],role:'body',text:'6 tells to add 1 to the digit in the ten thousands place and then change the rest of the digits to the right to 0s. 50,000'},
  {id:'help-title-2',runs:[16],role:'heading',text:'Example 2:'},
  {id:'help-prompt-2',runs:[17,18,19,20,21],role:'body',text:'Round 456 to the nearest tens place.'},
  {id:'help-number-2',runs:[20,21,22,23,25,26,27],role:'body',text:'456'},
  {id:'help-low-2',runs:[24],role:'body',text:'If the digit to the right of the tens place is 0, 1, 2, 3, 4, then do nothing.'},
  {id:'help-high-2',runs:[25,26,27],role:'body',text:'If the digit to the right of the tens place is 5, 6, 7, 8, 9, then add 1 to the digit in the tens place.'},
  {id:'help-conclusion-2',runs:[28],role:'body',text:'6 tells to add 1 to the digit in the tens place and the rest of the digits to the right become 0s. 460'},
] as const);
const blocks:LessonTextBlockBinding[]=[
  {id:'root-title',sourceTextIds:ids(30),role:'title',readingOrder:0},
  {id:'exercise-number',sourceTextIds:ids(35),sourceShapeIds:[33],role:'label',readingOrder:1},
  {id:'instruction',sourceTextIds:ids(36),role:'body',readingOrder:2},
  ...source.questions.flatMap((q,index)=>[
    {id:`question-${q.id}`,sourceTextIds:ids(q.questionCharacter),role:'question',readingOrder:10+index*10},
    ...q.answers.map((a,n)=>({id:`answer-${q.id}-${a.id}`,sourceTextIds:ids(a.characterId),role:'answer',readingOrder:11+index*10+n})),
    {id:`wrong-explanation-${q.id}`,sourceTextIds:['character-67'],role:'feedback',readingOrder:14+index*10},
  ]),
  ...source.feedback.map((b,index)=>({id:`feedback-${b.id}`,sourceTextIds:b.characters.flatMap(ids),role:'feedback',readingOrder:80+index})),
  ...HELP.map((h,index)=>({id:h.id,sourceTextIds:helpRuns(...h.runs),role:h.role,readingOrder:100+index})),
  {id:'close',sourceTextIds:ids(11),role:'label',readingOrder:120},
  {id:'help-button',sourceTextIds:[...ids(4),...ids(5)],role:'label',readingOrder:121},
].map(b=>({...b,role:b.role as LessonTextBlockBinding['role'],language:'en',valueSource:'maintained-page-state'}));
export const G3_L1_TI006_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'g03-l01-placement-063-modern-text-v2',placementId:source.placementId,animationId:source.animationId,sourceSwfSha256:source.sourceSha256,template:'exercise',blocks});
export const G3_L1_TI006_COPY:Readonly<Record<string,string>>=Object.freeze(Object.fromEntries([
 ['root-title',source.sourceText.find(t=>t.characterId===30)!.runs.map(r=>r.text).join('')],
 ['exercise-number',source.sourceText.find(t=>t.characterId===35)!.runs.map(r=>r.text).join('')],
 ['instruction','Click the correct answer.'],['close','Close'],['help-button','Need More Help'],
 ...source.questions.flatMap(q=>[[`question-${q.id}`,q.prompt],...q.answers.map(a=>[`answer-${q.id}-${a.id}`,a.text]),[`wrong-explanation-${q.id}`,q.wrongExplanation]]),
 ...source.feedback.map(f=>[`feedback-${f.id}`,f.text]),...HELP.map(h=>[h.id,h.text]),
]));
function Term({runtime,name,children}:{runtime:AnimationRendererProps;name:TermName;children:React.ReactNode}){
 const entry=G3_L1_TI006_TERMS[name];
 return <button type="button" className="six-choice-modern__term" data-keyterm-entry-id={entry.entryId} disabled={!runtime.onLessonHostRequest}
  onClick={event=>{const decision=runtime.onLessonHostRequest?.({type:'open-keyterm',entryId:entry.entryId,sourceAnimationId:source.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});event.currentTarget.dataset.lessonHostResult=decision?.status??'unhandled';}}>{children}</button>;
}
export function G3L1Ti006QuestionContent({runtime,question}:{runtime:AnimationRendererProps;question:SixQuestionChoiceQuestion}){
 const name:TermName=question.id==='q1'?'Ten thousands place':question.id==='q2'?'Thousands Place':question.id==='q3'?'Hundreds place':'Tens place';
 const target=question.id==='q1'?'ten thousands place':question.id==='q2'?'thousands place':question.id==='q3'?'hundreds place':'tens place';
 const split=question.prompt.indexOf(target);if(!question.prompt.startsWith('Round ')||split<0)throw new Error('Unexpected G3 L1 TI006 source question');
 return <><Term runtime={runtime} name="Round">Round</Term><SourceChoiceText text={question.prompt.slice(5,split)}/><Term runtime={runtime} name={name}>{target}</Term><SourceChoiceText text={question.prompt.slice(split+target.length)}/></>;
}
export function G3L1Ti006HelpContent({runtime}:SixQuestionChoiceHelpProps){
 return <>{[1,2].map(n=><section className="six-choice-modern__help-example" key={n}>
  <h3 data-lesson-text-block={`help-title-${n}`}>{G3_L1_TI006_COPY[`help-title-${n}`]}</h3>
  <p data-lesson-text-block={`help-prompt-${n}`}><Term runtime={runtime} name="Round">Round</Term>{n===1?' 46,789 to the ':' 456 to the nearest '}<Term runtime={runtime} name={n===1?'Ten thousands place':'Tens place'}>{n===1?'ten thousand place':'tens place'}</Term>.</p>
  <p className="six-choice-modern__number" role="img" tabIndex={0} data-lesson-text-block={`help-number-${n}`} aria-label={n===1?'46,789; the digit 6 determines rounding.':'456; the digit 6 determines rounding.'}>
   <span aria-hidden="true">{n===1?'4':'45'}<span className="six-choice-modern__digit">6<span>↑</span></span>{n===1?',789':''}</span>
  </p>
  <p data-lesson-text-block={`help-low-${n}`}><SourceChoiceText text={G3_L1_TI006_COPY[`help-low-${n}`]}/></p>
  <p data-lesson-text-block={`help-high-${n}`}><SourceChoiceText text={G3_L1_TI006_COPY[`help-high-${n}`]}/></p>
  <p data-lesson-text-block={`help-conclusion-${n}`}><SourceChoiceText text={G3_L1_TI006_COPY[`help-conclusion-${n}`]}/></p>
 </section>)}</>;
}
export const G3_L1_TI006_HELP_CLOSE_IDS=Object.freeze(Object.fromEntries(source.questions.map(q=>[q.id,`help-close-${q.id}`])));
export const G3_L1_TI006_WRONG_CLOSE_IDS=Object.freeze(Object.fromEntries(source.feedback.filter(f=>f.kind==='wrong').map(f=>[f.id,`${f.id}-close`])));
export const G3_L1_TI006_BUTTON_ACTIVITIES:readonly LessonTextActivityDefinition[]=Object.freeze([
 ...source.questions.map((q,index)=>({id:G3_L1_TI006_HELP_CLOSE_IDS[q.id],sourceInstanceId:`sprite-315/depth-30-generation-${index+1}/depth-3-generation-1/button-18/record-10`,buttonPress:{sourceButtonId:18},parentLifetime:{firstFrame:q.frame,lastFrameExclusive:q.frame+1},parentFrames:[q.frame],frameDomain:'sprite-17',startFrame:1,endFrame:5,fps:12,audio:{...source.audio.find(a=>a.id==='help-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
 ...source.feedback.filter(f=>f.kind==='wrong').map(f=>({id:G3_L1_TI006_WRONG_CLOSE_IDS[f.id],sourceInstanceId:`${f.sourceInstanceId}/Mc_Feed_Popup/depth-3-generation-1/button-73/record-10`,buttonPress:{sourceButtonId:73},parentLifetime:f.parentLifetime,parentFrames:source.sourceStops,frameDomain:'sprite-72',startFrame:1,endFrame:5,fps:12,audio:{...source.audio.find(a=>a.id==='wrong-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
]);
export const G3_L1_TI006_CONFIG={...source,binding:G3_L1_TI006_TEXT_BINDING,text:G3_L1_TI006_COPY,helpBlockIds:HELP.map(h=>h.id),HelpContent:G3L1Ti006HelpContent,QuestionContent:G3L1Ti006QuestionContent,buttonActivities:G3_L1_TI006_BUTTON_ACTIVITIES,helpCloseActivityIds:G3_L1_TI006_HELP_CLOSE_IDS,wrongCloseActivityIds:G3_L1_TI006_WRONG_CLOSE_IDS,
 // Native presence mapping for source text35/circle33 at10..90, not a source alpha animation.
 // The complete readable digit replaces its slight introductory mask crop.
 exerciseNumber:{blockId:'exercise-number',alphaFrames:[{frame:1,alpha:0},{frame:10,alpha:256},{frame:91,alpha:0}]},
 keyTerms:{indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:Object.values(G3_L1_TI006_TERMS).map(t=>t.entryId)},getFrameState:getCourseG03L01Ti006FrameState} satisfies SixQuestionChoiceConfig;
export const G3_L1_TI006_TEXT_PRESENTATION=createSourceSixQuestionChoice(G3_L1_TI006_CONFIG);
export const G3L1Ti006ModernRenderer=G3_L1_TI006_TEXT_PRESENTATION.Renderer;
