'use client';
import React,{useEffect,useRef,useState} from 'react';
import {LessonSourceButton} from '../lesson-source-button';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import {isCompleteTraceCaptureIdentity,type SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {createLemonadeInteraction,synchronizeLemonadeInteraction,reduceLemonadeInteraction,lemonadeCurrentQuestion,lemonadeFeedback,
 lemonadeReadableQuestion,lemonadeDirections,lemonadeConfig,lemonadeBinding,lemonadeSnapshot,lemonadeActivities,lemonadeTransitions,lemonadeAudio,lemonadeModule,
 type LemonadeAction,type LemonadeChoice,type LemonadeConfig,type LemonadeTerm} from './lemonade-games-state';
const CSS=`
.lemonade-game{display:grid;gap:1.25rem;min-width:0;width:100%;overflow-wrap:normal;word-break:normal;hyphens:none;font-family:var(--lesson-font-body);font-size:1.375rem;line-height:1.6;color:#162b41}
.lemonade-game *{box-sizing:border-box}.lemonade-game h2,.lemonade-game h3{font-family:var(--lesson-font-display);font-weight:600;line-height:1.4;margin:0}.lemonade-game h2{font-size:1.75rem}.lemonade-game h3{font-size:1.5rem}.lemonade-game p{margin:0}
.lemonade-game .lemonade-game__title{font-size:2.25rem;line-height:1.25;white-space:normal;overflow-wrap:normal;word-break:normal;hyphens:none}
.lemonade-game button{font:inherit;line-height:inherit;cursor:pointer}.lemonade-game button:focus-visible{outline:3px solid #a64100;outline-offset:4px}.lemonade-game button:disabled{cursor:default;opacity:.7}
.lemonade-game__top{display:flex;align-items:center;justify-content:space-between;gap:1.25rem;flex-wrap:wrap}.lemonade-game__stand{width:12rem;height:auto;flex:0 0 auto;max-width:50%}
.lemonade-game__score{display:grid;gap:.2rem;min-width:7rem;padding:.7rem 1.1rem;border:2px solid #547d21;border-radius:1rem;background:#f4fbde;text-align:center}.lemonade-game__score output{font-family:var(--lesson-font-display);font-size:2.2rem;font-weight:600;line-height:1.2;font-variant-numeric:tabular-nums}.lemonade-game__score[data-changing="true"]{outline:3px solid #b0bc57;outline-offset:3px}
.lemonade-game__directions,.lemonade-game__question,.lemonade-game__final{display:grid;gap:1.1rem;padding:1.25rem;border:1px solid #bbcde1;border-radius:1rem;background:#fff;min-width:0}
.lemonade-game__directions>div{display:grid;gap:.65rem}.lemonade-game__choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));list-style:none;margin:0;padding:0;gap:.85rem}
.lemonade-game__choice{display:flex;align-items:center;text-align:left;gap:.8rem;padding:1rem;width:100%;min-height:5.8rem;border:2px solid #b3c9df;border-radius:.9rem;background:#f2f7fd;color:#142c45;overflow-wrap:normal;font-variant-numeric:tabular-nums}
.lemonade-game__choice>strong{flex:0 0 auto;color:#204f82}.lemonade-game__choice>span{min-width:0}.lemonade-game__choice:not(:disabled):hover{background:#e7f1fc;border-color:#356392}.lemonade-game__choice math{font-size:1.35em}
.lemonade-game__controls{display:flex;gap:.8rem;flex-wrap:wrap}.lemonade-game__controls button,.lemonade-game__close{padding:.4rem .9rem;border:2px solid #285c8e;border-radius:.65rem;color:#fff;background:#285c8e}.lemonade-game__controls button[data-secondary]{color:#285c8e;background:#fff}
.lemonade-game__term{max-width:100%;white-space:normal;overflow-wrap:normal;text-align:inherit;border:0;padding:0;color:#1d5ea4;background:transparent;text-decoration:underline;text-underline-offset:.16em;text-decoration-thickness:.07em}
.lemonade-game__feedback{padding:1rem;border-radius:.85rem;border:2px solid #bfcde0;min-height:5rem;background:#f5f8fe;display:grid;gap:.7rem}.lemonade-game__feedback>strong{font:600 1.75rem/1.4 var(--lesson-font-display)}.lemonade-game__feedback[data-kind="correct"]{color:#256234;border-color:#8ab28b;background:#f1faec}
.lemonade-game__dialog{position:relative;inset:auto;margin:0;padding:1.2rem;border:3px solid #476d96;border-radius:1rem;background:#fff;color:#142c45;font:inherit;width:100%;max-width:100%}.lemonade-game__dialog[open]{display:grid;gap:1rem}.lemonade-game__dialog>div:first-child{display:flex;justify-content:flex-end}
@media(max-width:500px){.lemonade-game{font-size:1.25rem;width:calc(100% + 16px);margin-inline:-8px}.lemonade-game h2{font-size:1.5rem}.lemonade-game__question,.lemonade-game__directions{padding:.85rem 4px}.lemonade-game__final{padding-inline:4px}.lemonade-game__feedback,.lemonade-game__dialog{padding-inline:6px}.lemonade-game__choices{grid-template-columns:1fr}.lemonade-game__choice{min-height:4.5rem;padding:.65rem 4px;flex-wrap:wrap;gap:.35rem .5rem}.lemonade-game__choice>span{flex:1 1 auto}.lemonade-game__stand{width:9rem}.lemonade-game__score output{font-size:1.9rem}.lemonade-game .lemonade-game__title{font-size:1.75rem}}
`;
const WORDS:Readonly<Record<string,string>>={Digit:'digits?',Thousandth:'thousandths?',Hundredth:'hundredths?','Place (Noun)':'place',Place:'place',Decimal:'decimals?',Number:'numbers?',Least:'least',Value:'values?',Represent:'represents?',Dollar:'dollars?',Quarter:'quarters?',Dime:'dimes?','Cent/cents':'pennies|cents?',Fraction:'fractions?',Equivalent:'equivalent',Money:'money',Sum:'sum',Problem:'problems?',Show:'shown|shows?'};
function Fraction({values}:{values:readonly number[]}){return React.createElement('math',{display:'inline','aria-label':`${values[0]} over ${values[1]}`},React.createElement('mfrac',null,React.createElement('mn',null,values[0]),React.createElement('mn',null,values[1])));}
function Stand(){return <svg className="lemonade-game__stand" viewBox="0 0 240 180" aria-hidden="true" focusable="false">
 <path d="M28 63H212V159H28Z" fill="#e3b976" stroke="#755b3d" strokeWidth="3"/><path d="M17 57 39 16H201L223 57Z" fill="#fff6b9" stroke="#755b3d" strokeWidth="3"/>
 <path d="M50 16 36 57M84 16 77 57M120 16V57M156 16 163 57M190 16 204 57" fill="none" stroke="#e5b949" strokeWidth="16"/>
 <path d="M22 64H218M42 159V177M199 159V177" fill="none" stroke="#755b3d" strokeWidth="6"/><rect x="64" y="67" width="112" height="36" rx="7" fill="#fff6cd"/>
 <ellipse cx="118" cy="85" rx="24" ry="12" fill="#e9c12c" stroke="#927a1e" strokeWidth="2"/><path d="M136 74q16-15 24 0-13 4-24 0" fill="#689544"/>
 <path d="M50 119H190M50 139H190" stroke="#b08b59" strokeWidth="3"/>
 </svg>;}
function Session({config:c,props,state,context}:{config:LemonadeConfig;props:AnimationRendererProps;state:SourceStaticCanvasFrameState;context:RuntimeContext}){
 const [stored,setStored]=useState(()=>createLemonadeInteraction(c,props.seed,props.replay??0));
 const s=synchronizeLemonadeInteraction(c,stored,context),activities=props.lessonActivities??(props.lessonActivity?[props.lessonActivity]:[]),feedback=lemonadeFeedback(c,s,activities);
 const snap=lemonadeSnapshot(c,state,context,s,activities),ready=snap.status==='ready'&&!isCompleteTraceCaptureIdentity(context),q=c.questions.find(q=>q.frame===state.frame),active=lemonadeCurrentQuestion(c,s);
 const heading=useRef<HTMLHeadingElement>(null),repeat=useRef<HTMLButtonElement>(null),dialog=useRef<HTMLDialogElement>(null),feedbackNode=useRef<HTMLDivElement>(null),consumed=useRef('');
 const text=(id:string)=>snap.blocks.find(b=>b.id===id&&b.visible)?.text??'';
 function dispatch(action:LemonadeAction){
  if(!ready)return false;
  const floor=Math.max(-1,...activities.map(a=>a.revision));
  const result=reduceLemonadeInteraction(c,s,state.frame,action.type==='answer'?{...action,revisionFloor:floor,scoreRevisionFloor:floor}:action);
  if(!result.allowed)return false;
  if(result.frameRequest&&props.onLessonFrameRequest?.(result.frameRequest)!==true)return false;
  if(result.activities.length){const requests=result.activities.map(id=>({id,parentFrame:state.frame,...result.fromActivity?{fromActivity:result.fromActivity}:{}}));
   // The host validates and starts the source feedback and score as one
   // transaction. No score or answer state is committed after a rejection.
   const accepted=requests.length>1?props.onLessonActivitiesRequest?.(requests):props.onLessonActivityRequest?.(requests[0]!);
   if(accepted!==true)return false;
  }
  setStored(result.nextState);return true;
 }
 useEffect(()=>{if(s.directions&&dialog.current&&!dialog.current.open){dialog.current.show();dialog.current.querySelector<HTMLButtonElement>('button')?.focus();}
  return()=>{if(s.directions){if(repeat.current?.isConnected)repeat.current.focus();else heading.current?.focus();}};},[s.directions]);
 useEffect(()=>{if(s.feedback)feedbackNode.current?.focus();},[s.feedback?.id]);
 useEffect(()=>{if(q&&!s.feedback)heading.current?.focus();},[q?.label,s.feedback?.id]);
 useEffect(()=>{if(!ready||!feedback.complete||!feedback.activity)return;const token=`${s.seed}:${s.replay}:${s.index}:${feedback.activity.id}:${feedback.activity.revision}`;
  if(consumed.current!==token&&dispatch({type:'feedback-complete'}))consumed.current=token;
 },[ready,feedback.complete,feedback.activity,s.index]);
 const attrs={'data-modern-lesson':c.id,'data-presentation-status':snap.status,'data-flash-frame':state.frame,'data-flash-frame-domain':state.frameDomain,'data-runtime-replay':props.replay??0,
  'data-game-started':s.started,'data-game-question':q?.label??'','data-game-index':s.index,'data-game-score':s.score,'data-game-complete':s.complete,'data-game-feedback':s.feedback?.id??'',
  'data-game-feedback-frame':feedback.activity?.frame??'','data-game-directions':s.directions?'open':'closed','data-game-order':s.order.join(',')};
 if(snap.status!=='ready')return <section {...attrs}/>;
 const term=(t:LemonadeTerm,label:string)=>ready&&props.onLessonHostRequest?<button type="button" className="lemonade-game__term" data-source-button-id={t.sourceButtonId} data-keyterm-entry-id={t.entryId}
  onClick={event=>{const decision=props.onLessonHostRequest?.({type:'open-keyterm',entryId:t.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget});event.currentTarget.dataset.lessonHostResult=decision?.status??'unhandled';}}>{label}</button>:label;
 function terms(content:string,entries:readonly LemonadeTerm[]){const possible=entries.filter(t=>WORDS[t.sourceKey]);if(!possible.length)return content;
  const pattern=new RegExp(`\\b(${possible.map(t=>WORDS[t.sourceKey]).join('|')})\\b`,'gi');let offset=0;const parts:React.ReactNode[]=[];
  for(const m of content.matchAll(pattern)){parts.push(content.slice(offset,m.index));const entry=possible.find(t=>new RegExp(`^(?:${WORDS[t.sourceKey]})$`,'i').test(m[0]))!;parts.push(<React.Fragment key={`${m.index}-${entry.entryId}`}>{term(entry,m[0])}</React.Fragment>);offset=m.index!+m[0].length;}parts.push(content.slice(offset));return parts;}
 const directions=()=> <div data-lesson-text-block="directions">{lemonadeDirections(c).map((line,index)=><p key={index}>{terms(line,c.directionTerms)}</p>)}</div>;
 const canAnswer=ready&&s.started&&q===active&&!s.feedback&&!s.directions&&s.pendingFromFrame!==state.frame&&Boolean(props.onLessonActivitiesRequest&&props.onLessonActivityRequest);
 return <section {...attrs} className="lemonade-game" lang="en" data-source-language-disposition="source-shared-untranslated-visual">
  <style>{CSS}</style>
  <h2 className="lemonade-game__title" data-lesson-text-block="root-title">{text('root-title')}</h2>
  <div className="lemonade-game__top"><Stand/>{state.frame>c.beginFrame&&<div className="lemonade-game__score" data-changing={activities.some(a=>a.id.startsWith('score-')&&a.status==='playing')}><span data-product-label>Earned</span><output data-lesson-text-block="score" aria-label={`Spark earned ${s.score} dollars`}>{text('score')}</output></div>}</div>
  {state.frame<=c.beginFrame&&!s.directions&&<section className="lemonade-game__directions"><h2 ref={heading} tabIndex={-1} data-product-label>Lemonade</h2>{directions()}</section>}
  {q&&<section className="lemonade-game__question"><p data-product-label>Problem {Math.min(s.index+1,10)} of 10</p><h2 ref={heading} tabIndex={-1} data-lesson-text-block={q.label}>{terms(lemonadeReadableQuestion(q.question),q.terms)}</h2>
   <ol className="lemonade-game__choices">{q.choices.map(a=><li key={a.letter}><button type="button" data-answer-choice={a.letter} data-lesson-text-block={`${q.label}-${a.letter}`} className="lemonade-game__choice" disabled={!canAnswer} aria-label={`${a.letter}. ${a.text}`} onClick={()=>dispatch({type:'answer',choice:a.letter as LemonadeChoice})}><strong>{a.letter}</strong><span>{a.fraction?<Fraction values={a.fraction}/>:a.text}</span></button></li>)}</ol>
  </section>}
  {s.feedback&&<div ref={feedbackNode} tabIndex={-1} className="lemonade-game__feedback" data-kind={s.feedback.kind} role="status" aria-live="polite">
   {feedback.visible&&<strong data-lesson-text-block={s.feedback.kind==='wrong'?'feedback-wrong':`feedback-${feedback.activity?.frameDomain.replace('sprite-','')}`}>{feedback.text}</strong>}
   {feedback.popup&&<><p data-lesson-text-block={`${q?.label}-wrong-message`}>{q?.wrongMessage}</p><div><LessonSourceButton runtime={props} activityId={`button-close-${s.feedback.id}`} type="button" className="lemonade-game__close" data-lesson-text-block="control-close" onClick={()=>feedback.activity&&dispatch({type:'close-feedback',activity:feedback.activity})}>Close</LessonSourceButton></div></>}
  </div>}
  {s.complete&&state.frame===c.finalFrame&&<section className="lemonade-game__final"><h2 ref={heading} tabIndex={-1} data-product-label>Game complete</h2><p data-product-label>{s.answered.filter(a=>a.correct).length} of 10 correct</p></section>}
  <div className="lemonade-game__controls">
   {text('control-start')&&<button type="button" data-lesson-text-block="control-start" disabled={!ready||s.directions||!props.onLessonFrameRequest} onClick={()=>dispatch({type:'start'})}>Start</button>}
   {text('control-skip')&&<button type="button" data-secondary data-lesson-text-block="control-skip" disabled={!ready||s.directions||!props.onLessonFrameRequest} onClick={()=>dispatch({type:'skip'})}>Skip Directions</button>}
   {text('control-repeat')&&<button type="button" ref={repeat} data-secondary data-lesson-text-block="control-repeat" disabled={!ready||Boolean(s.feedback)||s.directions} onClick={()=>dispatch({type:'repeat'})}>Repeat Directions</button>}
  </div>
  {s.directions&&<dialog ref={dialog} className="lemonade-game__dialog" aria-label="Lemonade game directions" onCancel={e=>{e.preventDefault();dispatch({type:'close-directions'});}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();dispatch({type:'close-directions'});}}}><div><LessonSourceButton runtime={props} activityId="button-close-directions" type="button" className="lemonade-game__close" data-lesson-text-block="control-close" onClick={()=>dispatch({type:'close-directions'})}>Close</LessonSourceButton></div>{directions()}</dialog>}
 </section>;
}
function createRenderer(c:LemonadeConfig){return function LemonadeRenderer(props:AnimationRendererProps){const context:RuntimeContext={...props,frameDomain:props.frameDomain??c.domain,rootFrame:props.rootFrame??6};
 const state=(props.state===undefined?lemonadeModule(c.id).getFrameState(props.frame,context):props.state) as SourceStaticCanvasFrameState;
 if(!state||typeof state!=='object')return <section data-modern-lesson={c.id} data-presentation-status="blocked"/>;
 return <Session key={`${state.seed}:${props.replay??0}`} config={c} props={props} state={state} context={context}/>;};}
function capability(c:LemonadeConfig):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{const cue=lemonadeAudio(c,c.domain);
 return Object.freeze({schemaVersion:1,binding:lemonadeBinding(c),Renderer:createRenderer(c),getSnapshot:(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>lemonadeSnapshot(c,state,context),
  playbackEndFrameByDomain:{[c.domain]:c.beginFrame},reducedMotionFrameByDomain:{[c.domain]:c.beginFrame},frameControl:{frameDomain:c.domain,completionFrame:c.finalFrame,transitions:lemonadeTransitions(c)},activityTimelines:lemonadeActivities(c),
  sourceTimelineAudioCues:[{id:`${c.id}-source-main`,source:cue.source,sha256:cue.sha256,language:cue.language,spokenLanguage:cue.spokenLanguage,frame:cue.firstFrame,endFrame:cue.lastFrame,frameDomain:c.domain}],
  ...c.terms.length?{keyTerms:{indexLanguage:'en' as const,sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:[...new Set(c.terms.map(t=>t.entryId))]}}:{}});
}
export const G3_L6_GS002_TEXT_PRESENTATION=capability(lemonadeConfig('g3-l6-gs002'));
export const G4_L1_GS002_TEXT_PRESENTATION=capability(lemonadeConfig('g4-l1-gs002'));
