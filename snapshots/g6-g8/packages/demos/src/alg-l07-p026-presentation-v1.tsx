'use client';
import type{AnimationRendererProps}from'./contract';import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P026_SOURCE as S,type P026Term,type P026Answer}from'./alg-l07-p026-state-v1';import{algL07P026Frame,type P026View}from'./alg-l07-p026-frame-v1';
import './alg-l07-p026-v1.css';
function Question({text,highlight}:{text:string;highlight:boolean}){
 const match=/–5x?/.exec(text);
 if(!match)return <>{text}</>;
 return <>{text.slice(0,match.index)}<span className="alg-l07-p026__signed-term">{highlight?<><span className="alg-l07-p026__emphasis" data-lesson-text-block="question-coefficient">–5</span>{match[0].slice(2)}</>:match[0]}</span>{text.slice(match.index+match[0].length)}</>;
}
function Value({answer:a,view}:{answer:typeof S.answers[number];view:P026View}){return <span className="alg-l07-p026__value" data-lesson-text-block={`value-${a.letter}`} data-source-text-ids={a.valueIds.map(id=>`character-${id}`).join(',')}>{a.kind==='fraction'?<span role="math" aria-label="negative five ninths"><span aria-hidden="true">–<span className="alg-l07-p026__fraction"><span>{a.numerator}</span><span>{a.denominator}</span></span></span></span>:<span className={a.answer===2&&view.visual.answerCoefficient?'alg-l07-p026__emphasis':undefined} {...(a.answer===2&&view.visual.answerCoefficient?{'data-lesson-text-block':'answer-coefficient'}:{})}>{a.value}</span>}</span>;}
export function AlgL07P026Presentation({view,onChoose,onClose,onTerm}:{view:P026View;onChoose?:(answer:P026Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P026Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const compact=view.visual.answerAlpha.A===0&&view.visual.answerAlpha.B>0,q=view.visual.question,highlight=view.visual.questionCoefficient;
 return <section className="alg-l07-p026 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Instruction" language="en"/>
  {view.visual.definition&&<p className="alg-l07-p026__definition"><span data-lesson-text-block="definition">{view.visual.definition}</span>{view.visual.continuation&&<> <span data-lesson-text-block="continuation">{view.visual.continuation}</span></>}</p>}
  {onTerm&&<nav className="alg-l07-p026__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{view.visual.terms.map(term=><button type="button" key={term} data-p026-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {q&&<p className="alg-l07-p026__question" data-lesson-text-block="question"><Question text={q} highlight={highlight}/></p>}
  {view.state.feedback&&<section className="alg-l07-p026__feedback" tabIndex={-1} data-p026-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p026-close="true" onClick={onClose}>Close</button></>}
  </section>}
  <div className="alg-l07-p026__answers" data-p026-compact={compact} data-p026-b-move={view.visual.bMove}>{S.answers.map(a=>{const alpha=view.visual.answerAlpha[a.letter];return <section key={a.letter} className="alg-l07-p026__answer" data-p026-answer-row={a.letter} data-source-alpha={alpha} style={{opacity:alpha,visibility:alpha>0?'visible':'hidden',...(compact&&a.answer!==2?{display:'none'}:{})}}><span className="alg-l07-p026__letter" data-lesson-text-block={`answer-${a.letter}`}>{a.letter}</span><Value answer={a} view={view}/>{onChoose&&view.state.phase!=='postquiz'&&<button type="button" data-p026-answer={a.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>onChoose(a.answer,e.currentTarget)} lang={view.language}>{view.language==='es'?'Elegir':'Choose'} {a.letter}</button>}</section>;})}</div>
 </section>;
}
export function AlgL07P026Renderer(props:AnimationRendererProps){return <AlgL07P026Presentation view={algL07P026Frame(props.frame,{...props,frame:props.frame})}/>;}
