'use client';
import {useEffect,useId,useRef} from 'react';
import {P010_BRANCHES,P010_GLYPHS,P010_ANSWERS,p010Teaching,p010Feedback,p010FeedbackTitleVisible,p010WrongExplanation,type P010SessionState} from './nms-l02-p010-timeline-v1';
import {createP010Art} from './nms-l02-p010-art-v1';
import './nms-l02-p010-v1.css';
export interface P010PresentationProps{readonly state:P010SessionState;readonly language:'en'|'es';readonly reducedMotion?:boolean;readonly onAnswer:(index:number)=>void;readonly onCloseFeedback:()=>void;readonly onTerm:(trigger:HTMLElement)=>void;}
function FeedbackArt({state,reducedMotion}:{state:P010SessionState;reducedMotion?:boolean}){const svg=useRef<SVGSVGElement>(null),art=useRef<ReturnType<typeof createP010Art>|null>(null),id=useId().replace(/[^a-zA-Z0-9]/g,'');useEffect(()=>{if(!svg.current)return;const renderer=createP010Art(svg.current,'p010-'+id);art.current=renderer;return()=>{art.current=null;renderer.close();};},[id]);useEffect(()=>{const b=p010Feedback(state);const frame=reducedMotion&&b?Math.min(b.end-1,'hold'in b?b.hold:20):state.localFrame;art.current?.draw(state.domain,frame);},[state.domain,state.localFrame,reducedMotion]);return <svg ref={svg} className="nms-l02-p010__art" aria-hidden="true" focusable="false"/>;}
export function NmsL2P010Presentation(props:P010PresentationProps){const {state:s,language}=props,t=p010Teaching(s),feedback=p010Feedback(s),buttons=useRef<(HTMLButtonElement|null)[]>([]),close=useRef<HTMLButtonElement>(null),previous=useRef(s.phase);const wrong=s.outcome==='wrong'&&s.branch!==null?P010_BRANCHES.wrong[s.branch-1]:null,popup=!!wrong&&s.localFrame>=wrong.popup&&s.phase!=='wrong-out';
 useEffect(()=>{if(s.phase==='question'&&previous.current==='wrong-out'&&s.answer!==null)buttons.current[s.answer]?.focus();previous.current=s.phase;},[s.phase,s.answer]);
 useEffect(()=>{if(popup)close.current?.focus();},[popup]);
 return <section className="nms-l02-p010" data-source-native-typography="true" data-p010-phase={s.phase} data-p010-main-frame={s.mainFrame} data-p010-domain={s.domain} data-p010-local-frame={s.localFrame} data-p010-attempts={s.attempts} data-p010-branch={s.branch??''} data-p010-replay={s.replay}>
  <header className="nms-l02-p010__header"><p lang="en">Fractions, Decimals, and Percents Concepts: Vocabulary</p><h2>{language==='es'?'Punto decimal':'Decimal Point'}</h2></header>
  {language==='es'&&<p className="nms-l02-p010__fallback" lang="es">Esta página conserva el texto y el audio originales en inglés. La definición del término está disponible en español.</p>}
  <div className="nms-l02-p010__question" style={{visibility:t.questionVisible?'visible':'hidden',opacity:t.questionOpacity}} lang="en">Click the <button className="nms-l02-p010__term" disabled={!t.termEnabled} onClick={e=>props.onTerm(e.currentTarget)}>decimal point</button>.</div>
  <div className="nms-l02-p010__number" style={{visibility:t.numberVisible?'visible':'hidden',opacity:t.numberOpacity}} role="group" aria-label={language==='es'?'Selecciona un carácter de 1,998.75':'Select a character in 1,998.75'} lang="en">
   {P010_GLYPHS.map((glyph,i)=><button key={P010_ANSWERS[i]} ref={e=>{buttons.current[i]=e;}} className="nms-l02-p010__answer" data-source-answer={P010_ANSWERS[i]} aria-label={`${glyph} — ${language==='es'?'carácter':'character'} ${i+1}`} disabled={!t.answersEnabled} onClick={()=>props.onAnswer(i)}>{glyph}</button>)}
  </div>
  {feedback&&<div className="nms-l02-p010__feedback" data-feedback-kind={s.outcome}>
   <FeedbackArt state={s} reducedMotion={props.reducedMotion}/>
   {p010FeedbackTitleVisible(s)&&<h3 lang="en" role="status">{feedback.title}</h3>}
   {popup&&<div className="nms-l02-p010__explanation"><p lang="en">{p010WrongExplanation(s.answer!)}</p><button ref={close} onClick={props.onCloseFeedback}>{language==='es'?'Cerrar':'Close'}</button></div>}
  </div>}
  {s.phase==='completed'&&<p className="nms-l02-p010__completed" role="status">{language==='es'?'Actividad completada. Puedes repetirla o continuar.':'Activity complete. You can replay or continue.'}</p>}
 </section>;
}
