'use client';
import type{CSSProperties}from'react';import type{AnimationRendererProps}from'./contract';import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P021_SOURCE as S,type P021Term,type P021Answer}from'./alg-l07-p021-state-v1';import{algL07P021Frame,type P021View}from'./alg-l07-p021-frame-v1';
import './alg-l07-p021-v1.css';
function SourcePath({p}:{p:typeof S.graphs[number]['sourcePaths'][number]}){const a=p.attributes as Readonly<Record<string,string>>;return <path d={a.d} fill={a.fill??'none'} fillRule="evenodd" stroke={a.stroke??'none'} strokeWidth={a['stroke-width']} strokeOpacity={a['stroke-opacity']} strokeLinecap="round" strokeLinejoin="round" data-source-shape={p.sourceShapeId} data-source-path={p.sourcePathIndex}/>;}
function Graph({graph:g,view,choose}:{graph:typeof S.graphs[number];view:P021View;choose?:(answer:P021Answer,trigger:HTMLButtonElement)=>void}){const v=view.visual,alpha=view.ready?v.graphAlpha[g.letter]:0,box=g.viewBox,r=g.rect,zoom=(v.aScale-1)/.5;const style={opacity:alpha,visibility:alpha>0?'visible':'hidden',...(g.letter==='A'?{'--p021-move':v.aMove,'--p021-zoom':zoom}:{})}as CSSProperties;
 return <section className={`alg-l07-p021__card alg-l07-p021__card--${g.letter}`} style={style} data-p021-graph={g.letter} data-graph-alpha={alpha} data-p021-move={g.letter==='A'?v.aMove:0} data-p021-scale={g.letter==='A'?v.aScale:1} aria-label={`Graph ${g.letter}`}>
  <h3 data-lesson-text-block={`answer-${g.letter}`}>{g.letter}</h3><div className="alg-l07-p021__plot-scroll" tabIndex={0} aria-label={view.language==='es'?`Gráfica ${g.letter}, desplazamiento horizontal disponible`:`Graph ${g.letter}, horizontal scrolling available`}><div className="alg-l07-p021__plot" style={{aspectRatio:`${box[2]}/${box[3]}`}}><svg viewBox={box.join(' ')} aria-hidden="true">{g.sourcePaths.map((p,i)=><SourcePath key={i} p={p}/>)}</svg>
   {g.labels.map((l,i)=><span key={i} className="alg-l07-p021__axis" data-lesson-text-block={`graph-${g.letter}-${i}`} data-source-text-id={l.sourceTextId} data-source-depth={l.sourceDepth} style={{left:`${(l.x-box[0])*100/box[2]}%`,top:`${(l.y-box[1])*100/box[3]}%`}}>{l.text}</span>)}
  </div></div>{choose&&<button type="button" data-p021-answer={g.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>choose(g.answer,e.currentTarget)}>{view.language==='es'?'Elegir':'Choose'} {g.letter}</button>}
 </section>;
}
export function AlgL07P021Presentation({view,onChoose,onClose,onTerm}:{view:P021View;onChoose?:(answer:P021Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P021Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 return <section className="alg-l07-p021 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Instruction" language="en"/>
  {view.visual.definition&&<p className="alg-l07-p021__definition" data-lesson-text-block="definition">{view.visual.definition}</p>}
  {onTerm&&<nav className="alg-l07-p021__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{view.visual.terms.map(term=><button type="button" key={term} data-p021-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {view.visual.question&&<p className="alg-l07-p021__question" data-lesson-text-block="question">{view.visual.question}</p>}
  {view.state.feedback&&<section className="alg-l07-p021__feedback" tabIndex={-1} data-p021-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p021-close="true" onClick={onClose}>Close</button></>}
  </section>}
  <div className="alg-l07-p021__graphs" data-p021-post={view.visual.aMove>0} data-p021-compact={view.visual.aScale===1.5}>{S.graphs.map(g=><Graph key={g.letter} graph={g} view={view} choose={onChoose}/>)}</div>
 </section>;
}
export function AlgL07P021Renderer(props:AnimationRendererProps){return <AlgL07P021Presentation view={algL07P021Frame(props.frame,{...props,frame:props.frame})}/>;}
