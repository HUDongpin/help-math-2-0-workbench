'use client';

import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import {getCourseG05L03Vb003FrameState} from '../modules/course-g05-l03-vb-003';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G5_L3_VB003_SOURCE_DATA as SOURCE} from './g5-l3-vb003.source-data';
import {G5_L3_VB003_MAIN_AUDIO} from './g5-l3-vb003.main-audio';
import {G5_L3_VB003_AUDIO_DATA as AUDIO} from './g5-l3-vb003.audio-data';

const ID='course-g05-l03-vb-003',DOMAIN='sprite-381';
const textIds=(character:number,count=1)=>Array.from({length:count},(_,run)=>`character-${character}/run-${run}`);
const inRanges=(frame:number,ranges:readonly(readonly[number,number])[])=>ranges.some(([first,last])=>frame>=first&&frame<=last);
export const G5_L3_VB003_KEY_TERMS=Object.freeze({
  Base:{entryId:'en-0032-a4e6c414e876',buttonCharacter:7},
  Exponent:{entryId:'en-0215-669164d1aee6',buttonCharacter:215},
  Expression:{entryId:'en-0217-33cf8ae1dd9a',buttonCharacter:8},
});
export const G5_L3_VB003_KEY_TERMS_CAPABILITY=Object.freeze({indexLanguage:'en' as const,sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:Object.values(G5_L3_VB003_KEY_TERMS).map(term=>term.entryId)});
export const G5_L3_VB003_FRAME_TRANSITIONS=Object.freeze([{fromFrame:40,toFrame:41,stopFrame:94},{fromFrame:94,toFrame:95,stopFrame:95}]);
export const G5_L3_VB003_FEEDBACK=SOURCE.feedback;
export const G5_L3_VB003_ACTIVITY_TIMELINES:readonly LessonTextActivityDefinition[]=Object.freeze(SOURCE.feedback.flatMap(branch=>{
  const audio={...AUDIO.find(asset=>asset.id===branch.id)!,language:'shared' as const,spokenLanguage:'undetermined' as const};
  const base={id:branch.id,frameDomain:`sprite-${branch.sprite}`,startFrame:2,endFrame:branch.kind==='wrong'?22:branch.endFrame,fps:12,parentFrames:[branch.question===1?40:94],audio};
  return branch.kind==='correct'?[base]:[base,{...base,id:`${branch.id}-outro`,startFrame:23,endFrame:branch.endFrame,
    entryFromActivity:{id:branch.id,firstFrame:branch.popupFrames[0]![0],lastFrame:22}}];
}));

export interface G5L3Vb003Interaction {
 readonly seed:number;readonly replay:number;readonly attempts:readonly[number,number];
 readonly feedback:Readonly<{id:typeof SOURCE.feedback[number]['id'];stage:'intro'|'outro';selected:5|3;revisionFloor:number;parentFrame:40|94}>|null;
 readonly pendingFromFrame:number|null;
}
export const createG5L3Vb003Interaction=(seed=0,replay=0):G5L3Vb003Interaction=>({seed:Number.isSafeInteger(seed)?seed>>>0:0,replay:Number.isSafeInteger(replay)?replay:0,attempts:[0,0],feedback:null,pendingFromFrame:null});
export function synchronizeG5L3Vb003Interaction(state:G5L3Vb003Interaction,context:RuntimeContext):G5L3Vb003Interaction {
 const identity=createG5L3Vb003Interaction(context.seed,context.replay??0);
 if(state.seed!==identity.seed||state.replay!==identity.replay||context.frame===1)return identity;
 if(state.pendingFromFrame!==null&&state.pendingFromFrame!==context.frame)return {...state,pendingFromFrame:null};
 if(state.feedback&&state.feedback.parentFrame!==context.frame)return {...state,feedback:null};
 return state;
}
export function getG5L3Vb003TeachingState(frame:number){return {
 expression:inRanges(frame,SOURCE.sourceBeats.expressionFrames),question1:inRanges(frame,SOURCE.sourceBeats.question1Frames),question2:inRanges(frame,SOURCE.sourceBeats.question2Frames),
 baseEmphasis:inRanges(frame,SOURCE.sourceBeats.baseEmphasis),exponentEmphasis:inRanges(frame,SOURCE.sourceBeats.exponentEmphasis),expressionEmphasis:inRanges(frame,SOURCE.sourceBeats.expressionEmphasis),
 question:frame<=40?1:2,canAnswer:frame===40||frame===94,terminal:frame===95,
};}
export function getG5L3Vb003FeedbackActivity(state:G5L3Vb003Interaction,activity?:LessonTextActivitySnapshot){
 const feedback=state.feedback,branch=SOURCE.feedback.find(b=>b.id===feedback?.id),expectedId=feedback?feedback.id+(feedback.stage==='outro'?'-outro':''):null;
 const definition=G5_L3_VB003_ACTIVITY_TIMELINES.find(d=>d.id===expectedId);
 const bound=Boolean(feedback&&branch&&activity&&definition&&activity.id===expectedId&&activity.frameDomain===definition.frameDomain&&activity.revision>feedback.revisionFloor&&Number.isInteger(activity.frame)&&activity.frame>=definition.startFrame&&activity.frame<=definition.endFrame);
 return {branch,bound,visible:bound&&inRanges(activity!.frame,branch!.visibleFrames),popup:bound&&feedback!.stage==='intro'&&branch!.kind==='wrong'&&inRanges(activity!.frame,branch!.popupFrames),
 complete:bound&&activity!.status==='completed'&&activity!.frame===definition!.endFrame&&(branch!.kind==='correct'||feedback!.stage==='outro')};
}
export function chooseG5L3Vb003Answer(state:G5L3Vb003Interaction,frame:number,value:5|3,revisionFloor=-1){
 if(![40,94].includes(frame)||state.feedback||state.pendingFromFrame===frame)return null;
 const question=frame===40?1:2,correct=(question===1&&value===5)||(question===2&&value===3),kind=correct?'correct':'wrong';
 // Source pools are random(3)+1 and random(4)+1. A seeded selection makes this
 // maintained renderer repeatable; it is not a claim of Flash RNG equivalence.
 const variant=((state.seed+state.attempts[question-1])%(correct?4:3))+1;
 const branch=SOURCE.feedback.find(b=>b.question===question&&b.kind===kind&&b.variant===variant)!;
 const attempts:[number,number]=[...state.attempts];attempts[question-1]++;
 return {...state,attempts,feedback:{id:branch.id,stage:'intro' as const,selected:value,revisionFloor,parentFrame:frame as 40|94}};
}

const definitions=[
 {id:'root-title',sourceTextIds:[...SOURCE.rootTitle.sourceTextIds],role:'title' as const,text:SOURCE.rootTitle.text},
 {id:'question-base',sourceTextIds:textIds(5,5),role:'question' as const,text:'Click the base in this expression.'},
 {id:'question-exponent',sourceTextIds:textIds(214,5),role:'question' as const,text:'Click the exponent in this expression.'},
 {id:'power-base',sourceTextIds:textIds(10),role:'label' as const,text:'5'},
 {id:'power-exponent',sourceTextIds:textIds(11),role:'label' as const,text:'3'},
 {id:'wrong-base-explanation',sourceTextIds:textIds(26,4),role:'feedback' as const,text:'In the expression 3², 3 is the base and 2 is the exponent. Try again.'},
 {id:'wrong-exponent-explanation',sourceTextIds:['character-222'],role:'feedback' as const,text:SOURCE.dynamicWrongFeedback},
 {id:'close',sourceTextIds:textIds(30),role:'label' as const,text:'Close'},
 ...SOURCE.feedback.map(branch=>({id:`feedback-${branch.id}`,sourceTextIds:branch.characters.flatMap(id=>textIds(id)),role:'feedback' as const,text:branch.text})),
];
export const G5_L3_VB003_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'g05-l03-placement-006-modern-text-v2',placementId:'g05-l03-placement-006',animationId:ID,sourceSwfSha256:SOURCE.sourceSha256,template:'exercise',
 blocks:definitions.map((row,readingOrder)=>({id:row.id,sourceTextIds:row.sourceTextIds,role:row.role,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const}))});
export function getG5L3Vb003TextSnapshot(state:SourceStaticCanvasFrameState,context:RuntimeContext,interaction=createG5L3Vb003Interaction(context.seed,context.replay??0),activity?:LessonTextActivitySnapshot):TextPresentationSnapshot {
 const expected=getCourseG05L03Vb003FrameState(context.frame,{...context,frameDomain:context.frameDomain??DOMAIN}),blockers:string[]=[];
 if(state.sourceSwfSha256!==SOURCE.sourceSha256)blockers.push('source-identity-mismatch');
 if((context.frameDomain??DOMAIN)!==DOMAIN||state.frameDomain!==DOMAIN)blockers.push('unsupported-frame-domain');
 if(context.lang!=='en'||state.language!=='en')blockers.push('source-verified-spanish-page-text-missing');
 if(context.scenario!=='source-static-frame'||state.scenario!=='source-static-frame')blockers.push('unsupported-scenario');
 if(context.entryStateSha256)blockers.push('source-capture-requires-original-renderer');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>95||state.frame!==context.frame||state.rootFrame!==6||(context.rootFrame!==undefined&&context.rootFrame!==6)||state.seed!==expected.seed)blockers.push('teaching-state-identity-mismatch');
 // This modern semantic implementation owns the explicitly audited source
 // stops 40..95. The original static Canvas state/guard remains unchanged.
 if(state.animationId!==ID||state.status!==expected.status||state.blocker!==expected.blocker||state.exportFrame!==expected.exportFrame||state.rootState!==expected.rootState||state.sourceStaticVisualReady!==expected.sourceStaticVisualReady||state.interactiveControlsEnabled!==false||state.sourceHostBehaviorResolved!==false||state.naturalRuntimeEstablished!==false||state.audioRendered!==false||JSON.stringify(state.visibleSourceMarkers)!==JSON.stringify(expected.visibleSourceMarkers))blockers.push('unexpected-original-static-state');
 const session=synchronizeG5L3Vb003Interaction(interaction,context),teaching=getG5L3Vb003TeachingState(state.frame),feedback=getG5L3Vb003FeedbackActivity(session,activity);
 const visible=(id:string)=>id==='root-title'?true:id==='question-base'?teaching.question1:id==='question-exponent'?teaching.question2:id.startsWith('power-')?teaching.expression:
 id==='close'?feedback.popup:id==='wrong-base-explanation'?feedback.popup&&feedback.branch?.question===1:id==='wrong-exponent-explanation'?feedback.popup&&feedback.branch?.question===2:id===`feedback-${session.feedback?.id}`&&feedback.visible;
 return {schemaVersion:1,animationId:ID,bindingVersion:G5_L3_VB003_TEXT_BINDING.version,sourceSwfSha256:SOURCE.sourceSha256,status:blockers.length?'blocked':'ready',blockers,
 identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
 blocks:blockers.length?[]:G5_L3_VB003_TEXT_BINDING.blocks.map(block=>({...block,text:definitions.find(d=>d.id===block.id)!.text,visible:visible(block.id)}))};
}

const CSS=`
.vb003-modern{box-sizing:border-box;container:vb003 / inline-size;inline-size:100%;min-block-size:18rem;background:#fffdf8;color:#17273c;padding:clamp(12px,3cqi,28px);font-family:var(--lesson-font-body,"Nunito Sans",system-ui,sans-serif);font-size:1.25rem;line-height:1.6;border-radius:1rem}.vb003-modern *{box-sizing:border-box}.vb003-modern__title{font-family:var(--lesson-font-display,"Fredoka",system-ui,sans-serif);font-size:clamp(28px,calc(1rem + 2cqi),36px);font-weight:600;line-height:1.3;margin:0 0 1rem;overflow-wrap:normal;hyphens:none}.vb003-modern p{margin:.65em 0;overflow-wrap:anywhere}.vb003-modern__question{background:#edf5ff;border:1px solid #bad0ec;border-radius:.8rem;padding:clamp(12px,3cqi,24px);min-block-size:4rem}.vb003-modern button{font:inherit;color:inherit;min-inline-size:44px;min-block-size:44px;cursor:pointer}.vb003-modern button:disabled{cursor:default}.vb003-modern button:focus-visible{outline:3px solid #174ea6;outline-offset:4px}.vb003-modern__term{border:0;border-radius:.15em;background:none;color:#174ea6!important;padding:0 .04em;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;line-height:inherit}.vb003-modern__term[data-emphasis=true]{background:#f6e495;font-weight:800}.vb003-modern__power{display:flex;align-items:flex-start;justify-content:center;gap:.1em;padding:2.2rem 1rem;margin:1rem auto;inline-size:max-content;max-inline-size:100%;font-family:var(--lesson-font-display,"Fredoka",system-ui,sans-serif);font-variant-numeric:tabular-nums}.vb003-modern__digit{border:2px solid transparent;background:none;padding:.12em .24em;border-radius:.3em;line-height:1.1}.vb003-modern__digit[data-digit="5"]{font-size:clamp(3rem,12cqi,5rem);margin-block-start:.35em}.vb003-modern__digit[data-digit="3"]{font-size:clamp(1.75rem,7cqi,2.8rem)}.vb003-modern__digit:not(:disabled){border-color:#829cbb;background:#fff}.vb003-modern__digit:not(:disabled):hover{background:#edf5ff;border-color:#174ea6}.vb003-modern__feedback{border:2px solid #ac573f;background:#fff8f3;border-radius:.8rem;padding:1rem;min-block-size:4rem}.vb003-modern__feedback[data-kind=correct]{border-color:#287446;background:#eff9f1}.vb003-modern__dialog{border:2px solid #9ab1cb;background:#fff;border-radius:.8rem;padding:clamp(12px,3cqi,24px);inline-size:100%;margin-block:1rem}.vb003-modern__action{border:1px solid #174ea6;background:#174ea6;color:#fff!important;border-radius:.5rem;padding:.5rem 1rem}.vb003-modern__dialog sup{font-size:1em;position:relative;top:-.35em;vertical-align:baseline}.vb003-modern__terminal{display:flex;justify-content:center;margin-block:1rem}.vb003-modern [hidden]{display:none!important}@container vb003 (max-width:20rem){.vb003-modern__title{margin-inline:-8px}}@container vb003 (max-width:40rem){.vb003-modern{font-size:1.125rem}}
`;
export function G5L3Vb003ModernRenderer(props:AnimationRendererProps){
 const context={...props,frameDomain:props.frameDomain??DOMAIN},state=(props.state??getCourseG05L03Vb003FrameState(props.frame,context)) as SourceStaticCanvasFrameState;
 const [stored,setStored]=useState(()=>createG5L3Vb003Interaction(props.seed,props.replay??0)),interaction=synchronizeG5L3Vb003Interaction(stored,context),feedback=getG5L3Vb003FeedbackActivity(interaction,props.lessonActivity);
 const snapshot=getG5L3Vb003TextSnapshot(state,context,interaction,props.lessonActivity),teaching=getG5L3Vb003TeachingState(state.frame);
 const root=useRef<HTMLElement>(null),consumed=useRef<string|null>(null),previousFeedback=useRef<G5L3Vb003Interaction['feedback']>(null);
 const ready=snapshot.status==='ready',locked=!ready||props.paused===true,canAnswer=teaching.canAnswer&&!interaction.feedback&&interaction.pendingFromFrame!==state.frame&&Boolean(props.onLessonActivityRequest);
 useEffect(()=>{
  if(locked||!feedback.complete||!interaction.feedback||!props.lessonActivity)return;
  const token=`${interaction.seed}:${interaction.replay}:${props.lessonActivity.id}:${props.lessonActivity.revision}`;
  if(consumed.current===token)return;
  if(feedback.branch!.kind==='correct'){
   const edge=G5_L3_VB003_FRAME_TRANSITIONS.find(edge=>edge.fromFrame===state.frame)!;
   if(props.onLessonFrameRequest?.(edge)!==true)return;
   setStored({...interaction,feedback:null,pendingFromFrame:state.frame});
  }else setStored({...interaction,feedback:null});
  consumed.current=token;
 },[locked,feedback.complete,interaction,props.lessonActivity,state.frame,props.onLessonFrameRequest]);
 useLayoutEffect(()=>{
  let target:string|null=null;
  if(feedback.popup)target='close';else if(interaction.feedback)target='feedback';
  else if(previousFeedback.current?.stage==='outro')target=`digit-${previousFeedback.current.selected}`;
  else if(teaching.canAnswer)target='digit-5';else if(teaching.terminal)target='replay';
  if(target)root.current?.querySelector<HTMLElement>(`[data-vb003-focus="${target}"]`)?.focus();
  previousFeedback.current=interaction.feedback;
 },[feedback.popup,interaction.feedback?.id,interaction.feedback?.stage,teaching.canAnswer,teaching.terminal,props.replay]);
 if(!ready)return null;
 const text=(id:string)=>snapshot.blocks.find(b=>b.id===id&&b.visible)?.text??'';
 const term=(name:keyof typeof G5_L3_VB003_KEY_TERMS,label:string,emphasis=false)=><button className="vb003-modern__term" type="button" data-source-keyterm={name} data-source-button={G5_L3_VB003_KEY_TERMS[name].buttonCharacter} data-emphasis={emphasis} disabled={!props.onLessonHostRequest}
 onClick={event=>props.onLessonHostRequest?.({type:'open-keyterm',entryId:G5_L3_VB003_KEY_TERMS[name].entryId,sourceAnimationId:ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{label}</button>;
 const choose=(value:5|3)=>{if(locked||!canAnswer)return;const next=chooseG5L3Vb003Answer(interaction,state.frame,value,props.lessonActivity?.revision??-1);if(next&&props.onLessonActivityRequest?.({id:next.feedback!.id,parentFrame:state.frame})===true)setStored(next);};
 const close=()=>{if(locked||!feedback.popup||!interaction.feedback||!props.lessonActivity)return;const current=props.lessonActivity;
  if(props.onLessonActivityRequest?.({id:`${interaction.feedback.id}-outro`,parentFrame:state.frame,fromActivity:{id:current.id,revision:current.revision}})!==true)return;
  setStored({...interaction,feedback:{...interaction.feedback,stage:'outro',revisionFloor:current.revision}});
 };
 return <section ref={root} className="vb003-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status={snapshot.status} data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={props.replay??0} data-feedback-activity-id={props.lessonActivity?.id??''} data-feedback-activity-frame={props.lessonActivity?.frame??''} data-feedback-stage={interaction.feedback?.stage??''} data-source-static-state={state.status}>
  <style>{CSS}</style><h2 className="vb003-modern__title" data-lesson-text-block="root-title">{text('root-title')}</h2><div hidden={feedback.popup}>
   {text('question-base')&&<p className="vb003-modern__question" data-lesson-text-block="question-base">Click the {term('Base','base',teaching.baseEmphasis)} in this {term('Expression','expression',teaching.expressionEmphasis)}.</p>}
   {text('question-exponent')&&<p className="vb003-modern__question" data-lesson-text-block="question-exponent">Click the {term('Exponent','exponent',teaching.exponentEmphasis)} in this {term('Expression','expression',teaching.expressionEmphasis)}.</p>}
   {teaching.expression&&<div className="vb003-modern__power" role="group" aria-label="5 to the power of 3">
    {([5,3] as const).map(value=><button type="button" key={value} className="vb003-modern__digit" data-digit={value} data-vb003-focus={`digit-${value}`} data-lesson-text-block={value===5?'power-base':'power-exponent'} aria-label={String(value)} disabled={locked||!canAnswer} onClick={()=>choose(value)}>{value}</button>)}
   </div>}
  </div>
  {interaction.feedback&&<div className="vb003-modern__feedback" data-kind={feedback.branch?.kind} data-vb003-focus="feedback" role="status" aria-live="polite" tabIndex={-1}>{feedback.visible&&<p data-lesson-text-block={`feedback-${interaction.feedback.id}`}>{feedback.branch?.text}</p>}</div>}
  {feedback.popup&&<div className="vb003-modern__dialog" role="dialog" aria-modal="true" aria-label="Try again" onKeyDown={event=>{if(event.key==='Escape'&&!locked){event.preventDefault();close();}if(event.key==='Tab'){event.preventDefault();event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus();}}}>
   {feedback.branch?.question===1?<p data-lesson-text-block="wrong-base-explanation">In the expression 3<sup>2</sup>, 3 is the base and 2 is the exponent. Try again.</p>:<p data-lesson-text-block="wrong-exponent-explanation">{SOURCE.dynamicWrongFeedback}</p>}
   <button type="button" className="vb003-modern__action" data-vb003-focus="close" data-lesson-text-block="close" disabled={locked} onClick={close}>Close</button>
  </div>}
  {teaching.terminal&&<div className="vb003-modern__terminal"><button type="button" className="vb003-modern__action" data-vb003-focus="replay" onClick={props.onReplay} disabled={!props.onReplay}>Replay</button></div>}
 </section>;
}
export const G5_L3_VB003_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>=Object.freeze({schemaVersion:1,binding:G5_L3_VB003_TEXT_BINDING,Renderer:G5L3Vb003ModernRenderer,getSnapshot:getG5L3Vb003TextSnapshot,
 sourceTimelineAudioCues:[G5_L3_VB003_MAIN_AUDIO],playbackEndFrameByDomain:{[DOMAIN]:40},reducedMotionFrameByDomain:{[DOMAIN]:40},frameControl:{frameDomain:DOMAIN,completionFrame:95,transitions:G5_L3_VB003_FRAME_TRANSITIONS},activityTimelines:G5_L3_VB003_ACTIVITY_TIMELINES,keyTerms:G5_L3_VB003_KEY_TERMS_CAPABILITY});
