'use client';
import type{AnimationRendererProps}from'./contract';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P033_SOURCE as S,type P033Term,type P033Answer}from'./alg-l07-p033-state-v1';
import{algL07P033Frame,type P033View}from'./alg-l07-p033-frame-v1';
import './alg-l07-p033-v1.css';
function Emphasis({name,text,view}:{name:'input'|'answer'|'result';text:string;view:P033View}){
 return view.visual.emphasis[name]?<span className="alg-l07-p033__emphasis" data-lesson-text-block={`emphasis-${name}`}>{text}</span>:<>{text}</>;
}
function Squared({base}:{base:'x'|'3'}){return <span className="alg-l07-p033__math-term" role="math" aria-label={`y equals ${base==='x'?'x':'three'} squared`}><span aria-hidden="true">y = {base}<sup>2</sup></span></span>;}
function Question({view}:{view:P033View}){
 const text=view.visual.rawSourceQuestion,parts=text.split(/(y = x2|x = 3)/);
 return <>{parts.map((part,i)=>part==='y = x2'?<Squared key={i} base="x"/>:part==='x = 3'?<span key={i} className="alg-l07-p033__math-term"><Emphasis name="input" text={part} view={view}/></span>:<span key={i}>{part}</span>)}</>;
}
export function AlgL07P033Presentation({view,onChoose,onClose,onTerm}:{view:P033View;onChoose?:(answer:P033Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P033Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const compact=view.visual.answerAlpha.A===0&&view.visual.answerAlpha.D>0,steps=S.steps.filter(step=>view.visual.stepAlpha[String(step.characterId)as keyof typeof view.visual.stepAlpha]>0);
 return <section className="alg-l07-p033 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Instruction" language="en"/>
  {view.visual.definition&&<p className="alg-l07-p033__definition" data-lesson-text-block="definition">{view.visual.definition}</p>}
  {view.visual.rawSourceQuestion&&<p className="alg-l07-p033__question" data-lesson-text-block="question"><Question view={view}/></p>}
  {onTerm&&<nav className="alg-l07-p033__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{view.visual.terms.map(term=><button type="button" key={term} data-p033-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {view.state.feedback&&<section className="alg-l07-p033__feedback" tabIndex={-1} data-p033-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p033-close="true" onClick={onClose}>Close</button></>}
  </section>}
  <div className="alg-l07-p033__answers" data-p033-compact={compact} data-p033-d-move={view.visual.dMove}>{S.answers.map(a=>{const alpha=view.visual.answerAlpha[a.letter];return <section key={a.letter} className="alg-l07-p033__answer" data-p033-answer-row={a.letter} data-source-alpha={alpha} style={{opacity:alpha,visibility:alpha>0?'visible':'hidden',...(compact&&a.answer!==4?{display:'none'}:{})}}><span className="alg-l07-p033__letter" data-lesson-text-block={`answer-${a.letter}`}>{a.letter}</span><span className="alg-l07-p033__value" data-lesson-text-block={`value-${a.letter}`} data-source-text-ids={a.valueIds.map(id=>`character-${id}`).join(',')}>{a.answer===4?<Emphasis name="answer" text={a.value} view={view}/>:a.value}</span>{onChoose&&view.state.phase!=='postquiz'&&<button type="button" data-p033-answer={a.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>onChoose(a.answer,e.currentTarget)} lang={view.language}>{view.language==='es'?'Elegir':'Choose'} {a.letter}</button>}</section>;})}</div>
  {steps.length>0&&<div className="alg-l07-p033__steps" aria-label="Evaluate the function">{steps.map(step=><p key={step.characterId} data-p033-step={step.characterId} data-lesson-text-block={`step-${step.characterId}`} style={{opacity:view.visual.stepAlpha[String(step.characterId)as keyof typeof view.visual.stepAlpha]}}>{step.characterId===178?<Squared base="x"/>:step.characterId===179?<Squared base="3"/>:step.characterId===181?<span className="alg-l07-p033__math-term"><Emphasis name="result" text={step.sourceText} view={view}/></span>:<span className="alg-l07-p033__math-term" role="math" aria-label="y equals three times three"><span aria-hidden="true">{step.sourceText}</span></span>}</p>)}</div>}
 </section>;
}
export function AlgL07P033Renderer(props:AnimationRendererProps){return <AlgL07P033Presentation view={algL07P033Frame(props.frame,{...props,frame:props.frame})}/>;}
