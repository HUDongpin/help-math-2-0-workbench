'use client';
import type{AnimationRendererProps}from'./contract';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P036_SOURCE as S,type P036Term,type P036Answer}from'./alg-l07-p036-state-v1';
import{algL07P036Frame,type P036View}from'./alg-l07-p036-frame-v1';
import './alg-l07-p036-v1.css';
/** Render only the source-visible prefix; a sign, factor, or exponent stays with its base. */
function MathText({text}:{text:string}){
 const parts=text.replaceAll('³','3').split(/(y = (?:x3?|\(–2\)3?|– ?8?)|x = –2?|(?:∙\s*)?\((?:–2|4)\))/);
 return <>{parts.map((part,i)=>{if(i%2===0)return <span key={i}>{part}</span>;const cube=part.endsWith('3');return <span key={i} className="alg-l07-p036__math-term" {...(cube?{role:'math','aria-label':part.slice(0,-1)+' cubed'}:{})}>{cube?<span aria-hidden="true">{part.slice(0,-1)}<sup>3</sup></span>:part}</span>;})}</>;
}
export function AlgL07P036Presentation({view,onChoose,onClose,onTerm}:{view:P036View;onChoose?:(answer:P036Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P036Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const compact=view.visual.answerAlpha.A===0&&view.visual.answerAlpha.B>0,steps=S.steps.filter(step=>Boolean(view.visual.stepText[String(step.characterId)as keyof typeof view.visual.stepText]));
 return <section className="alg-l07-p036 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Instruction" language="en"/>
  {view.visual.rawSourceQuestion&&<p className="alg-l07-p036__question" data-lesson-text-block="question"><MathText text={view.visual.rawSourceQuestion}/></p>}
  {onTerm&&<nav className="alg-l07-p036__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{view.visual.terms.map(term=><button type="button" key={term} data-p036-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {view.state.feedback&&<section className="alg-l07-p036__feedback" tabIndex={-1} data-p036-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p036-close="true" onClick={onClose}>Close</button></>}
  </section>}
  <div className="alg-l07-p036__answers" data-p036-compact={compact} data-p036-b-move={view.visual.bMove}>{S.answers.map(a=>{const alpha=view.visual.answerAlpha[a.letter];return <section key={a.letter} className="alg-l07-p036__answer" data-p036-answer-row={a.letter} data-source-alpha={alpha} style={{opacity:alpha,visibility:alpha>0?'visible':'hidden',...(compact&&a.answer!==2?{display:'none'}:{})}}><span className="alg-l07-p036__letter" data-lesson-text-block={`answer-${a.letter}`}>{a.letter}</span><span className="alg-l07-p036__value" data-lesson-text-block={`value-${a.letter}`} data-source-text-ids={a.valueIds.map(id=>`character-${id}`).join(',')}>{a.value}</span>{onChoose&&view.state.phase!=='postquiz'&&<button type="button" data-p036-answer={a.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>onChoose(a.answer,e.currentTarget)} lang={view.language}>{view.language==='es'?'Elegir':'Choose'} {a.letter}</button>}</section>;})}</div>
  {steps.length>0&&<div className="alg-l07-p036__steps" aria-label="Evaluate the function">{steps.map(step=><p key={step.characterId} data-p036-step={step.characterId} data-lesson-text-block={`step-${step.characterId}`}><MathText text={view.visual.stepText[String(step.characterId)as keyof typeof view.visual.stepText]}/></p>)}</div>}
 </section>;
}
export function AlgL07P036Renderer(props:AnimationRendererProps){return <AlgL07P036Presentation view={algL07P036Frame(props.frame,{...props,frame:props.frame})}/>;}
