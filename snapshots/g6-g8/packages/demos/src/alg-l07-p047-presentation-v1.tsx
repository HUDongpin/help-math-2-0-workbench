'use client';
import {useEffect,useId,useRef} from 'react';
import type {AnimationRendererProps} from './contract';
import type {FixedExitPresentationPropsV1} from './source-fixed-exit-help-player-v2';
import type {FixedExitGraphV1,FixedExitVectorPathV1} from './source-fixed-exit-help-native-v1';
import {FixedExitHelpPresentationV2} from './source-fixed-exit-help-presentation-v2';
import {ALG_L07_P047_SOURCE as S,type P047SourceTerm} from './alg-l07-p047-source-v1';
import {algL07P047Frame,p047FormulaLabel,p047BarProgress,type P047View} from './alg-l07-p047-frame-v1';
import './alg-l07-p047-v1.css';

const matrix=(m:readonly number[])=>`matrix(${m[0]*20} ${m[1]*20} ${m[2]*20} ${m[3]*20} ${m[4]} ${m[5]})`;
function Paths({paths}:{paths:readonly FixedExitVectorPathV1[]}){
 return <>{paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} fillOpacity={p['fill-opacity']} stroke={p.stroke} strokeWidth={p['stroke-width']} strokeOpacity={p['stroke-opacity']} fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round"/>)}</>;
}
function Graph({graph:g,view}:{graph:FixedExitGraphV1;view:P047View}){
 const ref=useRef<HTMLDivElement>(null),id=useId(),b=g.viewBox,overlays=g.name==='question'?view.visual.graphOverlays:[];
 useEffect(()=>{const e=ref.current;if(!e)return;const center=()=>{if(e.clientWidth)e.scrollLeft=Math.max(0,(e.scrollWidth-e.clientWidth)/2);};center();const frame=requestAnimationFrame(center);return()=>cancelAnimationFrame(frame);},[]);
 return <div ref={ref} className="alg-l07-p047__scroll" role="region" tabIndex={0} aria-label={view.language==='es'?'Gráfico. Desplaza para ver todos los valores.':'Graph. Scroll to view all values.'} data-p047-graph-scroll={g.name}>
  <div className="alg-l07-p047__plot" data-p047-plot={g.name} style={{aspectRatio:`${b[2]} / ${b[3]}`,opacity:g.name==='question'?view.visual.graphAlpha:1}}>
   <svg viewBox={b.join(' ')} aria-hidden="true">
    <defs>{overlays.map(o=>o.clips.length>0&&<clipPath key={o.depth} id={`${id}-${o.depth}`}>{o.clips.map((r,i)=><rect key={i} x={r[0]} y={r[2]} width={r[1]-r[0]} height={r[3]-r[2]}/>)}</clipPath>)}</defs>
    {g.paths.map((p,i)=><g key={i} transform={matrix(p.matrix)} data-source-shape={p.sourceShapeId}><Paths paths={p.paths}/></g>)}
    {overlays.map(o=><g key={o.depth} opacity={o.alpha} clipPath={o.clips.length?`url(#${id}-${o.depth})`:undefined}><g transform={matrix(o.matrix)} data-source-shape={o.sourceShapeId} data-source-depth={o.depth}><Paths paths={S.graphOverlaySources.find(p=>p.sourceShapeId===o.sourceShapeId)!.paths}/></g></g>)}
   </svg>
   {g.labels.map((l,i)=><span key={i} className="alg-l07-p047__axis" data-lesson-text-block={`axis-${g.name}-${i}`} data-source-text-id={l.sourceTextId} style={{left:`${(l.x-b[0])*100/b[2]}%`,top:`${(l.y-b[1])*100/b[3]}%`}}>{l.text}</span>)}
   {g.name==='question'&&view.visual.coordinate.map(c=>c.alpha>0&&<span key={c.depth} className="alg-l07-p047__coordinate" data-lesson-text-block={`coordinate-${c.characterId}`} data-source-text-id={`character-${c.characterId}`} style={{left:`${(c.x-b[0])*100/b[2]}%`,top:`${(c.y-b[1])*100/b[3]}%`,opacity:c.alpha}}>{c.text}</span>)}
  </div>
 </div>;
}
function Formula({view}:{view:P047View}){
 const v=view.visual,alpha=(depth:number)=>v.formula.find(t=>t.depth===depth)?.alpha??0;
 if(!v.formula.some(t=>t.alpha>0))return null;
 const atom=(depth:number)=>{const row=v.formula.find(t=>t.depth===depth);return <span data-lesson-text-block={`formula-${depth}`} data-source-depth={depth} aria-hidden="true" style={{opacity:alpha(depth)}}>{row&&row.alpha>0?S.formulaTexts.find(t=>t.characterId===row.characterId)!.text:''}</span>;};
 const fraction=(top:number,bar:number,bottom:number)=>{const sourceBar=v.fractionBars.find(b=>b.depth===bar);return <span className="alg-l07-p047__fraction"><span>{atom(top)}</span><span className="alg-l07-p047__source-bar" data-lesson-text-block={`formula-bar-${bar}`} data-source-shape={sourceBar?.characterId??''} aria-hidden="true" style={{opacity:sourceBar?.alpha??0,transform:`scaleX(${p047BarProgress(v,bar)})`}}/><span>{atom(bottom)}</span></span>;};
 return <div className="alg-l07-p047__formula" data-p047-formula="true" role="math" aria-label={p047FormulaLabel(v)}>
  {atom(100)}{atom(102)}{fraction(101,103,104)}
  {alpha(105)>0&&<span className="alg-l07-p047__math-flow">{atom(105)}{fraction(107,106,108)}</span>}
  {alpha(109)>0&&<span className="alg-l07-p047__math-flow">{atom(109)}{fraction(111,110,112)}</span>}
  {alpha(113)>0&&atom(113)}
 </div>;
}
function Changes({view}:{view:P047View}){
 return <div className="alg-l07-p047__changes">{[[423,424,427],[428,429,432]].map((ids,i)=>{
  const parts=ids.map(id=>view.visual.changeTexts.find(t=>t.characterId===id)).filter(t=>t&&t.alpha>0);
  return parts.length>0&&<p key={i}>{parts.map(t=><span key={t!.characterId} data-lesson-text-block={`change-${t!.characterId}`} style={{opacity:t!.alpha}}>{t!.text}</span>)}</p>;
 })}</div>;
}
export function AlgL07P047Presentation(props:FixedExitPresentationPropsV1<P047SourceTerm,P047View>){
 const {view}=props,v=view.visual;
 const term=(key:P047SourceTerm,text:string)=><span data-source-term-flash={v.termFlash.includes(key)}>{text}</span>;
 return <FixedExitHelpPresentationV2 {...props} page="p047" source={S}
  compact={v.answerAlpha.B>0&&v.answerAlpha.A===0&&v.answerAlpha.C===0&&v.answerAlpha.D===0} move={v.bMove}
  question={<>9 The {term('Graph','graph')} shows Alex’s cell phone bill (b) in dollars as a {term('Function','function')} of his talking time (t) in minutes. {term('Calculate','Calculate')} the {term('Slope','slope')} of the {term('Line','line')} to see how much Alex is charged per minute.</>}
  renderAnswer={answer=><span data-p047-currency-rate={answer.letter}>{S.answers.find(a=>a.letter===answer.letter)!.display}</span>}
  beforeAnswers={v.graphAlpha>0&&<Graph graph={S.graphs[0]} view={view}/>}
  afterAnswers={<><Changes view={view}/><Formula view={view}/></>}
  helpDiagram={<Graph graph={S.graphs[1]} view={view}/>}
 />;
}
export function AlgL07P047Renderer(props:AnimationRendererProps){return <AlgL07P047Presentation view={algL07P047Frame(props.frame,{...props,frame:props.frame})}/>;}
