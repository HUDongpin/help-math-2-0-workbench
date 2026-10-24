'use client';
import type{AnimationRendererProps}from'./contract';import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P007_SOURCE as S,type P007Term,type P007Answer}from'./alg-l07-p007-state-v1';import{algL07P007Frame,type P007View}from'./alg-l07-p007-frame-v1';
import './alg-l07-p007-v1.css';
type Path=typeof S.graphs[number]['sourcePaths'][number]|typeof S.graphEmphasis.red[number];
function SourcePath({p}:{p:Path}){return <path d={p.d} fill={p.paint==='fill'?p.color:'none'} fillRule="evenodd" stroke={p.paint==='stroke'?p.color:'none'} strokeWidth={p.width*20} strokeLinecap="round" strokeLinejoin="round" opacity={p.alpha} data-source-shape={p.sourceShapeId} data-source-path={p.sourcePathIndex}/>;}
function Graph({graph:g,view,choose}:{graph:typeof S.graphs[number];view:P007View;choose?:(answer:P007Answer,trigger:HTMLButtonElement)=>void}){const v=view.visual,alpha=view.ready?v.graphAlpha[g.letter]:0;const box=g.viewBox,emphasis=S.graphEmphasis,blue=v.blueLine;
 return <section className={`alg-l07-p007__card alg-l07-p007__card--${g.letter}`} style={{opacity:alpha,visibility:alpha>0?'visible':'hidden',...(g.letter==='B'?{transform:`translateY(calc(${v.bMove} * (-100% - 1rem)))`}:{})}} data-p007-graph={g.letter} data-graph-alpha={alpha} data-p007-move={g.letter==='B'?v.bMove:0} aria-label={`Graph ${g.letter}`}>
  <h3 data-lesson-text-block={`answer-${g.letter}`}>{g.letter}</h3><div className="alg-l07-p007__plot"><svg viewBox={box.join(' ')} aria-hidden="true">{g.sourcePaths.map((p,i)=><SourcePath key={i} p={p}/>)}{g.letter==='B'&&<g transform={`translate(${-emphasis.bPostMatrix[0]} ${-emphasis.bPostMatrix[1]})`}>{v.redEmphasis&&emphasis.red.map((p,i)=><SourcePath key={i} p={p}/>)}{blue!==null&&<path d={`M ${emphasis.blueStart[0]} ${emphasis.blueStart[1]} L ${emphasis.blueStart[2]+(emphasis.blueEnd[2]-emphasis.blueStart[2])*blue} ${emphasis.blueStart[3]+(emphasis.blueEnd[3]-emphasis.blueStart[3])*blue}`} fill="none" stroke="#00f" strokeWidth="30" strokeLinecap="round" data-source-shape="225,227"/>}</g>}</svg>
   {g.labels.map((l,i)=><span key={i} className="alg-l07-p007__axis" data-lesson-text-block={`graph-${g.letter}-${i}`} data-source-text-id={l.sourceTextId} data-source-instance-id={l.instanceId} style={{left:`${(l.x-box[0])*100/box[2]}%`,top:`${(l.y-box[1])*100/box[3]}%`}}>{l.text}</span>)}
  </div>{choose&&<button type="button" data-p007-answer={g.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>choose(g.answer,e.currentTarget)}>{view.language==='es'?'Elegir':'Choose'} {g.letter}</button>}
 </section>;
}
export function AlgL07P007Presentation({view,onChoose,onClose,onTerm}:{view:P007View;onChoose?:(answer:P007Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P007Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 return <section className="alg-l07-p007 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Vocabulary" language="en"/>
  {view.visual.definition&&<p className="alg-l07-p007__definition" data-lesson-text-block="definition">{view.visual.definition}</p>}
  {onTerm&&<nav className="alg-l07-p007__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{view.visual.terms.map(term=><button type="button" key={term} data-p007-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {view.visual.question&&<p className="alg-l07-p007__question" data-lesson-text-block="question">{view.visual.question}</p>}
  {view.state.feedback&&<section className="alg-l07-p007__feedback" tabIndex={-1} data-p007-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p007-close="true" onClick={onClose}>Close</button></>}
  </section>}
  <div className="alg-l07-p007__graphs" data-p007-compact={view.visual.bMove===1}>{S.graphs.map(g=><Graph key={g.letter} graph={g} view={view} choose={onChoose}/>)}</div>
 </section>;
}
export function AlgL07P007Renderer(props:AnimationRendererProps){return <AlgL07P007Presentation view={algL07P007Frame(props.frame,{...props,frame:props.frame})}/>;}
