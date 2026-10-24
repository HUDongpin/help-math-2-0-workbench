'use client';
import {useRef,type ReactNode}from'react';
import {LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import {P031TenthsModel,P031AnswerChart}from'./nms-l02-p031-figures-v1';
import {p031Teaching,p031QuestionText,p031QuestionDecimalReadable}from'./nms-l02-p031-teaching-v1';
import {P031_OPTIONS,p031CanHelp,type P031SessionState}from'./nms-l02-p031-state-v1';
import './nms-l02-p031-question-v1.css';
export interface P031QuestionProps{
 readonly interactionEnabled?:boolean;readonly state:P031SessionState;readonly language?:'en'|'es';readonly reducedMotion?:boolean;
 readonly onAnswer:(index:number)=>void;readonly onHelp:(trigger:HTMLButtonElement)=>void;
 readonly onTerm?:(id:string,trigger:HTMLButtonElement)=>void;
}
/** Main teaching surface only. Feedback and help modal use their own source
 * domains; the integrating player retains the stopped main frame beneath them. */
export function P031Question({state,language='en',reducedMotion=false,interactionEnabled=true,onAnswer,onHelp,onTerm}:P031QuestionProps){
 const latest=useRef(state);latest.current=state;const t=p031Teaching(state),prefix=p031QuestionText(state);
 const full=t.questionRuns.every(r=>r.fractions.every(v=>v===1)),enabled=interactionEnabled&&state.phase==='question'&&!state.help;
 const opacity=(value:number)=>reducedMotion&&value>0?1:value;
 const question:ReactNode=full?t.questionRuns.map(r=>r.termId&&onTerm?<button key={r.sourceTextId} type="button" className="p031-question__term" data-p031-question-term={r.termId} onClick={e=>{if(p031QuestionDecimalReadable(latest.current)&&!latest.current.help)onTerm(r.termId!,e.currentTarget);}} disabled={state.help}>{r.text}</button>:<span key={r.sourceTextId}>{r.text}</span>):<><span className="p031-question__sr">{prefix}</span><span aria-hidden="true">{t.questionRuns.flatMap(r=>[...r.text].map((char,i)=><span key={r.sourceTextId+'-'+i} className="p031-question__glyph" style={{clipPath:`inset(0 ${(1-r.fractions[i])*100}% 0 0)`}}>{char}</span>))}</span></>;
 return <section className="p031-question lesson-text-presentation" lang="en" data-p031-main-frame={state.mainFrame} data-p031-phase={state.phase} data-p031-replay={state.replay}>
  <LessonAnimationTitleV1 courseTitle="Fractions, Decimals, and Percents Concepts:" activityTitle="Instruction" language="en"/>
  {language==='es'&&<p lang="es" className="p031-question__fallback">Esta página conserva el título y el texto originales en inglés. Las definiciones están disponibles en español.</p>}
  <p className="p031-question__prompt" data-lesson-text-block="question" data-p031-question-text={prefix} style={{opacity:opacity(t.questionAlpha)}}>{question}</p>
  <div className="p031-question__layout">
   <div className="p031-question__model"><P031TenthsModel state={state} language={language} reducedMotion={reducedMotion}/></div>
   <div className="p031-question__options" role="group" aria-label={language==='es'?'Respuestas':'Answers'}>{P031_OPTIONS.map((value,i)=>t.optionAlphas[i]>0?<button key={value} type="button" data-p031-answer={i} data-lesson-text-block={'answer-'+i} className="p031-question__answer" style={{opacity:opacity(t.optionAlphas[i])}} disabled={!enabled||t.optionAlphas[i]!==1} onClick={()=>{const s=latest.current;if(interactionEnabled&&s.phase==='question'&&!s.help&&p031Teaching(s).optionAlphas[i]===1)onAnswer(i);}}><span className="p031-question__letter">{'ABCD'[i]}</span><span>{value}</span></button>:null)}</div>
  </div>
  {t.helpButtonPoses.length>0&&<button className="p031-question__help" data-lesson-text-block="help" type="button" disabled={!p031CanHelp(state)} onClick={e=>{if(p031CanHelp(latest.current))onHelp(e.currentTarget);}}>{language==='es'?'Necesito más ayuda':'Need More Help'}</button>}
  {(t.zeroDigitAlpha>0||t.pointAlpha>0||t.sevenDigitAlpha>0)&&<p className="p031-question__number" data-lesson-text-block="transient-number" aria-label={[['0',t.zeroDigitAlpha],['.',t.pointAlpha],['7',t.sevenDigitAlpha]].filter(([,a])=>Number(a)>0).map(([text])=>text).join('')}>{[['0',t.zeroDigitAlpha],['.',t.pointAlpha],['7',t.sevenDigitAlpha]].map(([text,alpha])=><span key={text} aria-hidden="true" style={{opacity:opacity(Number(alpha))}}>{text}</span>)}</p>}
  <P031AnswerChart state={state} language={language} reducedMotion={reducedMotion} onTerm={onTerm}/>
 </section>;
}
