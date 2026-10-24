'use client';
import * as React from 'react';
import './nms-l02-p039-exercise-v1.css';
import {P039_PAGE_TITLE} from './generated/nms-l02-p039-page-title-source-v1';
import {LessonAnimationTitleV1} from './lesson-animation-title-v1';
import {P039Grid} from './nms-l02-p039-grid-v1';
import {P039_INTRO_SOURCE} from './generated/nms-l02-p039-intro-source-v1';
import {p039IntroAt} from './nms-l02-p039-intro-v1';
import type {P039State} from './nms-l02-p039-state-v1';

import {P039_COPY,p039Feedback} from './nms-l02-p039-copy-v1';

export interface P039ExerciseProps {
 state:P039State;closePressed?:boolean;uiLanguage?:'en'|'es';interactionEnabled?:boolean;reducedMotion?:boolean;
 onPercent:(percent:number)=>void;onSubmit:()=>void;onReset:()=>void;onClose:()=>void;
 onClosePress?:(pressed:boolean)=>void;
}
/** Controlled page content; the player owns clocks, Replay and audio resources. */
export function P039Exercise({state,closePressed=false,uiLanguage='en',interactionEnabled=true,reducedMotion=false,onPercent,onSubmit,onReset,onClose,onClosePress}:P039ExerciseProps){
 const id=React.useId(),range=React.useRef<HTMLInputElement>(null),close=React.useRef<HTMLButtonElement>(null),feedback=React.useRef<HTMLDivElement>(null),wasPopup=React.useRef(false);
 const l=P039_COPY[uiLanguage],feedbackContent=p039Feedback(state,uiLanguage),intro=state.mainFrame<546?p039IntroAt(state.mainFrame):null;
 const enabled=interactionEnabled&&state.enabled&&state.mainFrame===546;
 React.useEffect(()=>{
  if(state.popupVisible&&interactionEnabled)close.current?.focus();
  else if(wasPopup.current&&interactionEnabled){if(enabled)range.current?.focus();else feedback.current?.focus();}
  wasPopup.current=state.popupVisible;
 },[state.popupVisible,interactionEnabled,enabled]);
 React.useEffect(()=>()=>onClosePress?.(false),[onClosePress,state.popupVisible]);
 const sentences=intro?intro.sentences:P039_INTRO_SOURCE.sentences.map(s=>({text:s.text,maskedText:s.text,complete:true,visibleOffsets:[...s.text].map((_,i)=>i)}));
 return <section className="p039-exercise" lang="en" data-p039-main-frame={state.mainFrame} data-p039-tries={state.tries} data-p039-candidate="engineering-candidate">
  <LessonAnimationTitleV1 courseTitle={P039_PAGE_TITLE.courseHeading} activityTitle={P039_PAGE_TITLE.activityHeading} language="en"/>
  <h2 className="p039-exercise__title" data-p039-page-title data-lesson-xml-title={P039_PAGE_TITLE.sourcePageReference} data-source-xml-sha256={P039_PAGE_TITLE.sourceXml.sha256}>{P039_PAGE_TITLE.title}</h2>
  {uiLanguage==='es'&&<p className="p039-exercise__language" lang="es">Esta página conserva las instrucciones originales en inglés. Los controles y comentarios están disponibles en español.</p>}
  <div className="p039-exercise__instructions">
   {sentences.map((sentence,index)=>{
    const showAll=reducedMotion||!intro,visible=new Set<number>(sentence.visibleOffsets);
    return <p key={index} data-p039-instruction={index} data-lesson-text-block={'instruction-'+(index+1)} aria-label={showAll||sentence.complete?sentence.text:undefined}>
     {[...sentence.text].map((char,offset)=><span key={offset} aria-hidden="true" style={{visibility:showAll||char===' '||visible.has(offset)?'visible':'hidden'}}>{char}</span>)}
     {!showAll&&!sentence.complete&&<span className="p039-exercise__sr">{sentence.maskedText.trim()}</span>}
    </p>;
   })}
  </div>
  <div className="p039-exercise__layout">
   <div className="p039-exercise__diagram"><P039Grid state={state} language={uiLanguage} showPracticeSlider={false}/></div>
   <div className="p039-exercise__controls" lang={uiLanguage}>
    {!intro&&<label htmlFor={id} data-lesson-text-block={'selected-percent-'+uiLanguage}>{l.slider}: <output htmlFor={id}>{state.percent}%</output></label>}
    {!intro&&<input ref={range} id={id} type="range" min={0} max={100} step={1} value={state.percent} disabled={!enabled}
      aria-valuetext={uiLanguage==='es'?`${state.percent} de 100 cuadros`:`${state.percent} of 100 squares`}
      onChange={event=>onPercent(Number(event.currentTarget.value))}/>}
    <div className="p039-exercise__buttons"><button type="button" data-lesson-text-block={'control-done-'+uiLanguage} disabled={!enabled} onClick={onSubmit}>{l.done}</button><button type="button" data-lesson-text-block={'control-reset-'+uiLanguage} disabled={!enabled} onClick={onReset}>{l.reset}</button></div>
   </div>
  </div>
  <div ref={feedback} tabIndex={-1} className="p039-exercise__feedback" lang={uiLanguage} aria-live="polite" aria-atomic="true">
   {feedbackContent.kind==='wrong'?<><p data-lesson-text-block={'feedback-wrong-'+uiLanguage}>{feedbackContent.text}</p><button ref={close} data-lesson-text-block={'control-close-'+uiLanguage} data-p039-close-pressed={closePressed||undefined} type="button" disabled={!interactionEnabled} onClick={()=>{onClosePress?.(false);onClose();}}
     onPointerDown={()=>onClosePress?.(true)} onPointerUp={()=>onClosePress?.(false)} onPointerCancel={()=>onClosePress?.(false)} onPointerLeave={()=>onClosePress?.(false)} onBlur={()=>onClosePress?.(false)}
     onKeyDown={event=>{if(!event.repeat&&(event.key===' '||event.key==='Enter'))onClosePress?.(true);}}
     onKeyUp={event=>{if(event.key===' '||event.key==='Enter')onClosePress?.(false);}}>{l.close}</button></>:
    feedbackContent.text?<p data-lesson-text-block={feedbackContent.kind==='complete'?undefined:'feedback-'+feedbackContent.kind+'-'+uiLanguage}>{feedbackContent.text}</p>:null}
  </div>
 </section>;
}
