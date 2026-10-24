'use client';
import {useEffect,useId,useRef}from'react';
import {createP033Art}from'./nms-l02-p033-art-v1';
import {p033Feedback,p033CloseFeedback,p033WrongExplanation,type P033SessionState}from'./nms-l02-p033-state-v1';
import {P033_FEEDBACK_TITLES}from'./generated/nms-l02-p033-feedback-titles-v1';
import './nms-l02-p033-feedback-v1.css';
export interface P033FeedbackPresentationProps{readonly interactionEnabled?:boolean;readonly state:P033SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;readonly onClose:()=>void;}
/** Native titles preserve measured source visibility. Decorations preserve their
 * own source domain; reduced motion hides decorative motion only. */
export function P033FeedbackPresentation({state,language='en',reducedMotion=false,interactionEnabled=true,onClose}:P033FeedbackPresentationProps){
 const svg=useRef<SVGSVGElement>(null),art=useRef<ReturnType<typeof createP033Art>|null>(null),close=useRef<HTMLButtonElement>(null),latest=useRef({state,onClose});latest.current={state,onClose};const prefix=useId().replace(/[^a-zA-Z0-9]/g,'');
 const branch=p033Feedback(state),active=branch&&['right','wrong-in','wrong-wait','wrong-out'].includes(state.phase);
 const titles=P033_FEEDBACK_TITLES[state.domain as keyof typeof P033_FEEDBACK_TITLES];
 const row=active?titles?.[state.localFrame-1]:undefined;
 const canClose=active&&p033CloseFeedback(state)!==state;
 useEffect(()=>{if(!svg.current||!active||reducedMotion)return;const renderer=createP033Art(svg.current,'p033-'+prefix);art.current=renderer;return()=>{renderer.close();if(art.current===renderer)art.current=null;};},[active,reducedMotion,prefix]);
 useEffect(()=>{if(active)art.current?.draw(state.domain,state.localFrame);},[active,state.domain,state.localFrame,reducedMotion]);
 useEffect(()=>{if(canClose&&interactionEnabled)close.current?.focus({preventScroll:true});},[canClose,interactionEnabled]);
 if(!active||!branch)return null;
 if(!row)throw Error('P033_FEEDBACK_TITLE_FRAME');
 return <section className="p033-feedback lesson-text-presentation" lang="en" data-p033-feedback-domain={state.domain} data-p033-feedback-frame={state.localFrame}>
  <div className="p033-feedback__title" aria-live="polite">{row.visible&&<h3 data-lesson-text-block="feedback-title" style={{opacity:reducedMotion?1:row.alpha}}>{branch.title}</h3>}</div>
  {!reducedMotion&&<svg ref={svg} className="p033-feedback__art" aria-hidden="true"/>}
  {canClose&&<div className="p033-feedback__explanation"><p data-lesson-text-block="explanation">{p033WrongExplanation(state)}</p><button data-lesson-text-block="close" ref={close} disabled={!interactionEnabled} type="button" lang={language} onClick={()=>{if(p033CloseFeedback(latest.current.state)!==latest.current.state)latest.current.onClose();}}>{language==='es'?'Cerrar':'Close'}</button></div>}
 </section>;
}
