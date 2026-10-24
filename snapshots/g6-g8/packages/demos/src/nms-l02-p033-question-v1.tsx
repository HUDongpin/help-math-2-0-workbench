'use client';
import {useRef,type ReactNode}from'react';
import {LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import {P033HundredthsModel,P033AnswerChart}from'./nms-l02-p033-figures-v1';
import {p033Teaching,p033QuestionText,p033QuestionDecimalReadable,p033DecimalEmphasis}from'./nms-l02-p033-teaching-v1';
import {P033_OPTIONS,p033CanHelp,type P033SessionState}from'./nms-l02-p033-state-v1';
import './nms-l02-p033-question-v1.css';
export interface P033QuestionProps{
 readonly interactionEnabled?:boolean;readonly state:P033SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;
 readonly onAnswer:(index:number)=>void;readonly onHelp:(trigger:HTMLButtonElement)=>void;
 readonly onTerm?:(id:string,trigger:HTMLButtonElement)=>void;
}
/** Main teaching surface only. Feedback and help modal use their own source
 * domains; the integrating player retains the stopped main frame beneath them. */
export function P033Question({state,language='en',reducedMotion=false,interactionEnabled=true,onAnswer,onHelp,onTerm}:P033QuestionProps){
 const latest=useRef(state);latest.current=state;const t=p033Teaching(state),prefix=p033QuestionText(state);
 const full=t.questionRuns.every(r=>r.fractions.every(v=>v===1)),enabled=interactionEnabled&&state.phase==='question'&&!state.help;
 const opacity=(value:number)=>reducedMotion&&value>0?1:value;
 const question:ReactNode=full?t.questionRuns.map(r=>r.termId&&onTerm?<button key={r.sourceTextId} type="button" className="p033-question__term" data-p033-question-term={r.termId} onClick={e=>{if(p033QuestionDecimalReadable(latest.current)&&!latest.current.help)onTerm(r.termId!,e.currentTarget);}} disabled={state.help}>{r.text}</button>:<span key={r.sourceTextId}>{r.text}</span>):<><span className="p033-question__sr">{prefix}</span><span aria-hidden="true">{t.questionRuns.flatMap(r=>[...r.text].map((char,i)=><span key={r.sourceTextId+'-'+i} className="p033-question__glyph" style={{clipPath:`inset(0 ${(1-r.fractions[i])*100}% 0 0)`}}>{char}</span>))}</span></>;
 return <section className="p033-question lesson-text-presentation" lang="en" data-p033-main-frame={state.mainFrame} data-p033-phase={state.phase} data-p033-replay={state.replay}>
  <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
  {language==='es'&&<p lang="es" className="p033-question__fallback">Esta página conserva el título y el texto originales en inglés. Las definiciones están disponibles en español.</p>}
  <p className="p033-question__prompt" data-lesson-text-block="question" data-p033-question-text={prefix} style={{opacity:opacity(t.questionAlpha)}}>{question}</p>
  <div className="p033-question__layout">
   <div className="p033-question__model"><P033HundredthsModel state={state} language={language} reducedMotion={reducedMotion}/></div>
   <div className="p033-question__options" role="group" aria-label={language==='es'?'Respuestas':'Answers'}>{P033_OPTIONS.map((value,i)=>t.optionAlphas[i]>0?<button key={value} type="button" data-p033-answer={i} data-lesson-text-block={'answer-'+i} className="p033-question__answer" style={{opacity:opacity(t.optionAlphas[i])}} disabled={!enabled||t.optionAlphas[i]!==1} onClick={()=>{const s=latest.current;if(interactionEnabled&&s.phase==='question'&&!s.help&&p033Teaching(s).optionAlphas[i]===1)onAnswer(i);}}><span className="p033-question__letter">{'ABCD'[i]}</span><span>{value}</span></button>:null)}</div>
  </div>
  {t.helpLabelAlpha>0&&<button lang={language} className="p033-question__help" data-lesson-text-block="help" type="button" disabled={!interactionEnabled||!p033CanHelp(state)} onClick={e=>{if(interactionEnabled&&p033CanHelp(latest.current))onHelp(e.currentTarget);}}>{language==='es'?'Necesito más ayuda':'Need More Help'}</button>}
  {p033DecimalEmphasis(state,reducedMotion)&&<p className="p033-question__number" data-lesson-text-block="transient-number">0.25</p>}
  <P033AnswerChart state={state} language={language} reducedMotion={reducedMotion} onTerm={onTerm}/>
 </section>;
}
