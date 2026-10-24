'use client';
import {useEffect,useId,useRef}from'react';
import {createP031Art}from'./nms-l02-p031-art-v1';
import {p031Feedback,p031CloseFeedback,p031WrongExplanation,type P031SessionState}from'./nms-l02-p031-state-v1';
import {P031_FEEDBACK_TITLES}from'./generated/nms-l02-p031-feedback-titles-v1';
import './nms-l02-p031-feedback-v1.css';
export interface P031FeedbackPresentationProps{readonly state:P031SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;readonly onClose:()=>void;}
/** Native titles preserve measured source visibility. Decorations preserve their
 * own source domain; reduced motion hides decorative motion only. */
export function P031FeedbackPresentation({state,language='en',reducedMotion=false,onClose}:P031FeedbackPresentationProps){
 const svg=useRef<SVGSVGElement>(null),art=useRef<ReturnType<typeof createP031Art>|null>(null),close=useRef<HTMLButtonElement>(null),latest=useRef({state,onClose});latest.current={state,onClose};const prefix=useId().replace(/[^a-zA-Z0-9]/g,'');
 const branch=p031Feedback(state),active=branch&&['right','wrong-in','wrong-wait','wrong-out'].includes(state.phase);
 const titles=P031_FEEDBACK_TITLES[state.domain as keyof typeof P031_FEEDBACK_TITLES];
 const row=active?titles?.[state.localFrame-1]:undefined;
 const canClose=active&&p031CloseFeedback(state)!==state;
 useEffect(()=>{if(!svg.current||!active||reducedMotion)return;const renderer=createP031Art(svg.current,'p031-'+prefix);art.current=renderer;return()=>{renderer.close();if(art.current===renderer)art.current=null;};},[active,reducedMotion,prefix]);
 useEffect(()=>{if(active)art.current?.draw(state.domain,state.localFrame);},[active,state.domain,state.localFrame,reducedMotion]);
 useEffect(()=>{if(canClose)close.current?.focus({preventScroll:true});},[canClose]);
 if(!active||!branch)return null;
 if(!row)throw Error('P031_FEEDBACK_TITLE_FRAME');
 return <section className="p031-feedback lesson-text-presentation" lang="en" data-p031-feedback-domain={state.domain} data-p031-feedback-frame={state.localFrame}>
  <div className="p031-feedback__title" aria-live="polite">{row.visible&&<h3 data-lesson-text-block="feedback-title" style={{opacity:reducedMotion?1:row.alpha}}>{branch.title}</h3>}</div>
  {!reducedMotion&&<svg ref={svg} className="p031-feedback__art" aria-hidden="true"/>}
  {canClose&&<div className="p031-feedback__explanation"><p data-lesson-text-block="explanation">{p031WrongExplanation(state)}</p><button data-lesson-text-block="close" ref={close} type="button" lang={language} onClick={()=>{if(p031CloseFeedback(latest.current.state)!==latest.current.state)latest.current.onClose();}}>{language==='es'?'Cerrar':'Close'}</button></div>}
 </section>;
}
