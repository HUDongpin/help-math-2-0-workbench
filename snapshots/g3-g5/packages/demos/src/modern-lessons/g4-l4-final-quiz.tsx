'use client';
import React,{useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from '../contract';
import {selectCourseG04L03Fq002QuestionOrder as drawTen} from '../timelines/course-g04-l03-fq-002-quiz-interaction';
import {gradeFinalQuizScore as grade} from './g4-l4-final-quiz-state';
import {answerQuestion,createQuizState,drawTwentyFourQuestionOrder,drawThirtyQuestionOrder,nextReview,sourceFrame,startReview,type QuizMode,type QuizOption,type QuizState} from './g4-l4-final-quiz-state';
import {SourceQuizAudioControls} from './g4-l4-final-quiz-audio-controls';
import type {SourceQuizAudioAsset} from './g4-l4-final-quiz-audio';

export interface FinalQuizQuestion {
 readonly id:number;readonly questionFrame:number;readonly reviewFrame:number;readonly prompt:string;readonly expression?:string|null;readonly sourceTextId:string;readonly sourceCharacter:number;
 readonly column:null|Readonly<{top:string;operator:string;bottom:string;sourceOperator:string;ruleCharacter:number}>;
 readonly options:readonly Readonly<{option:QuizOption;value:string;correct:boolean;sourceInstance:string;sourceCharacter:number;readonly sourceTextIds:readonly string[];readonly sourceCharacters?:readonly number[];reviewSourceInstance:string;reviewSourceCharacter:number;readonly reviewSourceCharacters?:readonly number[]}>[];
}
export interface FinalQuizConfig {readonly reviewCorrectOptionFeedback?:true;readonly questionPoolSize?:24|30;readonly title:string;readonly questions:readonly FinalQuizQuestion[];readonly assets:readonly SourceQuizAudioAsset[]}

const CSS=`
.g4l4-finalquiz{box-sizing:border-box;container:g4finalquiz / inline-size;inline-size:100%;min-inline-size:0;padding:.8rem;background:#fffdf7;color:#17273c;font:1.125rem/1.65 var(--lesson-font-body,system-ui,sans-serif)}
.g4l4-finalquiz *{box-sizing:border-box}.g4l4-finalquiz [hidden]{display:none!important}
.g4l4-finalquiz h2{font:700 2.25rem/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .5em;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-finalquiz h3{font:600 1.25rem/1.5 var(--lesson-font-body,system-ui,sans-serif);margin:.75em 0}
.g4l4-finalquiz p{margin:.6em 0;overflow-wrap:normal;word-break:normal;hyphens:none}
.g4l4-finalquiz button{font:inherit;min-inline-size:44px;min-block-size:44px;touch-action:manipulation;cursor:pointer}
.g4l4-finalquiz button:disabled{cursor:default}.g4l4-finalquiz button:focus-visible,.g4l4-finalquiz [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-finalquiz__prompt{scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-finalquiz__math-port{max-inline-size:100%;min-block-size:44px;overflow-x:auto;overscroll-behavior-inline:contain;padding:.4rem .2rem}
.g4l4-finalquiz__math{display:grid;grid-template-columns:1ch max-content;gap:0 .5ch;inline-size:max-content;margin-inline:auto;font:600 1.5rem/1.5 var(--lesson-font-body,system-ui,sans-serif);font-variant-numeric:tabular-nums;white-space:nowrap;border-block-end:2px solid currentColor;padding:.15em .25em}
.g4l4-finalquiz__operand{text-align:right;grid-column:2}.g4l4-finalquiz__operator{grid-row:2;grid-column:1}
.g4l4-finalquiz__options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;margin-block:1rem}
.g4l4-finalquiz__option{display:grid;grid-template-columns:1.4em minmax(0,1fr);gap:.4em;align-items:start;text-align:start;color:inherit;background:white;border:2px solid #54799f;border-radius:.5rem;padding:.65rem;overflow-wrap:normal;word-break:normal}
.g4l4-finalquiz__option[data-result='correct']{border-color:#276749;background:#eff9f2}.g4l4-finalquiz__option[data-result='incorrect']{border-color:#a24032;background:#fff3ef}
.g4l4-finalquiz__feedback{grid-column:2;font-size:var(--lesson-text-body-size,1.125rem);font-weight:600}
.g4l4-finalquiz__summary{border:2px solid #386993;border-radius:.6rem;padding:.8rem;margin-block:1rem;background:#f0f7ff;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-finalquiz__action{background:#1757af;color:white;border:1px solid #1757af;border-radius:.45rem;padding:.5rem .9rem;margin:.3rem .5rem .3rem 0}
@container g4finalquiz (max-width:30rem){.g4l4-finalquiz h2{font-size:1.625rem}.g4l4-finalquiz__options{grid-template-columns:minmax(0,1fr)}}
@container g4finalquiz (max-width:30rem){[data-modern-text-page="course-g04-l08-fq-002"] .g4l4-finalquiz h2{font-size:1.5rem}}
@container g4finalquiz (max-width:30rem){[data-modern-text-page="course-g04-l08-fq-003"] .g4l4-finalquiz h2{font-size:1.5rem}}
@media(max-width:480px){.g4l4-finalquiz{padding-inline:0}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-finalquiz){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
 .lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-finalquiz)>.lesson-shell2__stage{padding-inline:2px}}
`;

export function FinalQuizScene({config:c,state:s,runtime:r,ready,onAnswer,onReview,onNext}:{config:FinalQuizConfig;state:QuizState;runtime:AnimationRendererProps;ready:boolean;onAnswer:(id:number,option:QuizOption)=>void;onReview:()=>void;onNext:()=>void}) {
 const root=useRef<HTMLElement>(null),review=s.phase==='review'||s.phase==='finish';
 const index=review?Math.min(s.reviewIndex??0,s.order.length-1):Math.min(s.questionIndex,s.order.length-1);
 const q=c.questions.find(q=>q.id===s.order[index])!;
 const response=s.responses.find(a=>a.questionId===q.id),correct=q.options.find(a=>a.correct)!;
 const score=s.responses.filter(a=>a.correct).length,locked=!ready||r.paused===true;
 const focusKey=`${s.phase}:${q.id}:${s.finishOverlayVisible}:${s.resultOverlayVisible}`;
 useLayoutEffect(()=>{const target=root.current?.querySelector<HTMLElement>(s.finishOverlayVisible||s.resultOverlayVisible?'[data-quiz-focus="summary"]':'[data-quiz-focus="prompt"]');if(!target)return;target.focus({preventScroll:true});const box=target.getBoundingClientRect(),header=Number.parseFloat(window.getComputedStyle(target).getPropertyValue('--lesson-platform-header-height'))||0;if(typeof target.scrollIntoView==='function'&&(box.top<header+12||box.bottom>window.innerHeight))target.scrollIntoView({block:'start',behavior:'instant'});},[focusKey]);
 const showQuestion=s.phase!=='results'&&s.phase!=='finish';
 return <section ref={root} className="g4l4-finalquiz" lang="en" data-quiz-phase={s.phase} data-quiz-question={q.id} data-source-frame={sourceFrame(s,c.questions)} data-quiz-count={s.order.length} data-finish-overlay={s.finishOverlayVisible} data-result-overlay={s.resultOverlayVisible}>
  <style>{CSS}</style><h2 data-lesson-text-block="root-title">{c.title}</h2>
  {showQuestion&&<>
   {review&&<h3 data-lesson-text-block="review-heading">Quiz Review</h3>}
   <p data-lesson-text-block="question-progress">{review?'Review':'Question'} {index+1} of {s.order.length}</p>
   <div className="g4l4-finalquiz__prompt" data-quiz-focus="prompt" tabIndex={-1}>
    {q.column?<div className="g4l4-finalquiz__math-port" role="region" aria-label="Vertical arithmetic" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowLeft'?-1:1)*Math.max(44,p.clientWidth/2);}}>
     <div className="g4l4-finalquiz__math" data-lesson-text-block={`q${q.id}-prompt`} data-source-text={q.sourceTextId} data-source-rule={q.column.ruleCharacter} role="math" aria-label={`${q.column.top} ${q.column.operator==='+'?'plus':'minus'} ${q.column.bottom}`}>
      <span className="g4l4-finalquiz__operand" data-column-row="top">{q.column.top}</span><span className="g4l4-finalquiz__operator" aria-hidden="true">{q.column.operator}</span><span className="g4l4-finalquiz__operand" data-column-row="bottom">{q.column.bottom}</span>
     </div>
    </div>:<h3 data-lesson-text-block={`q${q.id}-prompt`} data-source-text={q.sourceTextId}>{q.prompt}</h3>}
    {q.expression&&<div className="g4l4-finalquiz__math-port" role="region" aria-label="Mathematical expression" tabIndex={0} onKeyDown={e=>{if(e.target!==e.currentTarget||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const p=e.currentTarget;p.scrollLeft=e.key==='Home'?0:e.key==='End'?p.scrollWidth:p.scrollLeft+(e.key==='ArrowLeft'?-1:1)*Math.max(44,p.clientWidth/2);}}><div role="math" data-lesson-text-block={`q${q.id}-expression`} data-source-text={q.sourceTextId} style={{width:'max-content',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums',fontWeight:600}}>{q.expression}</div></div>}
   </div>
   {review&&response&&<p data-lesson-text-block="review-response">Your Answer: {response.option}. Correct Answer: {correct.option}.</p>}
   <div className="g4l4-finalquiz__options" role="group" aria-label={review?'Answer review':'Answer choices'}>{q.options.map(o=>{
    const selected=review&&response?.option===o.option,correctFeedback=review&&c.reviewCorrectOptionFeedback===true&&o.correct,result=correctFeedback?'correct':selected?(response!.correct?'correct':'incorrect'):'';
    const content=<><span>{o.option}</span><span>{o.value}</span>{(selected||correctFeedback)&&<span className="g4l4-finalquiz__feedback" data-lesson-text-block={selected?`q${q.id}-feedback`:`q${q.id}-correct-feedback`}>{correctFeedback||response!.correct?'Correct':'Incorrect'}</span>}</>;
    const attrs={'data-lesson-text-block':`q${q.id}-option-${o.option}`,'data-source-instance':review?o.reviewSourceInstance:o.sourceInstance,'data-source-character':review?o.reviewSourceCharacter:o.sourceCharacter,'data-source-characters':(review?o.reviewSourceCharacters:o.sourceCharacters)?.join(','),'data-result':result,className:'g4l4-finalquiz__option'};
    return review?<div key={o.option} {...attrs}>{content}</div>:<button key={o.option} {...attrs} type="button" disabled={locked} aria-label={`Answer ${o.option}: ${o.value}`} onClick={()=>onAnswer(q.id,o.option)}>{content}</button>;
   })}</div>
   {!review&&<SourceQuizAudioControls questionPoolSize={c.questionPoolSize??25} assets={c.assets} questionId={q.id} ready={ready} runtime={r}/>}
   {review&&<button data-lesson-text-block="review-next" type="button" className="g4l4-finalquiz__action" disabled={locked||s.nextDisabled} onClick={onNext}>Continue</button>}
  </>}
  {(s.finishOverlayVisible||s.resultOverlayVisible)&&<div className="g4l4-finalquiz__summary" data-quiz-focus="summary" tabIndex={-1} role="status">
   <h3 data-lesson-text-block="completion-message">You have completed the quiz.</h3><p data-lesson-text-block="score">Your score is {score} of {s.order.length}. {grade(score,c.questionPoolSize??25)}</p>
   {s.phase==='results'&&<button data-lesson-text-block="review-start" type="button" className="g4l4-finalquiz__action" disabled={locked} onClick={onReview}>Click here to start review</button>}
   {s.phase==='finish'&&<button type="button" className="g4l4-finalquiz__action" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button>}
  </div>}
 </section>;
}

/** Local native candidate. Source binding and My Lesson registration are separate. */
type SessionProps={config:FinalQuizConfig;mode:QuizMode;runtime:AnimationRendererProps;ready:boolean};
export function FinalQuizSession(props:SessionProps) {
 const r=props.runtime;return <FinalQuizSessionState key={`${props.mode}:${r.seed>>>0}:${r.replay??0}:${r.frameDomain}:${r.rootFrame}:${r.scenario}:${r.lang}`} {...props}/>;
}
function FinalQuizSessionState({config,mode,runtime,ready}:SessionProps) {
 const [state,setState]=useState(()=>createQuizState(mode,runtime.seed,config.questionPoolSize===30?drawThirtyQuestionOrder:config.questionPoolSize===24?drawTwentyFourQuestionOrder:drawTen,config.questionPoolSize??25));const live=useRef(state);live.current=state;
 const apply=(next:QuizState)=>{if(next!==live.current){live.current=next;setState(next);}};
 const permitted=()=>ready&&!runtime.paused;
 return <FinalQuizScene config={config} state={state} runtime={runtime} ready={ready} onAnswer={(id,option)=>{if(permitted())apply(answerQuestion(live.current,config.questions,id,option));}} onReview={()=>{if(permitted())apply(startReview(live.current));}} onNext={()=>{if(permitted())apply(nextReview(live.current));}}/>;
}
