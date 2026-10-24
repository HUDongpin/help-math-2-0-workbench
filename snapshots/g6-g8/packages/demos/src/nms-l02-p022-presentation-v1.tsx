'use client';
import React, {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {P022_OPTIONS, p022Teaching, p022Feedback, p022FeedbackTitleVisible, p022WrongExplanation, type P022SessionState} from './nms-l02-p022-timeline-v1';
import {createP022Art} from './nms-l02-p022-art-v1';
import './nms-l02-p022-v1.css';

export interface P022PresentationProps {
 readonly state:P022SessionState;
 readonly language:'en'|'es';
 readonly reducedMotion?:boolean;
 readonly capture?:boolean;
 readonly onAnswer:(index:number)=>void;
 readonly onCloseFeedback:()=>void;
 readonly onHelp:()=>void;
 readonly onCloseHelp:()=>void;
 readonly onTerm:(id:'part'|'fraction',trigger:HTMLElement)=>void;
}
export function P022Fraction({n,d,emphasis=false}:{n:number;d:number;emphasis?:boolean}) {
 return React.createElement('math', {xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline','aria-label':`${n}/${d}`,className:emphasis?'nms-l02-p022__emphasis':undefined},
  React.createElement('mfrac',null,React.createElement('mn',null,String(n)),React.createElement('mn',null,String(d))));
}
export function p022SectorPath(parts:number,index:number) {
 const start=parts===6?-45:-180;
 const angle=(index*360/parts+start)*Math.PI/180, next=((index+1)*360/parts+start)*Math.PI/180;
 return `M0 0 L${100*Math.cos(angle)} ${100*Math.sin(angle)} A100 100 0 ${360/parts>180?1:0} 1 ${100*Math.cos(next)} ${100*Math.sin(next)} Z`;
}
function Circle({parts,selected,selectedHighlight=false,totalHighlight=false,language}:{parts:number;selected:number;selectedHighlight?:boolean;totalHighlight?:boolean;language:'en'|'es'}) {
 return <svg className="nms-l02-p022__circle" viewBox="-108 -108 216 216" role="img" aria-label={language==='es'?`${selected} de ${parts} partes iguales sombreadas`:`${selected} of ${parts} equal parts shaded`}>
  {Array.from({length:parts},(_,i)=><path key={i} d={p022SectorPath(parts,i)} fill={i<selected?(parts===8?'#ee4499':'#ff6633'):'#fff'} stroke="#263c50" strokeWidth="1.8"/>)}
  {(selectedHighlight||totalHighlight)&&Array.from({length:totalHighlight?parts:selected},(_,i)=><path key={'highlight-'+i} d={p022SectorPath(parts,i)} fill="none" stroke="#b66700" strokeWidth="4"/>)}
 </svg>;
}
function FeedbackArt({state,reducedMotion}:{state:P022SessionState;reducedMotion?:boolean}) {
 const svg=useRef<SVGSVGElement>(null),art=useRef<ReturnType<typeof createP022Art>|null>(null),id=useId().replace(/[^a-zA-Z0-9]/g,'');
 useEffect(()=>{if(!svg.current)return;const renderer=createP022Art(svg.current,'p022-'+id);art.current=renderer;return()=>{art.current=null;renderer.close();};},[id]);
 useEffect(()=>{const b=p022Feedback(state),frame=reducedMotion&&b?Math.min(b.end-1,'hold'in b?b.hold:20):state.localFrame;art.current?.draw(state.domain,frame);},[state.domain,state.localFrame,reducedMotion]);
 return <svg ref={svg} className="nms-l02-p022__art" aria-hidden="true" focusable="false"/>;
}
function HelpBody({language}:{language:'en'|'es'}) {
 return <div className="nms-l02-p022__help-content">
  <h3 lang="en">Example:</h3>
  <div className="nms-l02-p022__formula" lang="en">
   <span className="nms-l02-p022__word-fraction"><span>numerator</span><span>denominator</span></span><span>=</span>
   <span className="nms-l02-p022__word-fraction"><span>parts selected</span><span>total equal parts</span></span><span>=</span><P022Fraction n={4} d={6}/>
  </div>
  <Circle parts={6} selected={4} language={language}/>
  <p lang="en">Count the selected parts = 4 (numerator)</p>
  <p lang="en">Count the equal parts = 6 (denominator)</p>
 </div>;
}
function HelpDialog({props,trigger}:{props:P022PresentationProps;trigger:React.RefObject<HTMLButtonElement|null>}) {
 const[portal,setPortal]=useState<HTMLElement|null>(null),ref=useRef<HTMLDialogElement>(null),close=useRef<HTMLButtonElement>(null),title=useRef<HTMLHeadingElement>(null),id=useId();
 useEffect(()=>setPortal(document.body),[]);
 useEffect(()=>{if(!portal||!ref.current)return;const dialog=ref.current;dialog.showModal();title.current?.focus({preventScroll:true});dialog.scrollTop=0;return()=>{dialog.close();trigger.current?.focus({preventScroll:true});};},[portal]);
 if(!portal)return null;
 return createPortal(<dialog ref={ref} className="nms-l02-p022__dialog lesson-text-presentation" aria-labelledby={id} data-p022-help-dialog="true" onCancel={e=>{e.preventDefault();props.onCloseHelp();}} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();close.current?.focus();}}}>
  <h2 ref={title} tabIndex={-1} id={id}>{props.language==='es'?'Más ayuda':'Need More Help'}</h2><HelpBody language={props.language}/>
  <button ref={close} onClick={props.onCloseHelp}>{props.language==='es'?'Cerrar':'Close'}</button>
 </dialog>,portal);
}
export function NmsL2P022Presentation(props:P022PresentationProps) {
 const{state:s,language:l}=props,t=p022Teaching(s),row=t.row,feedback=p022Feedback(s),wrong=feedback&&'popup'in feedback?feedback:null;
 const popup=!!wrong&&s.localFrame>=wrong.popup&&s.phase!=='wrong-out';
 const buttons=useRef<(HTMLButtonElement|null)[]>([]),close=useRef<HTMLButtonElement>(null),help=useRef<HTMLButtonElement>(null),region=useRef<HTMLElement>(null),previous=useRef(s.phase);
 useEffect(()=>{if(previous.current==='wrong-out'&&s.phase==='question'&&s.answer!==null)buttons.current[s.answer]?.focus();if(s.phase==='outro'&&previous.current!==s.phase)region.current?.focus({preventScroll:true});previous.current=s.phase;},[s.phase,s.answer]);
 useEffect(()=>{if(popup)close.current?.focus({preventScroll:true});},[popup]);
 const termKeys={1:'part',3:'fraction'} as const;
 const emphasis=props.reducedMotion?(row.fractionEmphasisReduced||row.numeratorEmphasisReduced||row.denominatorEmphasisReduced):(row.fractionEmphasis||row.numeratorEmphasis||row.denominatorEmphasis);
 return <section ref={region} tabIndex={-1} className="nms-l02-p022 lesson-text-presentation" data-p022-phase={s.phase} data-p022-main-frame={s.mainFrame} data-p022-domain={s.domain} data-p022-local-frame={s.localFrame} data-p022-attempts={s.attempts} data-p022-branch={s.branch??''} data-p022-help={s.help} data-p022-replay={s.replay} data-p022-outcome={s.outcome}>
  <header className="nms-l02-p022__header"><p lang="en">Fractions, Decimals, and Percents Concepts:</p><h2 lang="en">Instruction</h2></header>
  {l==='es'&&<p className="nms-l02-p022__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés. Las definiciones de los términos están disponibles en español.</p>}
  <p className="nms-l02-p022__question" lang="en" data-lesson-text-block="question">{row.question.map((r,i)=>{
   const key=termKeys[i as keyof typeof termKeys];
   return key&&r.complete?<button key={i} className="nms-l02-p022__term" disabled={!t.termEnabled||props.capture} onClick={e=>props.onTerm(key,e.currentTarget)}>{r.text}</button>:<span key={i}>{r.text}</span>;
  })}</p>
  <div className="nms-l02-p022__exercise">
   <div className="nms-l02-p022__diagram-column" style={{opacity:row.circleAlpha}}>
    <Circle parts={8} selected={3} selectedHighlight={row.selectedHighlight} totalHighlight={row.totalHighlight} language={l}/>
   </div>
   <div className="nms-l02-p022__answers" role="group" aria-label={l==='es'?'Opciones de fracción':'Fraction choices'}>
    {P022_OPTIONS.map(([n,d],i)=>{
     const alpha=row.choices[i].alpha;
     return alpha>0&&<button key={i} ref={e=>{buttons.current[i]=e;}} className="nms-l02-p022__answer" data-source-answer={'AnsBtn'+(i+1)} disabled={!t.answersEnabled||props.capture} style={{opacity:alpha}} aria-label={`${'ABCD'[i]}: ${n}/${d}`} onClick={()=>props.onAnswer(i)}>
      <span>{'ABCD'[i]}</span><P022Fraction n={n} d={d} emphasis={i===2&&emphasis}/>
     </button>;
    })}
   </div>
  </div>
  {row.helpVisible&&<div className="nms-l02-p022__help-action"><button ref={help} disabled={!t.helpEnabled||props.capture} data-p022-help-button="true" data-demo-target={props.reducedMotion?row.helpEmphasisReduced:row.helpEmphasis} onClick={props.onHelp}>{l==='es'?'Más ayuda':'Need More Help'}</button></div>}
  {feedback&&<div className="nms-l02-p022__feedback" data-feedback-kind={s.feedback}>
   <FeedbackArt state={s} reducedMotion={props.reducedMotion}/>
   {p022FeedbackTitleVisible(s)&&<h3 lang="en" role="status">{feedback.title}</h3>}
   {popup&&<div className="nms-l02-p022__explanation"><p lang="en">{p022WrongExplanation(s)}</p><button ref={close} disabled={props.capture} onClick={props.onCloseFeedback}>{l==='es'?'Cerrar':'Close'}</button></div>}
  </div>}
  {s.phase==='completed'&&<p role="status" className="nms-l02-p022__completed">{s.outcome==='assisted'?(l==='es'?'Se ha mostrado la explicación. Puedes repetir la actividad.':'The explanation has been shown. You can replay the activity.'):(l==='es'?'Actividad completada. Puedes repetirla o continuar.':'Activity complete. You can replay or continue.')}</p>}
  {s.help&&(props.capture?<HelpBody language={l}/>:<HelpDialog props={props} trigger={help}/>)}
 </section>;
}
