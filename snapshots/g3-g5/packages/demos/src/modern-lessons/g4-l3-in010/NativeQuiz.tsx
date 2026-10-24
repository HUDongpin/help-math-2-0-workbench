'use client';
import {focusAndRevealQuizControl, observeQuizFocusVisibility} from './focus-control';
import React,{useId,useLayoutEffect,useRef,type Dispatch,type ReactNode}from'react';
import type{AnimationRendererProps}from'../../contract';
import{COURSE_G04_L03_IN_010_CARDS as CARDS,COURSE_G04_L03_IN_010_INSTRUCTION as INSTRUCTION,getCourseG04L03In010PlacementCount,reduceCourseG04L03In010TemperatureDrag as reduce,type CourseG04L03In010TemperatureDragState as State,type CourseG04L03In010TemperatureDragAction as Action,type CourseG04L03In010CardId as CardId}from'../../timelines/course-g04-l03-in-010-temperature-drag-interaction';
const TARGETS=[...CARDS].sort((a,b)=>a.targetCenter.y-b.targetCenter.y);
const CITY_CODES:Readonly<Record<CardId,string>>={Src_1:'A',Src_2:'B',Src_4:'C',Src_5:'D',Src_6:'E',Src_7:'F'};
const DRAG_TYPE='application/x-help-in010-card';
export interface NativeQuizProps{
 readonly sourceTextByBlock?:Readonly<Record<string,string>>;
 readonly state:State;readonly dispatch:Dispatch<Action>;readonly controlsReady:boolean;
 /** Explicit caller-owned, reviewed host copy. No substitution of static Try Again for _global.WrongFeed. */
 readonly feedbackCopy:{readonly wrong:string;readonly close:string;readonly final:string};
 /** Original geographic scene and thermometer with source native-text transfer performed by caller. */
 readonly sourceFigure:ReactNode;
 readonly onKeyword?:(term:'Temperature'|'Thermometer',trigger:HTMLElement)=>void;
 /** Host can allocate source feedback generation/audio from this admitted action. */
 readonly onDrop:(next:State,action:Extract<Action,{type:'drop-card'|'drop-outside'}>)=>boolean;
 readonly onClosePress?:(token:string)=>void;readonly onCloseRelease?:(token:string)=>void;
 readonly lessonActivities?:AnimationRendererProps['lessonActivities'];
}
/** Controlled presentation only. Host advances feedback child frames and owns Replay;
 * this view never starts timers or rewrites the existing suffix-matched reducer. */
export function NativeQuiz({sourceTextByBlock,state,dispatch,controlsReady,feedbackCopy,sourceFigure,onKeyword,onDrop,onClosePress,onCloseRelease,lessonActivities}:NativeQuizProps){
 const activeDrag=useRef<CardId|null>(null);
 const root=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null),previous=useRef(state),retry=useRef<CardId|null>(null);const locked=!controlsReady||state.locked;
 const closeId=useId(),serial=useRef(0),press=useRef<string|null>(null),releaseCallback=useRef(onCloseRelease);releaseCallback.current=onCloseRelease;
 const release=()=>{const token=press.current;press.current=null;if(token)releaseCallback.current?.(token);};
 const begin=()=>{if(press.current||!controlsReady||state.outcome!=='wrong')return;const token=`${closeId}:${++serial.current}`;press.current=token;onClosePress?.(token);};
 useLayoutEffect(()=>()=>{const token=press.current;press.current=null;if(token)releaseCallback.current?.(token);},[]);
 useLayoutEffect(() => observeQuizFocusVisibility(root.current), []);
 const send=(action:Action)=>{if(!controlsReady)return;const next=reduce(state,action);if(next===state)return;if((action.type==='drop-card'||action.type==='drop-outside')&&!onDrop(next,action))return;dispatch(action);};
 useLayoutEffect(() => {
  const old = previous.current;
  previous.current = state;
  let target: HTMLButtonElement | null = null;
  if (state.outcome === 'wrong' && old.outcome !== 'wrong') {
   retry.current = state.wrongCardId;
   target = close.current;
  } else if (state.outcome === 'ready' && old.outcome === 'wrong') {
   target = root.current?.querySelector<HTMLButtonElement>(`[data-in010-focus-control="card-${retry.current}"]`) ?? null;
   retry.current = null;
  } else if (state.outcome === 'ready' && old.outcome === 'correct-feedback') {
   const next = CARDS.find(card => state.placements[card.id] === null);
   if (next) target = root.current?.querySelector<HTMLButtonElement>(`[data-in010-focus-control="card-${next.id}"]`) ?? null;
  }
  return focusAndRevealQuizControl(target);
 }, [state]);
 const selected=CARDS.find(c=>c.id===state.selectedCardId),count=getCourseG04L03In010PlacementCount(state);
 const instruction=INSTRUCTION.split(/(temperature|thermometer)/g);
 return<section ref={root} onDragOver={e=>{if(activeDrag.current&&!locked&&Array.from(e.dataTransfer.types).includes(DRAG_TYPE)){e.preventDefault();e.dataTransfer.dropEffect='move';}}} onDrop={e=>{if(e.defaultPrevented)return;const id=activeDrag.current;if(!id||locked||e.dataTransfer.getData(DRAG_TYPE)!==id)return;e.preventDefault();activeDrag.current=null;send({type:'drop-outside',cardId:id});}} className="in010-quiz" lang="en" data-interaction-outcome={state.outcome} data-native-quiz-clock="external" data-geometry-composition="caller-owned" data-feedback-clock="host-source-activities" data-activity-count={lessonActivities?.length??0}>
  <div className="in010-quiz__non-dialog" inert={state.outcome==='wrong'?true:undefined}>
  <p className="in010-quiz__body" data-lesson-text-block="instruction">{instruction.map((text,i)=>(text==='temperature'||text==='thermometer')&&onKeyword?<button key={i} className="in010-quiz__keyword" type="button" onClick={e=>onKeyword(text==='temperature'?'Temperature':'Thermometer',e.currentTarget)}>{text}</button>:<React.Fragment key={i}>{text}</React.Fragment>)}</p>
  <div className="in010-quiz__figure">{sourceFigure}</div>
  <p data-lesson-text-block={state.outcome==='final-correct-feedback'?'final-feedback':undefined} className="in010-quiz__status" aria-live="polite" data-ui-copy="modern-assistive-status">{state.outcome==='complete'?`All ${count} cities placed.`:state.outcome==='final-correct-feedback'?feedbackCopy.final:state.outcome==='correct-feedback'?`Correct. ${count} of 6 cities placed.`:selected?`${selected.accessibleLabel} selected. Choose its thermometer position.`:`${count} of 6 cities placed.`}</p>
  <div className="in010-quiz__controls" inert={state.outcome==='wrong'?true:undefined}>
   <fieldset disabled={locked}><legend>1. Choose a city and temperature</legend><div className="in010-quiz__cards">{CARDS.map(card=>{const placed=state.placements[card.id]!==null;return<button key={card.id} type="button" disabled={locked||placed} draggable={!locked&&!placed} aria-label={`Select ${card.accessibleLabel}`} aria-pressed={state.selectedCardId===card.id} data-in010-focus-control={`card-${card.id}`} data-source-object-id={card.sourceObjectId} data-source-card-x={card.sourceCenter.x} data-source-card-y={card.sourceCenter.y}
    onClick={()=>send({type:'select-card',cardId:card.id})} onDragStart={e=>{if(locked||placed){e.preventDefault();return;}activeDrag.current=card.id;e.dataTransfer.setData(DRAG_TYPE,card.id);e.dataTransfer.effectAllowed='move';send({type:'select-card',cardId:card.id});}} onDragEnd={()=>{const id=activeDrag.current;activeDrag.current=null;if(id===card.id&&!locked)send({type:'drop-outside',cardId:id});}}><strong aria-hidden="true">{CITY_CODES[card.id]} — </strong><span data-lesson-text-block={!placed?`city-${CITY_CODES[card.id]}`:undefined}><span data-lesson-text-block={`card-${card.id}`}><TemperatureLabel text={card.displayText}/></span>{!placed?(sourceTextByBlock?.[`city-${CITY_CODES[card.id]}`]?.match(/\s+$/u)?.[0]??''):''}</span>{placed&&<span aria-label="placed"> ✓</span>}</button>;})}</div></fieldset>
   <fieldset disabled={locked}><legend>2. Choose its thermometer position</legend><div className="in010-quiz__targets">{TARGETS.map((target,i)=>{const placed=CARDS.find(c=>state.placements[c.id]===target.targetId);return<button key={target.targetId} type="button" disabled={locked||!!placed||state.selectedCardId===null} aria-label={placed?`${placed.accessibleLabel} placed at thermometer position ${i+1}`:`Thermometer position ${i+1}`} aria-disabled={!selected&&!placed?true:undefined} data-in010-focus-control={`target-${target.targetId}`} data-source-target-x={target.targetCenter.x} data-source-target-y={target.targetCenter.y} data-target-answer-disclosure="position-only-before-placement" data-placed-target={placed?true:undefined}
    onClick={()=>{if(selected)send({type:'drop-card',targetId:target.targetId});}} onDragOver={e=>{if(!locked&&!placed&&Array.from(e.dataTransfer.types).includes(DRAG_TYPE)){e.preventDefault();e.dataTransfer.dropEffect='move';}}} onDrop={e=>{e.preventDefault();activeDrag.current=null;if(locked||placed)return;const id=e.dataTransfer.getData(DRAG_TYPE);if(CARDS.some(c=>c.id===id))send({type:'drop-card',cardId:id as CardId,targetId:target.targetId});}}>{placed?<><span data-lesson-text-block={`target-${target.targetId}`}><TemperatureLabel text={sourceTextByBlock?.[`target-${target.targetId}`]??placed.targetText}/></span> ✓</>:`Position ${i+1}`}</button>;})}</div></fieldset>
  </div>
  </div>
  {state.outcome==='wrong'&&<div role="alertdialog" aria-modal="true" aria-label="Incorrect placement feedback" className="in010-quiz__feedback" onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();close.current?.focus();}}}><p className="in010-quiz__body" data-lesson-text-block="wrong-feedback">{state.feedback??feedbackCopy.wrong}</p><button ref={close} type="button" disabled={!controlsReady} onMouseDown={e=>e.preventDefault()} onPointerDown={e=>{e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);begin();}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onBlur={release} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)begin();}}} onKeyUp={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const held=press.current!==null;release();if(held)send({type:'close-wrong'});}}} onClick={()=>{release();send({type:'close-wrong'});}} data-lesson-text-block="close-feedback" data-in010-focus-control="close-wrong">{feedbackCopy.close}</button></div>}
 </section>;
}
/** Preserve the maintained exact text, including punctuation/spacing; bind the
 * complete signed value/degree/unit as one unbreakable span, never split minus. */
export function TemperatureLabel({text}:{text:string}){const match=/([−-]?\d+°\s*F)(\s*)$/u.exec(text);if(!match)throw Error('Unknown maintained temperature label syntax');return<><span>{text.slice(0,match.index)}</span><span className="in010-quiz__number">{match[1].replace(/^-/u,'−')}</span>{match[2]}</>;}
