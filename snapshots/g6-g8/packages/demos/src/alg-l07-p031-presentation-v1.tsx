'use client';
import type{AnimationRendererProps}from'./contract';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P031_SOURCE as S,type P031Term,type P031Answer}from'./alg-l07-p031-state-v1';
import{algL07P031Frame,type P031View}from'./alg-l07-p031-frame-v1';
import './alg-l07-p031-v1.css';
function Emphasis({name,text,view}:{name:'money'|'rate'|'sunglasses'|'booth';text:string;view:P031View}){
 return view.visual.emphasis[name]?<span className="alg-l07-p031__emphasis" data-lesson-text-block={`emphasis-${name}`}>{text}</span>:<>{text}</>;
}
function Value({answer:a,view}:{answer:typeof S.answers[number];view:P031View}){
 const parts=a.value.split(' ');return <span className="alg-l07-p031__value" data-lesson-text-block={`value-${a.letter}`} data-source-text-ids={a.valueIds.map(id=>`character-${id}`).join(',')}>
  <span className="alg-l07-p031__math-term">{a.answer===3?<Emphasis name="money" text="M" view={view}/>:parts[0]} =</span>{' '}
  <span className="alg-l07-p031__math-term">{a.answer===3?<><Emphasis name="rate" text="0.50" view={view}/><Emphasis name="sunglasses" text="S" view={view}/></>:parts[2]}</span>{' '}
  <span className="alg-l07-p031__math-term">– {a.answer===3?<Emphasis name="booth" text="25" view={view}/>:parts[4]}</span>
 </span>;
}
function Paragraph({ids,view,kind}:{ids:readonly number[];view:P031View;kind:'problem'|'question'}){
 const visible=ids.filter(id=>view.visual.paragraphs[id]);return visible.length?<p className={`alg-l07-p031__${kind}`}>{visible.map((id,i)=><span key={id}>{i>0?' ':null}<span data-lesson-text-block={`paragraph-${id}`}>{view.visual.paragraphs[id]}</span></span>)}</p>:null;
}
export function AlgL07P031Presentation({view,onChoose,onClose,onTerm}:{view:P031View;onChoose?:(answer:P031Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P031Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const compact=view.visual.answerAlpha.A===0&&view.visual.answerAlpha.C>0;
 return <section className="alg-l07-p031 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Instruction" language="en"/>
  <Paragraph ids={[5,7,8]} view={view} kind="problem"/>
  <Paragraph ids={[11,16,20]} view={view} kind="question"/>
  {onTerm&&<nav className="alg-l07-p031__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{view.visual.terms.map(term=><button type="button" key={term} data-p031-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {view.state.feedback&&<section className="alg-l07-p031__feedback" tabIndex={-1} data-p031-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p031-close="true" onClick={onClose}>Close</button></>}
  </section>}
  <div className="alg-l07-p031__answers" data-p031-compact={compact} data-p031-c-move={view.visual.cMove}>{S.answers.map(a=>{const alpha=view.visual.answerAlpha[a.letter];return <section key={a.letter} className="alg-l07-p031__answer" data-p031-answer-row={a.letter} data-source-alpha={alpha} style={{opacity:alpha,visibility:alpha>0?'visible':'hidden',...(compact&&a.answer!==3?{display:'none'}:{})}}><span className="alg-l07-p031__letter" data-lesson-text-block={`answer-${a.letter}`}>{a.letter}</span><Value answer={a} view={view}/>{onChoose&&view.state.phase!=='postquiz'&&<button type="button" data-p031-answer={a.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>onChoose(a.answer,e.currentTarget)} lang={view.language}>{view.language==='es'?'Elegir':'Choose'} {a.letter}</button>}</section>;})}</div>
 </section>;
}
export function AlgL07P031Renderer(props:AnimationRendererProps){return <AlgL07P031Presentation view={algL07P031Frame(props.frame,{...props,frame:props.frame})}/>;}
