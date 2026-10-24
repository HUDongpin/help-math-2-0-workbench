'use client';
import{useEffect,useRef}from'react';
import type{AnimationRendererProps}from'./contract';
import{LessonAnimationTitleV1}from'./lesson-animation-title-v1';
import{ALG_L07_P038_SOURCE as S,type P038Term,type P038Answer}from'./alg-l07-p038-state-v1';
import type{P038SourceGraph}from'./alg-l07-p038-source-v1';
import{algL07P038Frame,type P038View}from'./alg-l07-p038-frame-v1';
import './alg-l07-p038-v1.css';
function MathText({text}:{text:string}){return <>{text.replaceAll('³','3').split(/(y = x3?)/).map((part,i)=>i%2===0?<span key={i}>{part}</span>:<span key={i} className="alg-l07-p038__math" {...(part.endsWith('3')?{role:'math','aria-label':'y equals x cubed'}:{})}>{part.endsWith('3')?<span aria-hidden="true">y = x<sup>3</sup></span>:part}</span>)}</>;}
const matrix=(m:readonly number[])=>`matrix(${m[0]*20} ${m[1]*20} ${m[2]*20} ${m[3]*20} ${m[4]} ${m[5]})`;
function SourceGraph({g,view}:{g:P038SourceGraph;view:P038View}){const ref=useRef<HTMLDivElement>(null),b=g.viewBox;useEffect(()=>{const e=ref.current;if(e)e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);},[]);const pos=(x:number,y:number)=>({left:`${(x-b[0])*100/b[2]}%`,top:`${(y-b[1])*100/b[3]}%`});return <div ref={ref} className="alg-l07-p038__scroll" role="region" tabIndex={0} aria-label={view.language==='es'?`Gráfico ${g.letter}. Desplaza para ver todos los valores.`:`Graph ${g.letter}. Scroll to view all values.`} data-p038-graph-scroll={g.letter}>
 <div className="alg-l07-p038__plot" style={{aspectRatio:`${b[2]} / ${b[3]}`}} data-p038-plot={g.letter}>
  <svg viewBox={b.join(' ')} aria-hidden="true">{g.paths.map(s=><g key={s.sourceShapeId} transform={matrix(s.matrix)} data-source-shape={s.sourceShapeId}>{s.paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} fillOpacity={p['fill-opacity']} stroke={p.stroke} strokeWidth={p['stroke-width']} strokeOpacity={p['stroke-opacity']} fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round"/>)}</g>)}</svg>
  {g.labels.map((l,i)=><span key={i} className="alg-l07-p038__axis" data-lesson-text-block={`axis-${g.letter}-${i}`} data-source-text-id={l.sourceTextId} style={pos(l.x,l.y)}>{l.text}</span>)}
  {g.points.map((p,i)=>{const v=view.visual.points[i];return <span key={i} className="alg-l07-p038__point-group" data-p038-point={i} data-source-alpha={v.alpha}>
   {v.alpha>0&&<span className="alg-l07-p038__dot" aria-hidden="true" style={{...pos(p.x,p.y),opacity:v.alpha}}/>}
   {v.labelAlpha>0&&<span className="alg-l07-p038__point-label" data-lesson-text-block={`point-${i}`} data-source-text-id={p.sourceTextId} style={{...pos(p.labelX,p.labelY),opacity:v.labelAlpha}}>{p.text}</span>}
  </span>;})}
 </div>
 </div>;}
export function AlgL07P038Presentation({view,onChoose,onClose,onTerm}:{view:P038View;onChoose?:(answer:P038Answer,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:P038Term,trigger:HTMLButtonElement)=>void}){
 if(!view.ready)return <section data-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} aria-busy="true"/>;
 const v=view.visual,compact=v.answerAlpha.A>0&&v.answerAlpha.B===0&&v.answerAlpha.C===0&&v.answerAlpha.D===0;
 return <section className="alg-l07-p038 lesson-text-presentation" data-animation-id={S.animationId} data-flash-animation-id={S.animationId} data-flash-frame={view.frame} data-flash-frame-domain={view.frameDomain} data-flash-root-frame={view.rootFrame} data-flash-scenario={view.scenario} data-flash-language={view.language} data-flash-seed={view.seed} data-flash-replay={view.replay} data-flash-trace-id={view.traceId} data-flash-requirement-id={view.requirementId} data-flash-entry-state-sha256={view.entryStateSha256} data-source-text-ids={view.sourceTextIds.join(',')} data-source-swf-sha256={S.sourceSha256} data-main-content-language="en" data-source-english-fallback={view.language==='es'} lang="en">
  <LessonAnimationTitleV1 courseTitle="Linear and Nonlinear Functions:" activityTitle="Instruction" language="en"/>
  {v.paragraphs.map((p,i)=>p&&<p key={i} className="alg-l07-p038__question" data-lesson-text-block={`paragraph-${i}`}><MathText text={p}/></p>)}
  {onTerm&&<nav className="alg-l07-p038__terms" aria-label={view.language==='es'?'Términos clave':'Key terms'} lang={view.language}>{v.terms.map(term=><button type="button" key={term} data-p038-term={term} onClick={e=>onTerm(term,e.currentTarget)}>{S.terms.find(t=>t.sourceKeyAttribute===term)!.labels[view.language]}</button>)}</nav>}
  {view.state.feedback&&<section className="alg-l07-p038__feedback" tabIndex={-1} data-p038-feedback={view.state.feedback.spriteId} aria-live="polite" aria-atomic="true">
   {view.feedbackTitleAlpha>0&&<h3 data-lesson-text-block={`feedback-title-${view.state.feedback.spriteId}`} style={{opacity:view.feedbackTitleAlpha}}>{view.feedbackTitle}</h3>}
   {view.closeVisible&&<><p data-lesson-text-block={`wrong-text-${view.state.feedback.spriteId}`}>{view.state.wrongText}</p><button type="button" data-lesson-text-block="close" data-p038-close="true" onClick={onClose}>Close</button></>}
  </section>}
  {v.tableAlpha>0&&<div className="alg-l07-p038__exercise" style={{opacity:v.tableAlpha}}>
   <table className="alg-l07-p038__table"><caption data-lesson-text-block="equation"><MathText text="y = x3"/></caption><thead><tr><th scope="col" data-lesson-text-block="table-heading-0">x</th><th scope="col" data-lesson-text-block="table-heading-1">y</th></tr></thead><tbody>{S.table.map((p,i)=><tr key={i} data-p038-table-row={i}>{[p.x,p.y].map((text,j)=><td key={j} data-lesson-text-block={`table-${i}-${j}`} data-source-text-ids={[p.ids[j],p.movingIds[j]].map(id=>`character-${id}`).join(',')} data-p038-moving={v.pairs[i].progress[j]>0&&v.pairs[i].progress[j]<1} data-p038-copied={v.pairs[i].progress[j]===1}>{text}</td>)}</tr>)}</tbody></table>
   {view.pairTexts.some(Boolean)&&<ol className="alg-l07-p038__pairs" aria-label="Ordered pairs from the table">{S.table.map((p,i)=><li key={i} data-p038-pair={i} data-p038-pair-x={v.pairs[i].progress[0]} data-p038-pair-y={v.pairs[i].progress[1]} data-p038-pair-bracket={v.pairs[i].bracket}><span data-lesson-text-block={`pair-${i}`}>{view.pairTexts[i]}</span></li>)}</ol>}
  </div>}
  <div className="alg-l07-p038__answers" data-p038-compact={compact}>{S.answers.map(a=>{const alpha=v.answerAlpha[a.letter];if(alpha===0)return null;const g=S.graphs.find(g=>g.answer===a.answer)!;return <section key={a.letter} className="alg-l07-p038__answer" data-p038-answer-row={a.letter} data-source-alpha={alpha} style={{opacity:alpha}}>
   <div className="alg-l07-p038__choice-heading"><span className="alg-l07-p038__letter" data-lesson-text-block={`answer-${a.letter}`}>{a.letter}</span>{onChoose&&view.state.phase!=='postquiz'&&<button type="button" data-p038-answer={a.answer} disabled={view.state.phase!=='quiz-held'||!view.state.quizButtonsEnabled||Boolean(view.state.glossary)} onClick={e=>onChoose(a.answer,e.currentTarget)} lang={view.language}>{view.language==='es'?'Elegir':'Choose'} {a.letter}</button>}</div>
   <SourceGraph g={g} view={view}/>
  </section>;})}</div>
 </section>;
}
export function AlgL07P038Renderer(props:AnimationRendererProps){return <AlgL07P038Presentation view={algL07P038Frame(props.frame,{...props,frame:props.frame})}/>;}
