'use client';

import React from 'react';
import type {LessonTextActivityDefinition, LessonTextBinding} from '../lesson-text-contract';
import {getCourseG04L01Ti005FrameState} from '../modules/course-g04-l01-ti-005';
import {G4_L1_TI005_SOURCE_DATA as SOURCE} from './generated/g4-l1-ti005-source-v1';
import {createSourceSixQuestionChoice, SourceChoiceText, type SixQuestionChoiceConfig, type SixQuestionChoiceHelpProps, type SixQuestionChoiceInstructionProps, type SixQuestionChoiceAnswerProps} from './source-six-question-choice';
const ID=SOURCE.animationId,sourceIds=(characterId:number)=>SOURCE.sourceText.find(d=>d.characterId===characterId)!.runs.map(r=>r.id),helpIds=(...runs:number[])=>runs.map(i=>`character-18/run-${i}`),helpText=(...runs:number[])=>runs.map(i=>SOURCE.helpRuns[i].text).join('').trim();
export const G4_L1_TI005_KEY_TERMS=Object.freeze({
  Form:{entryId:'en-0238-53a249c39c37',buttonCharacter:40},
  'Word form':{entryId:'en-0752-75ac39b16ae7',buttonCharacter:20},
  'Expanded form':{entryId:'en-0213-e59418748e28',buttonCharacter:21},
  'Standard form':{entryId:'en-0656-64b7053406f0',buttonCharacter:22},
  Value:{entryId:'en-0737-920ae135dd07',buttonCharacter:24},
});
export const G4_L1_TI005_KEY_TERMS_CAPABILITY=Object.freeze({indexLanguage:'en' as const,sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:Object.values(G4_L1_TI005_KEY_TERMS).map(t=>t.entryId)});
const helpDefinitions=[
  {id:'help-standard-definition',sourceTextIds:helpIds(0,1),role:'body' as const,text:helpText(0,1)},
  {id:'help-standard-example',sourceTextIds:helpIds(2),role:'label' as const,text:helpText(2)},
  {id:'help-word-definition',sourceTextIds:helpIds(3,4),role:'body' as const,text:helpText(3,4)},
  {id:'help-word-example',sourceTextIds:helpIds(5),role:'body' as const,text:helpText(5)},
  {id:'help-expanded-definition',sourceTextIds:helpIds(6,7,8,9),role:'body' as const,text:helpText(6,7,8,9)},
  {id:'help-expanded-example',sourceTextIds:helpIds(10),role:'label' as const,text:helpText(10)},
];
const definitions=[
  {id:'root-title',sourceTextIds:sourceIds(29),sourceShapeIds:[] as number[],role:'title' as const,text:SOURCE.sourceText.find(d=>d.characterId===29)!.runs.map(r=>r.text).join('')},
  {id:'exercise-number',sourceTextIds:sourceIds(33),sourceShapeIds:[31],role:'label' as const,text:SOURCE.sourceText.find(d=>d.characterId===33)!.runs.map(r=>r.text).join('')},
  {id:'instruction',sourceTextIds:[36,38,41].flatMap(sourceIds),sourceShapeIds:[] as number[],role:'question' as const,text:SOURCE.instructionFrames.at(-1)!.text},
  ...SOURCE.questions.flatMap(q=>[
    ...q.answers.map(a=>({id:`answer-${q.id}-${a.id}`,sourceTextIds:a.characterId?sourceIds(a.characterId):[],sourceShapeIds:[...a.sourceShapeIds],role:'answer' as const,text:a.text})),
    {id:`wrong-explanation-${q.id}`,sourceTextIds:['character-62'],sourceShapeIds:[] as number[],role:'feedback' as const,text:q.wrongExplanation},
  ]),
  ...SOURCE.feedback.map(b=>({id:`feedback-${b.id}`,sourceTextIds:b.characters.flatMap(sourceIds),sourceShapeIds:[] as number[],role:'feedback' as const,text:b.text})),
  {id:'help-button',sourceTextIds:[...sourceIds(4),...sourceIds(5)],sourceShapeIds:[] as number[],role:'label' as const,text:'Need More Help'},
  {id:'close',sourceTextIds:sourceIds(12),sourceShapeIds:[] as number[],role:'label' as const,text:'Close'},
  ...helpDefinitions.map(d=>({...d,sourceShapeIds:[] as number[]})),
];
export const G4_L1_TI005_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'g04-l01-placement-068-modern-equivalent-forms-v2',placementId:SOURCE.placementId,animationId:ID,sourceSwfSha256:SOURCE.sourceSha256,template:'exercise',
  blocks:definitions.map((d,readingOrder)=>({id:d.id,sourceTextIds:d.sourceTextIds,...(d.sourceShapeIds.length?{sourceShapeIds:d.sourceShapeIds}:{}),role:d.role,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const}))});
export const G4_L1_TI005_TEXT=Object.freeze(Object.fromEntries(definitions.map(d=>[d.id,d.text])));
function Term({name,label,runtime}:{readonly name:keyof typeof G4_L1_TI005_KEY_TERMS;readonly label:string;readonly runtime:SixQuestionChoiceHelpProps['runtime']}){const term=G4_L1_TI005_KEY_TERMS[name];return <button type="button" className="six-choice-modern__term" data-source-keyterm={name} data-keyterm-entry-id={term.entryId} data-source-button={term.buttonCharacter}
 disabled={!runtime.onLessonHostRequest} onClick={event=>runtime.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{label}</button>;}
function InstructionContent({runtime,text}:SixQuestionChoiceInstructionProps){return <>{text.split(/(forms)/g).map((part,index)=>part==='forms'?<Term key={index} name="Form" label="forms" runtime={runtime}/>:<SourceChoiceText key={index} text={part}/>)}</>;}
function HelpContent({runtime}:SixQuestionChoiceHelpProps){return <>
 <article className="six-choice-modern__help-example"><p data-lesson-text-block="help-standard-definition"><Term name="Standard form" label="Standard form" runtime={runtime}/> is a way to write numbers using digits.</p><p className="six-choice-modern__number" tabIndex={0} data-lesson-text-block="help-standard-example">123,456</p></article>
 <article className="six-choice-modern__help-example"><p data-lesson-text-block="help-word-definition"><Term name="Word form" label="Word form" runtime={runtime}/> is a way to write numbers using words.</p><p data-lesson-text-block="help-word-example">{G4_L1_TI005_TEXT['help-word-example']}</p></article>
 <article className="six-choice-modern__help-example"><p data-lesson-text-block="help-expanded-definition"><Term name="Expanded form" label="Expanded form" runtime={runtime}/> is a way to write numbers using the <Term name="Value" label="value" runtime={runtime}/> of each digit.</p><p data-lesson-text-block="help-expanded-example"><SourceChoiceText text="100,000 + 20,000 + 3,000 + 400 + 50 + 6"/></p></article>
 </>;}
/** The source shape297 contains this countable model. The native model retains
 * five grids, eight rods and eight cells without printing its numeric answer. */
export function G4L1Ti005BaseTenModel(){const model=SOURCE.model;return <svg className="six-choice-modern__base-ten" viewBox="0 0 232 164" role="img" aria-label="Base-ten blocks: five unit grids, eight tenths rods, eight hundredth units." style={{display:'block',inlineSize:'100%',maxInlineSize:'20rem',margin:'auto'}}>
 {Array.from({length:model.largeGrids},(_,i)=><g key={`whole-${i}`} data-model-piece="whole" transform={`translate(${8+i*44} 8)`}><rect width="36" height="36" fill="#12823c" stroke="#074b22" strokeWidth="1"/>{Array.from({length:9},(_,j)=><path key={j} d={`M${(j+1)*3.6} 0V36 M0 ${(j+1)*3.6}H36`} stroke="#075529" strokeWidth=".35"/>)}</g>)}
 {Array.from({length:model.rods},(_,i)=><g key={`tenth-${i}`} data-model-piece="tenth" transform={`translate(24 ${62+i*11})`}><rect width="36" height="3.6" fill="#12823c" stroke="#074b22" strokeWidth=".7"/>{Array.from({length:9},(_,j)=><path key={j} d={`M${(j+1)*3.6} 0V3.6`} stroke="#075529" strokeWidth=".3"/>)}</g>)}
 {Array.from({length:model.smallUnits},(_,i)=><rect key={`hundredth-${i}`} data-model-piece="hundredth" x="180" y={62+i*11} width="3.6" height="3.6" fill="#12823c" stroke="#074b22" strokeWidth=".7"/>)}
 </svg>;}
function AnswerContent({question,answer}:SixQuestionChoiceAnswerProps){return question.id==='q2'&&answer.id==='choice-3'?<G4L1Ti005BaseTenModel/>:<SourceChoiceText text={answer.text}/>;}
const sourcePlacementPath=(id:string)=>id.replace(/\/depth-(\d+)\/generation-(\d+)$/, '/depth-$1-generation-$2'),helpOpenIds=Object.fromEntries(SOURCE.questions.map(q=>[q.id,`help-open-${q.id}`])),helpCloseIds=Object.fromEntries(SOURCE.questions.map(q=>[q.id,`help-close-${q.id}`])),wrongCloseIds=Object.fromEntries(SOURCE.feedback.filter(b=>b.kind==='wrong').map(b=>[b.id,`${b.id}-close`]));
// Four authored NMHBtn placements are active for one question stop each.
const helpOpenInstances=['sprite-317/depth-26/generation-1','sprite-317/depth-46/generation-1','sprite-317/depth-26/generation-2','sprite-317/depth-26/generation-3'] as const;
export const G4_L1_TI005_BUTTON_ACTIVITIES:readonly LessonTextActivityDefinition[]=Object.freeze([
 ...SOURCE.questions.map((q,index)=>({id:helpOpenIds[q.id],sourceInstanceId:`${helpOpenInstances[index]}/button-26/record-5`,buttonPress:{sourceButtonId:26},parentLifetime:{firstFrame:q.frame,lastFrameExclusive:q.frame+1},parentFrames:[q.frame],frameDomain:'sprite-8',startFrame:1,endFrame:5,fps:12,audio:{...SOURCE.audio.find(a=>a.id==='help-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
 ...SOURCE.questions.map(q=>({id:helpCloseIds[q.id],sourceInstanceId:`${sourcePlacementPath(q.popupSourceCatalogInstanceId)}/depth-3-generation-1/button-17/record-10`,buttonPress:{sourceButtonId:17},parentLifetime:{firstFrame:q.frame,lastFrameExclusive:q.frame+1},parentFrames:[q.frame],frameDomain:'sprite-8',startFrame:1,endFrame:5,fps:12,audio:{...SOURCE.audio.find(a=>a.id==='help-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
 ...SOURCE.feedback.filter(b=>b.kind==='wrong').map(b=>({id:wrongCloseIds[b.id],sourceInstanceId:`${b.sourceInstanceId}/${sourcePlacementPath(b.popupSourceCatalogInstanceId!).replace(/^sprite-\d+\//,'')}/depth-3-generation-1/button-68/record-10`,buttonPress:{sourceButtonId:68},parentLifetime:b.parentLifetime,parentFrames:SOURCE.sourceStops,frameDomain:'sprite-67',startFrame:1,endFrame:5,fps:12,audio:{...SOURCE.audio.find(a=>a.id==='wrong-close-click')!,language:'shared' as const,spokenLanguage:'undetermined' as const}})),
]);
export const G4_L1_TI005_CONFIG:SixQuestionChoiceConfig=Object.freeze({...SOURCE,binding:G4_L1_TI005_TEXT_BINDING,text:G4_L1_TI005_TEXT,helpBlockIds:helpDefinitions.map(d=>d.id),HelpContent,InstructionContent,AnswerContent,
 // Source sprite317 depth2 text33 and depth1 circle31 share this frame1..8 alpha sequence.
 exerciseNumber:{blockId:'exercise-number',alphaFrames:[0,37,73,110,146,183,219,256].map((alpha,index)=>({frame:index+1,alpha}))},
 buttonActivities:G4_L1_TI005_BUTTON_ACTIVITIES,helpOpenActivityIds:helpOpenIds,helpCloseActivityIds:helpCloseIds,wrongCloseActivityIds:wrongCloseIds,keyTerms:G4_L1_TI005_KEY_TERMS_CAPABILITY,getFrameState:getCourseG04L01Ti005FrameState});
export const G4_L1_TI005_TEXT_PRESENTATION=createSourceSixQuestionChoice(G4_L1_TI005_CONFIG);
