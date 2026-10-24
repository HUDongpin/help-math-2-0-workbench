'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import {isCompleteTraceCaptureIdentity,type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import sourceModule from '../modules/course-g03-l06-ts-008';
import {ASSIGNED_SOURCE_MAIN_AUDIO} from './generated/assigned-main-audio-v1';
import {G3_L6_TS008_ID as ID,G3_L6_TS008_DOMAIN as DOMAIN,G3_L6_TS008_BINDING as binding,
 G3_L6_TS008_CHOICES as CHOICES,G3_L6_TS008_TRANSITIONS as TRANSITIONS,G3_L6_TS008_KEY_TERMS as KEY_TERMS,
 G3_L6_TS008_FEEDBACK as FEEDBACK,G3_L6_TS008_ACTIVITIES as ACTIVITIES,
 createG3L6Ts008Interaction,synchronizeG3L6Ts008Interaction,reduceG3L6Ts008Interaction,getG3L6Ts008FeedbackActivity,
 getG3L6Ts008Snapshot,getG3L6Ts008TeachingState,type G3L6Ts008Action,type G3L6Ts008Choice} from './g3-l6-ts008-state';
export {G3_L6_TS008_BINDING,G3_L6_TS008_ACTIVITIES,getG3L6Ts008Snapshot} from './g3-l6-ts008-state';

const STYLES=`
.g3-l6-ts008{font-family:var(--lesson-font-body);font-size:1.375rem;line-height:1.55;color:#142640;display:grid;gap:1.2rem;min-width:0;width:100%}
.g3-l6-ts008 *{box-sizing:border-box}.g3-l6-ts008 h2,.g3-l6-ts008 h3{font-family:var(--lesson-font-display);font-weight:600;color:#142640;line-height:1.35;margin:0}
.g3-l6-ts008 h2{font-size:1.75rem}.g3-l6-ts008 h3{font-size:1.5rem}.g3-l6-ts008 p{margin:0}.g3-l6-ts008 button{font:inherit;color:inherit;line-height:inherit;cursor:pointer}
.g3-l6-ts008 h2.g3-l6-ts008__title{font-size:clamp(1.75rem,1.5rem + 1cqi,2.25rem);line-height:1.25;min-inline-size:0;max-inline-size:100%;white-space:normal;overflow-wrap:normal;word-break:normal;hyphens:none}
.g3-l6-ts008 button:focus-visible{outline:3px solid #a64200;outline-offset:4px}.g3-l6-ts008 button:disabled{cursor:default}
.g3-l6-ts008__term{border:0;padding:0;background:none;color:#1654a4;text-decoration:underline;text-decoration-thickness:.075em;text-underline-offset:.16em;font:inherit}
.g3-l6-ts008__question,.g3-l6-ts008__step{border:1px solid #c9d6e5;border-radius:1rem;padding:1.1rem;display:grid;gap:1rem;background:#fff;min-width:0}
.g3-l6-ts008__question-model{display:flex;align-items:center;gap:1.3rem;flex-wrap:wrap}.g3-l6-ts008__question-model h2{flex:1 1 26rem}
.g3-l6-ts008__choices{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr));padding:0;margin:0;gap:.8rem}
.g3-l6-ts008__choice{border:2px solid #b4c9df;background:#f4f8ff;border-radius:.9rem;display:flex;align-items:center;justify-content:center;gap:.8rem;min-height:8rem;width:100%;padding:.7rem}
.g3-l6-ts008__choice strong{align-self:flex-start}.g3-l6-ts008__choice:disabled{background:#f7f9fc;color:#4f6177;border-color:#d3deeb}.g3-l6-ts008__choice:not(:disabled):hover{border-color:#1654a4;background:#eef5ff}
.g3-l6-ts008__grid{display:block;flex-shrink:0;max-width:100%;height:8rem;width:auto}.g3-l6-ts008__grid[data-total="100"]{width:8rem;height:8rem}
.g3-l6-ts008__steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start}.g3-l6-ts008__step{height:100%}
.g3-l6-ts008__math{display:flex;align-items:center;gap:.3em;flex-wrap:wrap;font-variant-numeric:tabular-nums;font-size:1.375rem}.g3-l6-ts008__math math{font-size:1.25em}
.g3-l6-ts008__math math mn{font-size:1.25rem}
.g3-l6-ts008__comparisons{display:grid;gap:1rem}.g3-l6-ts008__comparison{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;padding:.6rem 0;border-bottom:1px solid #e0e8f0}
.g3-l6-ts008__comparison:last-child{border:0}.g3-l6-ts008__comparison>strong{color:#1654a4}.g3-l6-ts008__verdict{font-size:1.6rem;font-weight:750;color:#a72b23}.g3-l6-ts008__verdict[data-correct="true"]{color:#16613a}
.g3-l6-ts008__answer{font-weight:800;color:#145f38}.g3-l6-ts008__controls{display:flex;gap:.75rem;flex-wrap:wrap}
.g3-l6-ts008__controls button,.g3-l6-ts008__dialog-actions button{border:2px solid #2351a5;border-radius:.8rem;padding:.45rem 1rem;background:#2351a5;color:white}
.g3-l6-ts008__controls button[data-secondary]{background:white;color:#2351a5}.g3-l6-ts008__controls button:disabled{opacity:.7}
.g3-l6-ts008__feedback{border:2px solid #b1c8e2;border-radius:1rem;background:#f1f7ff;min-height:5.5rem;padding:1rem;padding-inline:clamp(.25rem,3cqi,1rem);display:grid;align-items:center;font-size:1.7rem;font-family:var(--lesson-font-display)}
.g3-l6-ts008__feedback[data-outcome="correct"]{border-color:#4f8b6e;background:#f1fbf4;color:#145f38}
.g3-l6-ts008__dialog{position:relative;inset:auto;margin:0;max-width:100%;width:100%;border:3px solid #476da6;border-radius:1rem;padding:clamp(.5rem,3cqi,1.1rem);background:#fff;color:#142640;font:inherit}
.g3-l6-ts008__dialog[open]{display:grid;gap:1rem}.g3-l6-ts008__dialog-actions{display:flex;justify-content:flex-end}.g3-l6-ts008__help-content{display:grid;gap:1rem}
@media(max-width:900px){.g3-l6-ts008__steps{grid-template-columns:1fr}}
@media(max-width:500px){.g3-l6-ts008{font-size:1.25rem}.g3-l6-ts008 h2{font-size:1.5rem}.g3-l6-ts008 h3{font-size:1.375rem}.g3-l6-ts008__question,.g3-l6-ts008__step{padding:.8rem}.g3-l6-ts008__choice{gap:.35rem;padding:.4rem}.g3-l6-ts008__choice .g3-l6-ts008__grid[data-total="100"]{width:min(100%,6rem);height:auto}.g3-l6-ts008__math{font-size:1.25rem}}
`;
export function G3L6Ts008DecimalGrid({shaded,total,label}:{shaded:number;total:10|100;label?:string}){
 const size=total===100?100:10;
 return <svg className="g3-l6-ts008__grid" data-total={total} data-shaded={shaded} viewBox={`0 0 ${size} 100`} role="img"
  aria-label={label??`${shaded} shaded parts out of ${total}`}>
  {Array.from({length:total},(_,index)=><rect key={index} x={total===100?Math.floor(index/10)*10:0} y={index%10*10}
   width={10} height={10} fill={index<shaded?'#9cc832':'#fff'} stroke="#49637c" strokeWidth=".6"/>)}
 </svg>;
}
function Fraction({n,d}:{n:number;d:number}){return React.createElement('math',{display:'inline','aria-label':`${n} over ${d}`},
 React.createElement('mfrac',null,React.createElement('mn',null,n),React.createElement('mn',null,d)));}
function Session({props,state,context}:{props:AnimationRendererProps;state:SourceStaticCanvasFrameState;context:RuntimeContext}){
 const [stored,setStored]=useState(()=>createG3L6Ts008Interaction(props.seed,props.replay??0));
 const interaction=synchronizeG3L6Ts008Interaction(stored,context),snapshot=getG3L6Ts008Snapshot(state,context,interaction,props.lessonActivity),teaching=getG3L6Ts008TeachingState(state.frame);
 const dialog=useRef<HTMLDialogElement>(null),helpTrigger=useRef<HTMLButtonElement>(null),feedbackStatus=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const consumedActivity=useRef<string|null>(null),choiceButtons=useRef<Partial<Record<G3L6Ts008Choice,HTMLButtonElement|null>>>({});
 const ready=snapshot.status==='ready'&&!isCompleteTraceCaptureIdentity(context),locked=!ready||props.paused===true,pending=interaction.pendingFromFrame===state.frame;
 const canAnswer=ready&&teaching.quiz&&!interaction.help&&!interaction.feedback&&!pending&&Boolean(props.onLessonActivityRequest);
 const canContinue=ready&&[329,467,582,688].includes(state.frame)&&!interaction.help&&!interaction.feedback&&!pending;
 const canHelp=ready&&[329,467,582,688,799].includes(state.frame)&&!interaction.help&&!interaction.feedback&&!pending;
 const text=(id:string)=>snapshot.blocks.find(block=>block.id===id&&block.visible)?.text??'';
 function dispatch(action:G3L6Ts008Action){
  if(locked)return false;
  const result=reduceG3L6Ts008Interaction(interaction,state.frame,action.type==='answer'?{...action,activityRevisionFloor:props.lessonActivity?.revision??-1}:action);
  if(!result.allowed)return false;
  if(result.frameRequest&&props.onLessonFrameRequest?.(result.frameRequest)!==true)return false;
  if(action.type==='answer'&&result.nextState.feedback&&props.onLessonActivityRequest?.({id:result.nextState.feedback.id,parentFrame:state.frame})!==true)return false;
  setStored(result.nextState);return true;
 }
 useEffect(()=>{if(interaction.help&&dialog.current&&!dialog.current.open){dialog.current.show();dialog.current.querySelector<HTMLButtonElement>('button')?.focus();}
  return()=>{if(interaction.help){if(helpTrigger.current?.isConnected)helpTrigger.current.focus();else heading.current?.focus();}};},[interaction.help]);
 useEffect(()=>{if(!interaction.feedback)return;feedbackStatus.current?.focus();const selected=interaction.feedback.selected;
  return()=>{const target=choiceButtons.current[selected];if(target?.isConnected&&!target.disabled)target.focus();else heading.current?.focus();};},[interaction.feedback]);
 useEffect(()=>{if(locked||!getG3L6Ts008FeedbackActivity(interaction,props.lessonActivity).complete)return;
  const token=`${interaction.seed}:${interaction.replay}:${props.lessonActivity!.id}:${props.lessonActivity!.revision}`;
  if(consumedActivity.current===token)return;if(dispatch({type:'feedback-complete'}))consumedActivity.current=token;
 },[locked,interaction,props.lessonActivity]);
 const attrs={'data-modern-lesson':'g3-l6-ts008','data-presentation-status':snapshot.status,'data-flash-frame':state.frame,
  'data-flash-frame-domain':state.frameDomain,'data-runtime-replay':props.replay??0,'data-quiz-try-count':interaction.quizTryCount,
  'data-help-state':interaction.help??'closed','data-feedback-state':interaction.feedback?.kind??'none','data-feedback-id':interaction.feedback?.id??'',
  'data-feedback-activity-frame':props.lessonActivity?.frame??'','data-terminal-outcome':interaction.terminalOutcome??'none'};
 if(snapshot.status!=='ready')return <section {...attrs}/>;
 const term=(key:typeof KEY_TERMS[number]['sourceKey'],label:string)=>{
  const entry=KEY_TERMS.find(t=>t.sourceKey===key)!;
  if(!ready||!props.onLessonHostRequest)return <span>{label}</span>;
  return <button type="button" className="g3-l6-ts008__term" data-source-button-id={entry.sourceButtonId} data-keyterm-entry-id={entry.entryId}
   onClick={event=>{const decision=props.onLessonHostRequest?.({type:'open-keyterm',entryId:entry.entryId,sourceAnimationId:ID,
    playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});event.currentTarget.dataset.lessonHostResult=decision?.status??'unhandled';}}>{label}</button>;
 };
 const paragraph=(id:string,content?:React.ReactNode,answer=false)=>text(id)?<p data-lesson-text-block={id} className={answer?'g3-l6-ts008__answer':undefined}>{content??text(id)}</p>:null;
 const math=(id:string,children:React.ReactNode)=>text(id)?<div className="g3-l6-ts008__math" data-lesson-text-block={id} aria-label={text(id)}>{children}</div>:null;
 const verdict=(correct:boolean)=><span className="g3-l6-ts008__verdict" data-correct={correct} aria-label={correct?'equivalent':'not equivalent'}>{correct?'✓':'✗'}</span>;
 const picture=()=> <>
  <h3 data-lesson-text-block="step3-heading">{text('step3-heading')}</h3>
  <div className="g3-l6-ts008__question-model"><G3L6Ts008DecimalGrid shaded={3} total={10}/>
   {math('model-equivalence',<>0.3 = <Fraction n={3} d={10}/> = <Fraction n={30} d={100}/></>)}</div>
  <div className="g3-l6-ts008__comparisons">
   <div className="g3-l6-ts008__comparison"><strong>A</strong>{math('compare-A',<>0.03 = <Fraction n={3} d={100}/> ≠ <Fraction n={30} d={100}/>{verdict(false)}</>)}</div>
   <div className="g3-l6-ts008__comparison"><strong>B</strong>{math('compare-B',<><Fraction n={30} d={100}/> = <Fraction n={30} d={100}/>{verdict(true)}</>)}</div>
   <div className="g3-l6-ts008__comparison"><strong>C</strong>{math('compare-C',<>0.1 = 0.10 = <Fraction n={1} d={10}/><span>;</span><Fraction n={10} d={100}/> ≠ <Fraction n={30} d={100}/>{verdict(false)}</>)}</div>
   <div className="g3-l6-ts008__comparison"><strong>D</strong>{math('compare-D',<>0.7 = 0.70 = <Fraction n={7} d={10}/><span>;</span><Fraction n={70} d={100}/> ≠ <Fraction n={30} d={100}/>{verdict(false)}</>)}</div>
  </div>{paragraph('picture-answer',undefined,true)}
 </>;
 const reasoning=()=> <>
  <h3 data-lesson-text-block="step4-heading">{text('step4-heading')}</h3>
  {paragraph('strategy',<>Use {term('Strategy','strategy')}: Find a Pattern</>)}
  {math('fraction-pattern',<>{term('Fraction','Fractions')} that are equal to <Fraction n={3} d={10}/> include <Fraction n={30} d={100}/></>)}
  {paragraph('decimal-pattern',<>{term('Decimal','Decimals')} that are equal to 0.3 include 0.30</>)}
  <div className="g3-l6-ts008__question-model"><G3L6Ts008DecimalGrid shaded={30} total={100}/>{math('pattern-equivalence',<>= 0.30 = 0.3</>)}</div>
  {paragraph('reasoning-answer',undefined,true)}
 </>;
 return <section {...attrs} className="g3-l6-ts008" lang="en" data-source-language-disposition="source-shared-untranslated-visual">
  <style>{STYLES}</style>
  {ready&&<h2 className="g3-l6-ts008__title" data-lesson-text-block="root-title">{text('root-title')}</h2>}
  {teaching.question&&<div className="g3-l6-ts008__question">
   <div className="g3-l6-ts008__question-model"><h2 ref={heading} tabIndex={-1} data-lesson-text-block="question">
    This {term('Pictorial model','pictorial model')} {term('Represent','represents')} the {term('Decimal','decimal')} 0.3.
    {' '}Which {term('Pictorial model','pictorial model')} {term('Show','shows')} an {term('Equivalent decimal','equivalent decimal')}?
   </h2><G3L6Ts008DecimalGrid shaded={3} total={10}/></div>
   <ol className="g3-l6-ts008__choices" aria-label="Pictorial model choices">
    {CHOICES.map(choice=><li key={choice.letter} data-lesson-text-block={`choice-${choice.letter}`}>
     {teaching.quiz?<button type="button" className="g3-l6-ts008__choice" disabled={locked||!canAnswer} data-answer-choice={choice.letter}
      ref={node=>{choiceButtons.current[choice.letter]=node;}} aria-label={`${choice.letter}. ${choice.shaded} shaded parts out of ${choice.total}`}
      onClick={()=>dispatch({type:'answer',choice:choice.letter})}><strong>{choice.letter}</strong><G3L6Ts008DecimalGrid shaded={choice.shaded} total={choice.total}/></button>
      :<div className="g3-l6-ts008__choice"><strong>{choice.letter}</strong><G3L6Ts008DecimalGrid shaded={choice.shaded} total={choice.total}/></div>}
    </li>)}
   </ol>
  </div>}
  {interaction.feedback&&teaching.quiz&&<div ref={feedbackStatus} tabIndex={-1} className="g3-l6-ts008__feedback" data-outcome={interaction.feedback.kind} role="status" aria-live="polite">
   {text(`feedback-${interaction.feedback.id}`)&&<strong data-lesson-text-block={`feedback-${interaction.feedback.id}`}>{FEEDBACK.find(f=>f.id===interaction.feedback?.id)?.text}</strong>}
  </div>}
  <div className="g3-l6-ts008__steps">
   {teaching.step1&&<section className="g3-l6-ts008__step" aria-label="Step 1"><h3 data-lesson-text-block="step1-heading">{text('step1-heading')}</h3>{paragraph('step1-instruction',<>Which is the {term('Equivalent decimal','equivalent decimal')}?</>)}</section>}
   {teaching.step2&&<section className="g3-l6-ts008__step" aria-label="Step 2"><h3 data-lesson-text-block="step2-heading">{text('step2-heading')}</h3>
    {paragraph('given',<>Information given: {term('Decimal','decimal')} {term('Grid','grid')} with 0.3 {term('Show','shown')}</>)}
    {paragraph('needed',<>Information needed: which {term('Decimal','decimal')} {term('Pictorial model','pictorial model')} is {term('Equal','equal')} to 0.3?</>)}
   </section>}
   {teaching.step3&&<section className="g3-l6-ts008__step" aria-label="Step 3">{picture()}</section>}
   {teaching.step4&&<section className="g3-l6-ts008__step" aria-label="Step 4">{reasoning()}</section>}
  </div>
  {(canContinue||canHelp)&&<div className="g3-l6-ts008__controls">
   {canContinue&&<button type="button" disabled={locked||!props.onLessonFrameRequest} onClick={()=>dispatch({type:'continue'})}>Continue</button>}
   {canHelp&&<button type="button" ref={helpTrigger} data-secondary disabled={locked||(state.frame!==799&&!props.onLessonFrameRequest)} onClick={()=>dispatch({type:'open-help'})}>{state.frame===799?'Need More Help':'Help'}</button>}
  </div>}
  {ready&&interaction.help&&<dialog ref={dialog} className="g3-l6-ts008__dialog" aria-label="Equivalent decimals help"
   onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();dispatch({type:'close-help'});}}}
   onCancel={event=>{event.preventDefault();dispatch({type:'close-help'});}}>
   <div className="g3-l6-ts008__dialog-actions"><button type="button" disabled={locked} onClick={()=>dispatch({type:'close-help'})}>Close</button></div>
   <div className="g3-l6-ts008__help-content">{interaction.help==='picture'?picture():interaction.help==='reasoning'?reasoning():<>
    {paragraph('help-definition',<>{term('Equivalent decimal','Equivalent decimals')} are {term('Decimal','decimals')} that name the same number.</>)}
    <h3 data-lesson-text-block="help-example">{text('help-example')}</h3>
    <div className="g3-l6-ts008__question-model"><G3L6Ts008DecimalGrid shaded={20} total={100}/><div>{paragraph('help-represents',<>{term('Represent','Represents')} the {term('Decimal','decimal')} 0.20.</>)}{paragraph('help-equality')}</div></div>
    {paragraph('help-model',<>0.2 can be represented by the {term('Model','model')}:</>)}<G3L6Ts008DecimalGrid shaded={2} total={10}/>
   </>}</div>
  </dialog>}
 </section>;
}
export function G3L6Ts008ModernRenderer(props:AnimationRendererProps){
 const context:RuntimeContext={...props,frameDomain:props.frameDomain??DOMAIN,rootFrame:props.rootFrame??6};
 const state=(props.state===undefined?sourceModule.getFrameState(props.frame,context):props.state) as SourceStaticCanvasFrameState;
 if(!state||typeof state!=='object')return <section data-modern-lesson="g3-l6-ts008" data-presentation-status="blocked"/>;
 return <Session key={`${state.seed}:${props.replay??0}`} props={props} state={state} context={context}/>;
}
export const G3_L6_TS008_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>=Object.freeze({
 schemaVersion:1,binding,Renderer:G3L6Ts008ModernRenderer,getSnapshot:getG3L6Ts008Snapshot,
 playbackEndFrameByDomain:Object.freeze({[DOMAIN]:329}),reducedMotionFrameByDomain:Object.freeze({[DOMAIN]:329}),
 frameControl:Object.freeze({frameDomain:DOMAIN,completionFrame:816,transitions:TRANSITIONS}),activityTimelines:ACTIVITIES,
 sourceTimelineAudioCues:Object.freeze([ASSIGNED_SOURCE_MAIN_AUDIO[ID]]),
 keyTerms:Object.freeze({indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',
  entryIds:Object.freeze([...new Set(KEY_TERMS.map(term=>term.entryId))])}),
});
