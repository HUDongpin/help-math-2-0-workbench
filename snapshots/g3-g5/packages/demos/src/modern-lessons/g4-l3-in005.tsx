'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG04L03In005FrameState} from '../modules/course-g04-l03-in-005';
import {LessonSourceButton} from '../lesson-source-button';
import {G4_L3_IN005_SOURCE_DATA as SOURCE} from './g4-l3-in005-source.generated';
import {CARDS,TARGETS,createCourseG04L03In005OrderingState,placedCount,G4_L3_IN005_ID as ID,G4_L3_IN005_DOMAIN as DOMAIN,
 G4_L3_IN005_ACTIVITIES,G4_L3_IN005_TRANSITION,G4_L3_IN005_KEY_TERMS,G4_L3_IN005_TEXT_BINDING,
 getG4L3In005TextSnapshot,getG4L3In005TeachingState,g4L3In005SessionIdentity,canInteractG4L3In005,planG4L3In005Action,admitG4L3In005Plan,
 newG4L3In005ActivityTicket,observeG4L3In005Activity,planG4L3In005CoachCompletion,isG4L3In005Complete,
 type OrderingState,type OrderingAction,type In005ActivityTicket} from './g4-l3-in005-state';
export * from './g4-l3-in005-state';
const format=(value:number)=>value<0?`−${-value}`:String(value);
const COMPLETION_ID='g4-l3-in005-terminal';
const STYLES=`
.in005-modern{font-family:var(--lesson-font-body,system-ui,sans-serif);color:#14213d;display:grid;gap:1.25rem;min-inline-size:0;max-inline-size:70rem;margin-inline:auto;container-type:inline-size}
.in005-modern p{font-size:var(--lesson-text-body-size,1.25rem);line-height:1.6;margin:0;max-inline-size:70ch}
.in005-modern__instruction{min-block-size:3.2em}
.in005-modern__cards{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
.in005-modern fieldset{border:0;padding:0;margin:0;min-inline-size:0}
.in005-modern legend{font-size:1.125rem;font-weight:700;line-height:1.5;margin-block-end:.75rem}
.in005-modern button,.in005-modern__card,.in005-modern__slot{box-sizing:border-box;min-inline-size:44px;min-block-size:44px;border:2px solid #365071;border-radius:.5rem;background:#fff;color:#14213d;font:700 1.125rem/1.4 var(--lesson-font-body,system-ui,sans-serif);padding:.45rem .65rem}
.in005-modern button{cursor:pointer;touch-action:manipulation}
.in005-modern button:disabled{cursor:default}
.in005-modern button[aria-pressed=true]{outline:3px solid #155ac1;outline-offset:3px;background:#edf4ff}
.in005-modern button:focus-visible,.in005-modern__viewport:focus-visible{outline:3px solid #155ac1;outline-offset:3px}
.in005-modern__viewport{max-inline-size:100%;overflow:auto;border:1px solid #7a879c;border-radius:1rem;overscroll-behavior-inline:contain;scroll-padding-inline:1rem;background:#fffdf7;padding:.75rem}
.in005-modern__ordering{min-inline-size:30rem}
.in005-modern__endpoints{display:flex;justify-content:space-between;gap:1rem;font-size:1.125rem;line-height:1.5;font-weight:700;margin-block-end:.75rem}
.in005-modern__endpoint{border:2px solid transparent;border-radius:.35rem;padding:.2rem .4rem}
.in005-modern__endpoint[data-emphasized=true]{border-color:#155ac1;background:#e6efff;text-decoration:underline;text-decoration-thickness:.15em}
.in005-modern__slots{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(7,minmax(3.5rem,1fr));gap:.65rem}
.in005-modern__slot{display:grid;place-items:center;inline-size:100%;min-block-size:3.5rem;border-style:dashed}
.in005-modern__slot[data-emphasized=true]{border:3px solid #155ac1;background:#e6efff}
.in005-modern__slot[data-placed=true]{border-style:solid;background:#e7f3eb}
.in005-modern__card{transition-property:none}.in005-modern__card[data-placed=true]{visibility:hidden}
.in005-modern .in005-modern__term{display:inline;min-block-size:44px;border:0;border-radius:0;background:transparent;color:#164eaa;font:inherit;text-decoration:underline;text-underline-offset:.15em;padding:.15rem .1rem;vertical-align:baseline}
.in005-modern__feedback{border:2px solid #a52c43;border-radius:.75rem;padding:clamp(12px,3cqi,16px);display:grid;gap:.75rem;background:#fff2f3}
.in005-modern__feedback--correct{border-color:#22663d;background:#eef8f1}
.in005-modern__sr{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@container (max-width:40rem){.in005-modern p{font-size:1.125rem}}
`;
interface PresentationProps{runtime:AnimationRendererProps;interaction:OrderingState;onAction:(action:OrderingAction)=>void;wrongCloseRef?:React.Ref<HTMLButtonElement>;}
/** The same semantic view is used at every width, including deterministic SSR. */
export function G4L3In005Presentation({runtime,interaction,onAction,wrongCloseRef}:PresentationProps){
 const state=(runtime.state??getCourseG04L03In005FrameState(runtime.frame,runtime)) as SourceStaticCanvasFrameState;
 const activities=runtime.lessonActivities??(runtime.lessonActivity?[runtime.lessonActivity]:[]);
 const snapshot=getG4L3In005TextSnapshot(state,{...runtime,frameDomain:runtime.frameDomain??DOMAIN},interaction,activities);
 if(snapshot.status!=='ready')return <p role="status">This lesson view is unavailable in the selected context.</p>;
 const teaching=getG4L3In005TeachingState(state.frame),live=canInteractG4L3In005(runtime,snapshot),locked=!live||interaction.locked;
 const blocks=Object.fromEntries(snapshot.blocks.map(b=>[b.id,b]));
 const instruction=teaching.instruction.split(/(order|least|greatest)/g).map((part,index)=>{
  const term=teaching.glossary.find(t=>t.word===part);
  return term&&runtime.onLessonHostRequest&&!runtime.entryStateSha256?<button key={index} type="button" className="in005-modern__term"
   data-keyterm-entry-id={term.entryId} data-source-button-id={term.sourceButtonId}
   onClick={event=>runtime.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:ID,
    playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'})}>{part}</button>:part;
 });
 const drop=(event:React.DragEvent,targetId:typeof TARGETS[number])=>{event.preventDefault();if(locked)return;const id=event.dataTransfer.getData('text/plain');const card=CARDS.find(c=>c.id===id);if(card)onAction({type:'drop-card',cardId:card.id,targetId});};
 return <section className="in005-modern" lang="en" data-modern-text-page={ID} data-lesson-text-status={snapshot.status}
  data-lesson-frame={state.frame} data-lesson-seed={state.seed} data-lesson-replay={runtime.replay??0} data-in005-mask-state={teaching.maskStateId}
  data-in005-source-emphasis={teaching.emphasisCharacterId??''}>
  <style>{STYLES}</style>
  <p className="in005-modern__instruction" data-lesson-text-block="instruction">{instruction}</p>
  {(teaching.staticCardsVisible||teaching.interactive)&&<fieldset disabled={locked}>
   {teaching.interactive&&<legend>Number cards</legend>}
   <div className="in005-modern__cards">{CARDS.map(card=>{
    const placed=Boolean(interaction.placements[card.id]);
    if(teaching.staticCardsVisible)return <span key={card.id} className="in005-modern__card" data-lesson-text-block={`card-${card.id}`}>{format(card.numericValue)}</span>;
    return <button key={card.id} type="button" className="in005-modern__card" data-in005-focus-control={`card-${card.id}`}
     data-lesson-text-block={`card-${card.id}`} data-placed={placed} disabled={locked||placed} aria-hidden={placed?true:undefined}
     aria-label={`Select ${card.accessibleLabel}`} aria-pressed={interaction.selectedCardId===card.id} draggable={!locked&&!placed}
     onDragStart={event=>{if(locked){event.preventDefault();return;}event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',card.id);onAction({type:'select-card',cardId:card.id});}}
     onClick={event=>{event.currentTarget.focus();onAction({type:'select-card',cardId:card.id});}}>{format(card.numericValue)}</button>;
   })}</div>
  </fieldset>}
  <div className="in005-modern__viewport" role="region" aria-label="Ordering positions, least to greatest. Scroll to explore." tabIndex={0}>
   <div className="in005-modern__ordering">
    <div className="in005-modern__endpoints"><span className="in005-modern__endpoint" data-lesson-text-block="least" data-emphasized={teaching.emphasizedEndpoint==='least'}>Least</span>
     <span className="in005-modern__endpoint" data-lesson-text-block="greatest" data-emphasized={teaching.emphasizedEndpoint==='greatest'}>Greatest</span></div>
    <ol className="in005-modern__slots" aria-label="Number order">{TARGETS.map((target,index)=>{
     const card=CARDS.find(c=>interaction.placements[c.id]===target),label=card?`${card.accessibleLabel} placed in position ${index+1}`:`Position ${index+1}`;
     const common={'data-emphasized':teaching.emphasizedSlot===index+1,'data-placed':Boolean(card),'data-source-target':target};
     return <li key={target}>{teaching.interactive&&!runtime.entryStateSha256?<button {...common} type="button" className="in005-modern__slot"
      data-in005-focus-control={`target-${target}`} disabled={locked||Boolean(card)} aria-label={label}
      onDragOver={event=>{if(!locked&&!card)event.preventDefault();}} onDrop={event=>drop(event,target)}
      onClick={()=>onAction({type:'drop-card',targetId:target})}>{card?<span data-lesson-text-block={`card-${card.id}`}>{format(card.numericValue)}</span>:<span aria-hidden="true"> </span>}</button>
      :<span {...common} className="in005-modern__slot" aria-label={label}>{card?<span data-lesson-text-block={`card-${card.id}`}>{format(card.numericValue)}</span>:<span aria-hidden="true"> </span>}</span>}</li>;
    })}</ol>
   </div>
  </div>
  {blocks.wrong?.visible&&<div className="in005-modern__feedback">
   <p role="alert" data-lesson-text-block="wrong">{blocks.wrong.text}</p>
   <LessonSourceButton ref={wrongCloseRef} runtime={runtime} activityId="in005-close-down" type="button" disabled={!live}
    data-in005-focus-control="close-wrong" data-lesson-text-block="close" onClick={()=>onAction({type:'close-wrong'})}
    onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();onAction({type:'close-wrong'});}}}>Close</LessonSourceButton>
  </div>}
  {blocks.complete?.visible&&<p className="in005-modern__feedback in005-modern__feedback--correct" role="status" data-lesson-text-block="complete">{blocks.complete.text}</p>}
  <span className="in005-modern__sr" role="status" aria-atomic="true">{interaction.outcome==='correct-feedback'?'Correct.':interaction.outcome==='ready'&&placedCount(interaction)>0?`${placedCount(interaction)} numbers placed.`:''}</span>
 </section>;
}
function G4L3In005Session(props:AnimationRendererProps){
 const [interaction,setInteraction]=useState(createCourseG04L03In005OrderingState),stateRef=useRef(interaction);stateRef.current=interaction;
 const root=useRef<HTMLDivElement>(null),wrongCloseRef=useRef<HTMLButtonElement>(null),coachTicket=useRef<In005ActivityTicket|null>(null),finalTicket=useRef<In005ActivityTicket|null>(null);
 const parentRequested=useRef(false),parentRequestInFlight=useRef(false),completionRequested=useRef(false),[focus,setFocus]=useState<string|null>(null);
 const state=(props.state??getCourseG04L03In005FrameState(props.frame,props)) as SourceStaticCanvasFrameState;
 const activities=props.lessonActivities??(props.lessonActivity?[props.lessonActivity]:[]);
 const snapshot=getG4L3In005TextSnapshot(state,{...props,frameDomain:props.frameDomain??DOMAIN},interaction,activities);
 const live=canInteractG4L3In005(props,snapshot);
 const commit=(next:OrderingState)=>{stateRef.current=next;setInteraction(next);};
 useLayoutEffect(()=>{if(!focus)return;const element=root.current?.querySelector<HTMLButtonElement>(`[data-in005-focus-control="${focus}"]`);
  if(element&&!element.disabled){element.focus();setFocus(null);}},[focus,interaction.outcome]);
 useEffect(()=>{
  if(!live||stateRef.current.outcome!=='correct-feedback'||!coachTicket.current)return;
  const observed=observeG4L3In005Activity(coachTicket.current,activities.find(a=>a.id==='in005-correct-coach'),'in005-correct-coach');coachTicket.current=observed.ticket;
  if(!observed.completed)return;
  const plan=planG4L3In005CoachCompletion(stateRef.current);if(!plan)return;
  const pending=plan.effect?newG4L3In005ActivityTicket(activities):null;
  const admitted=admitG4L3In005Plan(plan,props);if(!admitted)return;
  coachTicket.current={...observed.ticket,handled:true};finalTicket.current=pending;commit(admitted);
  const nextCard=CARDS.find(c=>!admitted.placements[c.id]);if(nextCard)setFocus(`card-${nextCard.id}`);
 },[live,activities,props.onLessonActivityRequest,interaction.outcome]);
 useEffect(()=>{
  if(!live||stateRef.current.outcome!=='complete'||!finalTicket.current||parentRequested.current||parentRequestInFlight.current)return;
  const observed=observeG4L3In005Activity(finalTicket.current,activities.find(a=>a.id==='in005-complete-feedback'),'in005-complete-feedback');finalTicket.current=observed.ticket;
  if(!observed.completed)return;
  parentRequestInFlight.current=true;
  try{if(props.onLessonFrameRequest?.(G4_L3_IN005_TRANSITION)){parentRequested.current=true;finalTicket.current={...observed.ticket,handled:true};}}
  finally{parentRequestInFlight.current=false;}
 },[live,activities,props.onLessonFrameRequest,interaction.outcome]);
 useEffect(()=>{
  if(snapshot.status!=='ready'||props.entryStateSha256||props.paused||!isG4L3In005Complete(interaction,props.frame)||completionRequested.current||!props.onLessonCompletionRequest)return;
  completionRequested.current=true;
  props.onLessonCompletionRequest({id:COMPLETION_ID,frameDomain:DOMAIN,frame:186,seed:props.seed,replay:props.replay??0});
 },[interaction,props.frame,props.seed,props.replay,props.paused,props.entryStateSha256,props.onLessonCompletionRequest,snapshot.status]);
 const action=(requested:OrderingAction)=>{
  const current=stateRef.current;if(parentRequested.current)return;
  const plan=planG4L3In005Action(current,requested,{interactive:live,reducedMotion:Boolean(props.reducedMotion)});if(!plan)return;
  const ticket=plan.waitForCoach?newG4L3In005ActivityTicket(activities):null;
  const admitted=admitG4L3In005Plan(plan,props);if(!admitted)return;
  if(plan.finalTransition)parentRequested.current=true;
  if(plan.waitForCoach)coachTicket.current=ticket;
  commit(admitted);
  if(admitted.outcome==='wrong')setFocus('close-wrong');
  else if(requested.type==='close-wrong'&&current.wrongCardId)setFocus(`card-${current.wrongCardId}`);
  else if(requested.type==='drop-card'&&admitted.outcome==='ready'){const nextCard=CARDS.find(c=>!admitted.placements[c.id]);if(nextCard)setFocus(`card-${nextCard.id}`);}
 };
 return <div ref={root} data-in005-controller="shared-original-reducer" data-interaction-outcome={interaction.outcome}
  data-in005-source-activities={JSON.stringify(activities)} data-current-js-controls-ready={live?'true':'false'}>
  <G4L3In005Presentation runtime={props} interaction={interaction} onAction={action} wrongCloseRef={wrongCloseRef}/>
 </div>;
}
export function G4L3In005ModernRenderer(props:AnimationRendererProps){return <G4L3In005Session key={g4L3In005SessionIdentity(props)} {...props}/>;}
export const G4_L3_IN005_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>=Object.freeze({schemaVersion:1,
 binding:G4_L3_IN005_TEXT_BINDING,Renderer:G4L3In005ModernRenderer,getSnapshot:getG4L3In005TextSnapshot,
 frameControl:{frameDomain:DOMAIN,completionFrame:186,transitions:[G4_L3_IN005_TRANSITION]},playbackEndFrameByDomain:{[DOMAIN]:144},reducedMotionFrameByDomain:{[DOMAIN]:144},
 sourceTimelineAudioCues:SOURCE.decisions.sourceTimelineAudioCues,activityTimelines:G4_L3_IN005_ACTIVITIES,keyTerms:G4_L3_IN005_KEY_TERMS,completion:{id:COMPLETION_ID,frameDomain:DOMAIN,frames:[186]}});
